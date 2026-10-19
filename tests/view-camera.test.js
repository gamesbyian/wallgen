import test from 'node:test';
import assert from 'node:assert/strict';
import {viewCamera} from '../src/view-camera.js';
import {DESIGN_WIDTH,DESIGN_HEIGHT,normalizeRecipe,encodeRecipe,decodeRecipe,
  COLOR_STORIES,PALETTES,HUES,paletteHsl,resolveScene} from '../src/model.js';

// Coordinate transforms must agree at live-preview and exported resolutions.
// This ensures "Download PNG" samples the exact world rectangle visible in
// the phone's frame, without rescaling an already-clipped 100%-view bitmap.
test('camera retains frame centre while showing more world at zoom out',()=>{
  for(const zoom of [.5,.6,.8,1,1.25,2,2.5]){
    const p=viewCamera(600,1300,zoom),big=viewCamera(3024,6552,zoom);
    assert.equal(p.zoom,zoom);
    for(const key of ['left','right','top','bottom'])
      assert.ok(Math.abs(p.viewBounds[key]-big.viewBounds[key])<1e-9,key);
    const f=p.viewBounds;
    assert.ok(Math.abs((f.left+f.right)/2-DESIGN_WIDTH/2)<1e-9);
    assert.ok(Math.abs((f.top+f.bottom)/2-DESIGN_HEIGHT/2)<1e-9);
    assert.ok(Math.abs((f.right-f.left)-DESIGN_WIDTH/zoom)<1e-9);
    assert.ok(Math.abs((f.bottom-f.top)-DESIGN_HEIGHT/zoom)<1e-9);
    assert.ok(Math.abs((p.offsetX+p.scaleX*DESIGN_WIDTH/2)-300)<1e-9);
    assert.ok(Math.abs((big.offsetX+big.scaleX*DESIGN_WIDTH/2)-1512)<1e-9);
  }
  assert.ok(viewCamera(600,1300,.5).viewBounds.left<0);
  assert.ok(viewCamera(600,1300,.5).viewBounds.right>600);
  assert.ok(viewCamera(600,1300,.5).viewBounds.top<0);
  assert.ok(viewCamera(600,1300,.5).viewBounds.bottom>1300);
});

test('camera margin maps beyond the visible frame in logical units',()=>{
  const c=viewCamera(600,1300,.5);
  const margin={left:180,right:180,top:390,bottom:390};
  const b=c.boundsWithMargin(margin);
  assert.ok(b.left<c.viewBounds.left);
  assert.ok(b.right>c.viewBounds.right);
  assert.ok(b.top<c.viewBounds.top);
  assert.ok(b.bottom>c.viewBounds.bottom);
});

test('camera zoom round trips through recipe metadata and URI',()=>{
  for(const zoom of [.5,.7,1,1.1,1.8,2.5]){
    const r=normalizeRecipe({seed:'zoom-'+zoom,viewZoom:zoom,geometry:'wave'});
    assert.equal(r.viewZoom,zoom);
    assert.equal(decodeRecipe(encodeRecipe(r)).viewZoom,zoom);
    assert.equal(resolveScene(r).viewZoom,zoom);
  }
  assert.equal(normalizeRecipe({}).viewZoom,1);
  assert.equal(normalizeRecipe({viewZoom:.1}).viewZoom,.5);
  assert.equal(normalizeRecipe({viewZoom:8}).viewZoom,2.5);
});

test('all Color Stories generate distinct ordered seven-stripe palettes',()=>{
  assert.equal(new Set(PALETTES).size,PALETTES.length);
  assert.ok(PALETTES.length>=11);
  const variants=new Set();
  for(const palette of PALETTES){
    assert.ok(COLOR_STORIES[palette],palette);
    const scene=resolveScene({seed:'stable-palette',palette,geometry:'straight'});
    assert.equal(scene.stripes.length,7);
    assert.deepEqual(scene.stripes.map(s=>s.name),['Red','Orange','Yellow','Green','Blue','Indigo','Violet']);
    const values=scene.stripes.map(s=>s.color);
    assert.ok(values.every(c=>/^hsl\(\d+(?:\.\d+)? \d+% \d+%\)$/.test(c)),palette);
    variants.add(values.join('|'));
    assert.equal(decodeRecipe(encodeRecipe({palette})).palette,palette);
  }
  assert.equal(variants.size,PALETTES.length);
  assert.equal(HUES.length,7);
});

