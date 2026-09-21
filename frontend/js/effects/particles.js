export function spawnParticles(layer,{glyph="✨",density=24}={}){
  const n=Math.min(Number(density)||24,60);
  const nodes=[];
  for(let i=0;i<n;i++){
    const el=document.createElement("span"); el.className="particle"; el.textContent=glyph;
    el.style.left=(10+Math.random()*80)+"%"; el.style.top=(35+Math.random()*30)+"%";
    el.style.setProperty("--dx",`${(Math.random()-.5)*260}px`);
    el.style.setProperty("--dy",`${-60-Math.random()*330}px`);
    el.style.setProperty("--rot",`${(Math.random()-.5)*300}deg`);
    el.style.animationDelay=`${Math.random()*.6}s`;
    layer.append(el); nodes.push(el);
  }
  setTimeout(()=>nodes.forEach(x=>x.remove()),3800);
}
