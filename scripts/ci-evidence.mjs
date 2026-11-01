// Preserve the real exit code and publish a compact diagnostic alongside normal logs.
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

const [stage, separator, ...command] = process.argv.slice(2);
if (!/^[a-z-]+$/.test(stage || '') || separator !== '--' || !command.length) {
  console.error('Usage: node scripts/ci-evidence.mjs <stage> -- <command> [args...]');
  process.exit(2);
}
const quote = s => /^[a-zA-Z0-9_./:=+-]+$/.test(s) ? s : "'" + s.replaceAll("'", "'\\''") + "'";
const invocation = command.map(quote).join(' ');
const runUrl = (process.env.GITHUB_SERVER_URL || 'https://github.com') + '/' +
  (process.env.GITHUB_REPOSITORY || 'gamesbyian/wallgen') + '/actions/runs/' + (process.env.GITHUB_RUN_ID || 'unknown');
const clean = s => String(s)
  .replace(/\u001b\[[0-9;]*m/g, '')
  .replace(/(authorization\s*[:=]\s*)(?:bearer|basic)?\s*[^\s,;]+/ig, '$1[REDACTED]')
  .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{12,})\b/g, '[REDACTED]')
  .replace(/([?&](?:token|key|secret|password)=)[^&\s]+/ig, '$1[REDACTED]');
let tail = '';
let firstError = '';
let pending = '';
function record(chunk, stream) {
  stream.write(chunk);
  const value = clean(chunk.toString('utf8'));
  tail = (tail + value).slice(-10000);
  pending += value;
  const lines = pending.split(/\r?\n/);
  pending = lines.pop() || '';
  if (!firstError) firstError = lines.find(line => /(?:^not ok\b|AssertionError|ERR_|Error:|error:|fatal:|npm error)/i.test(line)) || '';
}
let code = 1;
let signal = null;
let startupError = null;
const started = Date.now();
try {
  const child = spawn(command[0], command.slice(1), { stdio: ['inherit', 'pipe', 'pipe'] });
  child.stdout.on('data', c => record(c, process.stdout));
  child.stderr.on('data', c => record(c, process.stderr));
  const result = await new Promise(resolve => {
    child.on('error', error => resolve({ error }));
    child.on('close', (exitCode, exitSignal) => resolve({ exitCode, exitSignal }));
  });
  startupError = result.error ? String(result.error.message) : null;
  code = result.exitCode ?? 1;
  signal = result.exitSignal || null;
} catch (error) { startupError = String(error.message); }
const ok = !startupError && code === 0 && !signal;
const first = clean(startupError || firstError || pending || tail.split('\n').find(l => /error|fail/i.test(l)) || 'No diagnostic line captured').slice(0, 400);
const report = {
  schemaVersion: 1, evidence: 'observed', status: ok ? 'passed' : 'failed',
  stage, command: invocation, ref: process.env.GITHUB_REF || null,
  sha: process.env.GITHUB_SHA || null, event: process.env.GITHUB_EVENT_NAME || null,
  runUrl, job: process.env.GITHUB_JOB || null, exitCode: code, signal,
  elapsedMs: Date.now() - started,
  failureClass: startupError ? 'setup' : /AssertionError|not ok/.test(first) ? 'assertion' : 'unclassified',
  firstRelevantLine: ok ? null : first,
  boundedExcerpt: ok ? null : clean(tail).slice(-6000),
  expected: null, actual: null,
  nextAction: ok ? null : 'Inspect this stage in the linked run; reproduce: ' + invocation
};
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '### ' + stage + ': ' + (ok ? 'PASS' : 'FAIL') + '\n' +
    '- Source: ' + (report.sha || 'unknown') + '\n' +
    '- Duration: ' + (report.elapsedMs / 1000).toFixed(1) + 's\n' +
    '- Reproduce: ' + invocation + '\n' +
    (ok ? '' : '- First relevant line: ' + first.replace(/[\r\n|]/g, ' ') + '\n') + '\n');
}
if (!ok) {
  mkdirSync('artifacts/ci', { recursive: true });
  writeFileSync('artifacts/ci/' + stage + '.json', JSON.stringify(report, null, 2) + '\n');
  console.error('CI failure digest: artifacts/ci/' + stage + '.json; full logs: ' + runUrl);
}
process.exitCode = ok ? 0 : (code || 1);
