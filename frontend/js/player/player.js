import {playEffect} from "../effects/index.js";

const esc=(s)=>String(s??"");
function cssStyle(e,player=false){
  const s=e.style||{}, fs=Number(s.fontSize||24);
  return {left:`${e.x}%`,top:`${e.y}%`,width:`${e.w||40}%`,height:`${e.h||10}%`,transform:`translate(-50%,-50%) rotate(${e.rotation||0}deg)`,
    fontSize:`${fs}px`,fontWeight:s.weight||600,color:s.color||"#fff",textAlign:s.align||"center",opacity:s.opacity??1,
    textShadow:s.shadow?"0 3px 20px rgba(0,0,0,.65)":"none",background:s.background||"transparent",borderRadius:`${s.radius||0}px`,
    padding:e.type==="button"?"7px 16px":"0",boxShadow:s.glow?"0 0 28px rgba(255,90,180,.7)":"none",lineHeight:"1.15",cursor:e.type==="button"?"pointer":"default"
  }
}
export function renderScene(stage,scene,{editor=false,onElementClick=()=>{},onStageTap=()=>{}}={}){
  stage.innerHTML="";
  const bg=document.createElement("div"); bg.className="scene-bg";
  const b=scene.background||{type:"solid",value:"#111"};
  if(b.type==="image") bg.style.background=`center/cover no-repeat url("${b.value}")`;
  else if(b.type==="solid") bg.style.background=b.value||"#111";
  else bg.style.background=b.value||"linear-gradient(135deg,#120c24,#35104d)";
  stage.append(bg);
  const layers=document.createElement("div"); layers.className="layers"; stage.append(layers);
  const fx=document.createElement("div"); fx.className="fx-layer"; stage.append(fx);
  (scene.elements||[]).forEach(e=>{
    const el=document.createElement("div"); el.className="element";
    el.dataset.id=e.id; Object.assign(el.style,cssStyle(e));
    if(e.type==="photo"){const img=document.createElement("img"); img.src=e.src||""; img.alt=e.alt||"Фото"; img.draggable=false; img.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block"; el.append(img)}
    else if(e.type==="button"){el.textContent=e.text||"Продолжить"; el.classList.add("pulse")}
    else if(e.type==="placeholder"){el.textContent=e.text||"Добавь фото";}
    else if(e.type==="emoji"){el.textContent=e.text||"✨"; el.classList.add("pulse")}
    else if(e.type!=="effect"){el.textContent=esc(e.text||"")}
    if(!editor){
      const a=e.animation?.in; if(a&&a!=="none") el.classList.add(`anim-${a}`);
      if(e.type==="button") el.addEventListener("click",ev=>{ev.stopPropagation(); onElementClick(e)});
    }else {
      el.addEventListener("pointerdown",ev=>{ev.stopPropagation();onElementClick(e,ev)});
      if(["text","emoji","button","placeholder"].includes(e.type)){
        el.addEventListener("dblclick",ev=>{ev.stopPropagation();onElementClick(e,ev)});
      }
    }
    layers.append(el);
    if(e.type==="effect") playEffect(fx,e.effect,e.options||{});
  });
  if(!editor) stage.onclick=onStageTap;
  return {layers,fx};
}

export class Player{
  constructor({host,onClose,preview=false}){this.host=host;this.onClose=onClose;this.preview=preview;this.index=0;this.timer=null;this.token=0}
  async start(surprise){this.surprise=surprise;this.index=0;this.host.innerHTML="";this.shell=document.createElement("div");this.shell.className="player-shell";
    this.close=document.createElement("button");this.close.className="icon-btn player-close";this.close.textContent="✕";this.close.onclick=()=>this.closePlayer();
    this.progress=document.createElement("div");this.progress.className="player-progress";this.bar=document.createElement("i");this.progress.append(this.bar);
    this.stage=document.createElement("div");this.stage.className="stage player-stage";
    this.shell.append(this.progress,this.stage,this.close);this.host.append(this.shell);
    this.controls=document.createElement("div");this.controls.className="player-controls";
    this.prevBtn=document.createElement("button");this.prevBtn.textContent="←";this.prevBtn.onclick=()=>this.go(this.index-1);
    this.nextBtn=document.createElement("button");this.nextBtn.textContent="Дальше →";this.nextBtn.onclick=()=>this.go(this.index+1);
    this.controls.append(this.prevBtn,this.nextBtn);this.shell.append(this.controls);
    this.render();
    const tg=window.Telegram?.WebApp; try{tg?.requestFullscreen?.();tg?.expand?.();}catch{}
  }
  render(){
    clearTimeout(this.timer); const scenes=this.surprise.scenes||[]; if(this.index>=scenes.length){this.finish();return}
    const scene=scenes[this.index]; this.token++; const t=this.token;
    renderScene(this.stage,scene,{onElementClick:e=>this.action(e),onStageTap:()=>this.tap()});
    this.prevBtn.style.display=this.index?"block":"none"; this.nextBtn.style.display=scene.transition?.type==="tap"?"block":"none";
    this.bar.style.transform=`scaleX(${(this.index+1)/scenes.length})`;
    const tr=scene.transition||{}; if(tr.type==="automatic"||tr.type==="timer"){this.timer=setTimeout(()=>t===this.token&&this.go(this.index+1),Math.max(300,Number(tr.duration||3)*1000))}
  }
  action(e){const a=e.action?.type||"next"; if(a==="restart")this.go(0); else if(a==="finish")this.finish(); else if(a==="scene"){this.go(Number(e.action.sceneIndex)||0)} else this.go(this.index+1)}
  tap(){const tr=this.surprise.scenes[this.index].transition?.type;if(tr==="tap")this.go(this.index+1)}
  go(i){if(i<0||i>=this.surprise.scenes.length){if(i>=this.surprise.scenes.length)this.finish();return}this.index=i;this.render()}
  finish(){clearTimeout(this.timer);this.stage.innerHTML="";this.controls.innerHTML="";
    const f=this.surprise.settings||{};const el=document.createElement("div");el.className="final-screen";
    const h=document.createElement("h1");h.textContent=f.final_title||"✨ Сюрприз завершён";
    const p=document.createElement("p");p.textContent=f.final_text||"Надеюсь, тебе понравилось ❤️";
    const again=document.createElement("button");again.className="primary";again.style.maxWidth="320px";again.textContent="🔄 Посмотреть ещё раз";again.onclick=()=>this.go(0);
    el.append(h,p,again);this.stage.append(el);this.bar.style.transform="scaleX(1)";this.nextBtn.style.display="none";this.prevBtn.style.display="none";
  }
  closePlayer(){clearTimeout(this.timer);this.host.innerHTML="";this.onClose?.()}
}