test('zooming the render domain does not change existing ribbon widths',async()=>{
  const {widthAt}=await import('../src/path-geometry.js');
  for(const geometry of ['straight','wave','arc','zigzag','loops','drawn']){
    const stripe={geometry,width:42,taper:.35,phase:.7,edgePhase:.35,
      coreExtent:900,segmentStart:-1800,segmentEnd:1800,endTaper:0};
    for(const station of [-750,-300,0,250,720]){
      const at100=widthAt(stripe,station,900);
      const at50=widthAt(stripe,station,1800);
      assert.ok(Math.abs(at100-at50)<1e-10,
        geometry+' width changed at station '+station);
    }
  }
});

test('zoom updates framing without changing generated scene settings',()=>{
  const initial=normalizeRecipe({seed:'same-composition',geometry:'wave',
    viewZoom:1,positionX:7,positionY:-4,textureStrength:37});
  const zoomed=normalizeRecipe({...initial,viewZoom:.6});
  for(const key of Object.keys(initial)){
    if(key!=='viewZoom')assert.deepEqual(zoomed[key],initial[key],key);
  }
  assert.deepEqual(resolveScene(zoomed).stripes,resolveScene(initial).stripes);
});


test('reframing camera pans world coordinates, not the composition or output size',()=>{
  for(const zoom of [.5,.7,1,1.4,2.5]){
    const small=viewCamera(600,1300,zoom,{panX:15,panY:-12});
    const native=viewCamera(3024,6552,zoom,{panX:15,panY:-12});
    const centered=viewCamera(600,1300,zoom);
    for(const side of ['left','right','top','bottom']){
      assert.ok(Math.abs(small.viewBounds[side]-native.viewBounds[side])<1e-9,
        side+' changes with export size at '+zoom);
    }
    assert.ok(Math.abs(small.viewBounds.left-centered.viewBounds.left-90)<1e-9);
    assert.ok(Math.abs(small.viewBounds.top-centered.viewBounds.top+156)<1e-9);
    assert.ok(Math.abs((small.viewBounds.left+small.viewBounds.right)/2-390)<1e-9);
    assert.ok(Math.abs((small.viewBounds.top+small.viewBounds.bottom)/2-494)<1e-9);
  }
  const bounded=viewCamera(600,1300,1,{panX:10000,panY:-10000});
  assert.equal(bounded.shiftX,300);
  assert.equal(bounded.shiftY,-650);
  assert.equal(viewCamera(600,1300,1,{panX:NaN}).shiftX,0);
});

test('pan remains an independent serialized frame state and leaves scene geometry untouched',()=>{
  const original=normalizeRecipe({seed:'pan-contract',geometry:'drawn',
    customPath:[[0,.5],[.5,.1],[1,.85]],viewZoom:.7,
    positionX:11,positionY:-9,viewPanX:15,viewPanY:-10});
  assert.equal(original.viewPanX,15);
  assert.equal(original.viewPanY,-10);
  const roundTrip=decodeRecipe(encodeRecipe(original));
  assert.deepEqual(roundTrip,original);
  assert.equal(normalizeRecipe({...original,viewPanX:80}).viewPanX,50);
  assert.equal(normalizeRecipe({...original,viewPanY:-80}).viewPanY,-50);
  assert.equal(normalizeRecipe({}).viewPanX,0);
  assert.equal(normalizeRecipe({}).viewPanY,0);
  const moved=normalizeRecipe({...original,viewPanX:-20,viewPanY:35});
  for(const key of Object.keys(original)){
    if(!['viewPanX','viewPanY'].includes(key))
      assert.deepEqual(original[key],moved[key],key);
  }
  assert.deepEqual(resolveScene(original).stripes,resolveScene(moved).stripes);
  assert.equal(moved.positionX,11);
  assert.equal(moved.positionY,-9);
});
