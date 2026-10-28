// Image tool replies must carry MCP image content. Serializing an image as
// JSON text prevents capable chat clients from visually inspecting the art.
export function pngImageResult(bytes, detail) {
  const signature=[137,80,78,71,13,10,26,10];
  if (!(bytes instanceof Uint8Array) || bytes.length<64 ||
      bytes.length>3*1024*1024 || signature.some((value,i)=>bytes[i]!==value))
    throw Error('Hosted preview must be a bounded PNG image');
  let binary='';
  // String.fromCharCode(...allPixels) overflows the JS argument stack.
  for (let i=0;i<bytes.length;i+=32768)
    binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return {content:[
    {type:'image',data:btoa(binary),mimeType:'image/png'},
    {type:'text',text:JSON.stringify(detail)}
  ]};
}
