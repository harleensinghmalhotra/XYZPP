// Extract transform/opacity deltas for key hero elements across the 5 probes.
const fs=require('fs'),path=require('path');
const OUT=__dirname;
const ys=[0,400,900,1500,2200];
const probes=ys.map(y=>JSON.parse(fs.readFileSync(path.join(OUT,'dom-probe-'+y+'.json'),'utf8')));

// decompose a matrix() into scale/translate for readability
function decomp(t){
  if(!t||t==='none') return 'none';
  const m=t.match(/matrix\(([^)]+)\)/); if(m){
    const [a,b,c,d,e,f]=m[1].split(',').map(parseFloat);
    const sx=Math.hypot(a,b), sy=Math.hypot(c,d);
    return `s(${sx.toFixed(3)},${sy.toFixed(3)}) t(${e.toFixed(0)},${f.toFixed(0)})`;
  }
  const m3=t.match(/matrix3d\(([^)]+)\)/); if(m3){
    const n=m3[1].split(',').map(parseFloat);
    return `s(${Math.hypot(n[0],n[1]).toFixed(3)},${Math.hypot(n[4],n[5]).toFixed(3)}) t(${n[12].toFixed(0)},${n[13].toFixed(0)},${n[14].toFixed(0)})`;
  }
  return t.slice(0,40);
}

// pick representative elements by class substring
const keys=['hero-section$','hero-section_content','hero-section_graph-wrapper','hero-section_bg-detail1','hero-section_bg-detail2','hero-section_scroll-wrapper','seal','navbar$'];
function findEl(p,keyRaw){
  const exact=keyRaw.endsWith('$'); const key=keyRaw.replace('$','');
  return p.elements.find(e=>{
    const c=(e.classes||'');
    if(exact) return c.split(/\s+/).includes(key);
    return c.includes(key);
  });
}
// Also list all elements with a non-identity transform or opacity<1 at ANY probe, to catch the animated ones
const animatedClasses=new Set();
probes.forEach(p=>p.elements.forEach(e=>{
  const tf=e.transform&&e.transform!=='none';
  const op=parseFloat(e.opacity)<0.999;
  if(tf||op) animatedClasses.add((e.classes||e.tag)+' :: '+e.tag);
}));

console.log('=== HERO STICKY / WRAPPER ===');
probes.forEach((p,i)=>console.log(`scrollY=${ys[i]}: heroSticky=${JSON.stringify(p.heroSticky)} wrapper=${p.scrollWrapper?p.scrollWrapper.position+' h'+p.scrollWrapper.height+' top'+p.scrollWrapper.top:'?'}`));

console.log('\n=== KEY ELEMENT TRANSFORM / OPACITY ACROSS SCROLL ===');
for(const k of keys){
  console.log('\n['+k+']');
  probes.forEach((p,i)=>{
    const e=findEl(p,k);
    if(!e){console.log(`  y=${ys[i]}: (not found)`);return;}
    console.log(`  y=${String(ys[i]).padStart(4)}: op=${e.opacity} tf=${decomp(e.transform)} rect(y=${e.rect.y},h=${e.rect.h}) pos=${e.position} z=${e.zIndex} wc=${e.willChange} ovf=${e.overflow}`);
  });
}

console.log('\n=== ALL ANIMATED (transform!=none or opacity<1 at some probe) ===');
[...animatedClasses].sort().forEach(c=>console.log('  '+c));

// Full per-probe dump of every element that changes transform/opacity between probes
console.log('\n=== ELEMENTS THAT CHANGE BETWEEN PROBES ===');
const byClass={};
probes.forEach((p,i)=>p.elements.forEach(e=>{
  const id=(e.classes||e.tag)+'#'+(e.text||'').slice(0,12);
  byClass[id]=byClass[id]||{};
  byClass[id][ys[i]]={op:e.opacity,tf:decomp(e.transform),y:e.rect.y,h:e.rect.h};
}));
Object.entries(byClass).forEach(([id,vals])=>{
  const series=ys.map(y=>vals[y]).filter(Boolean);
  const tfset=new Set(series.map(v=>v.tf));
  const opset=new Set(series.map(v=>v.op));
  if(tfset.size>1||opset.size>1){
    console.log('\n • '+id);
    ys.forEach(y=>{ if(vals[y]) console.log(`     y=${String(y).padStart(4)}: op=${vals[y].op} tf=${vals[y].tf} rectY=${vals[y].y} h=${vals[y].h}`); });
  }
});
