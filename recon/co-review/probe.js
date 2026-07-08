(function(){
  function dec(el){
    if(!el) return null;
    var s=getComputedStyle(el), m=s.transform, r=el.getBoundingClientRect();
    var tx=0,ty=0,sc=1,rot=0;
    if(m && m.indexOf("matrix")===0){
      var n=m.replace(/matrix\(|matrix3d\(|\)/g,"").split(",").map(parseFloat);
      if(m.indexOf("matrix3d")===0){ var a=n[0],b=n[1]; sc=Math.sqrt(a*a+b*b); rot=Math.atan2(b,a)*180/Math.PI; tx=n[12]; ty=n[13]; }
      else { var a2=n[0],b2=n[1]; sc=Math.sqrt(a2*a2+b2*b2); rot=Math.atan2(b2,a2)*180/Math.PI; tx=n[4]; ty=n[5]; }
    }
    var vh=window.innerHeight, vw=window.innerWidth;
    var onScreen = r.bottom>0 && r.top<vh && r.right>0 && r.left<vw && sc>0.02 && parseFloat(s.opacity)>0.02;
    return { op:+parseFloat(s.opacity).toFixed(4), ty:+ty.toFixed(1), sc:+sc.toFixed(3), rot:+rot.toFixed(1),
             top:Math.round(r.top), onScreen:onScreen };
  }
  function q(sel){ return dec(document.querySelector(sel)); }
  return JSON.stringify({
    y: Math.round(window.scrollY),
    head: q(".hero-section_content_title-wrapper"),
    content: q(".hero-section_content"),
    nav: q(".navbar"),
    seal: q(".hero-section_content_title-line_seal"),
    bookWrap: q(".hero-section_graph-wrapper"),
    book: q(".hero-section_graph_book"),
    s1: q(".hero-section_graph-details1"),
    s3: q(".hero-section_graph-details3"),
    s5: q(".hero-section_graph-details5"),
    scrollPill: q(".hero-section_scroll-wrapper"),
    svcCurve: q(".services-section-divisor-wrapper")
  });
})()