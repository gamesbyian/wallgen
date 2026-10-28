import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlEscape, permittedGitHubIdentity, configurationReady} from '../cloudflare/auth/src/safety.js';

test('consent UI safely escapes hostile MCP client metadata',()=>{
  const payload='<img src=x onerror="alert(1)">&\'';
  const escaped=htmlEscape(payload);
  assert.equal(escaped,'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
  assert.ok(!escaped.includes('<img'));
});
test('GitHub IDs are stable numeric allowlist matches; logins or empty allowlists cannot pass',()=>{
  assert.equal(permittedGitHubIdentity({id:123,login:'tester'},'123,456'),true);
  assert.equal(permittedGitHubIdentity({id:123,login:'tester'},'tester'),false);
  assert.equal(permittedGitHubIdentity({id:123,login:'tester'},'1234,456'),false);
  assert.equal(permittedGitHubIdentity({id:'123',login:'tester'},'123'),false);
  assert.equal(permittedGitHubIdentity({id:123,login:'tester'},''),false);
});
test('production authentication refuses placeholders and absent secrets',()=>{
  const valid={AUTH_SERVER_URL:'https://auth.example.org',
    MCP_SERVER_URL:'https://mcp.example.org/mcp',
    GITHUB_CLIENT_ID:'real-client-id',GITHUB_CLIENT_SECRET:'test-secret',
    ALLOWED_GITHUB_IDS:'123'};
  assert.equal(configurationReady(valid),true);
  assert.equal(configurationReady({...valid,GITHUB_CLIENT_SECRET:''}),false);
  assert.equal(configurationReady({...valid,MCP_SERVER_URL:'https://REPLACE-MCP-HOST/mcp'}),false);
  assert.equal(configurationReady({...valid,GITHUB_CLIENT_ID:'REPLACE_GITHUB_CLIENT_ID'}),false);
  assert.equal(configurationReady({...valid,ALLOWED_GITHUB_IDS:''}),false);
});
