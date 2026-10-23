// Compact artist-intent vocabulary for the existing Light → Photo destination.
// This describes WHERE to work, never automatically selects or saves a preset.
// Keep vague words ('grain', 'glow', 'texture', 'lighting') available to their
// ordinary editor controls instead of hijacking ambiguous searches.
const PHRASES=Object.freeze([
  ['photo','Photo finishing'],['photography','Photo finishing'],
  ['film','Film finishing'],['35mm','Film finishing'],
  ['smartphone','Smartphone HDR'],['iphone','Smartphone HDR'],
  ['pixel camera','Smartphone HDR'],['dslr','Interchangeable-lens crisp'],
  ['webcam','Low-res webcam'],['digital camera','Digital camera'],
  ['cinematic','Film finishing'],['halation','Warm halation'],
  ['colour negative','Muted negative print'],['color negative','Muted negative print'],
  ['negative print','Muted negative print'],['true-black negative','Deep-black negative print'],
  ['keep black film','Deep-black negative print'],
  ['wide halation','Wide warm film diffusion'],['light diffusion','Wide warm film diffusion'],
  ['warm fringe','Wide warm film diffusion'],['photo bloom','Wide warm film diffusion'],
  ['optical bloom','Wide warm film diffusion'],['photographic bloom','Wide warm film diffusion'],
  ['old digicam','Early digital compact'],['retro digicam','Early digital compact'],
  ['early digicam','Early digital compact'],['ccd camera','Early digital compact'],
  ['high dynamic range','Smartphone HDR'],
  ['black and white print','Monochrome film'],['b&w film','Monochrome film'],
  ['lens acutance','Interchangeable-lens crisp'],
  ['film grain','Film grain'],['photographic grain','Film grain'],
  ['darkroom','Film finishing'],['emulsion','Film finishing']
]);
const canonical=text=>String(text??'').toLowerCase().trim().replace(/\s+/g,' ');
export function findPhotoIntent(query){
  const value=canonical(query);
  if(!value)return null;
  for(const [phrase,lookHint] of PHRASES)
    if(value===phrase||value.startsWith(phrase+' ')||
      value.startsWith(phrase+'-'))
      return {lookHint};
  return null;
}
