import {initTelegram} from "./core/telegram.js";
import {setInitData,api} from "./core/api.js";
import {clone,uid,toast,esc,$} from "./core/utils.js";
import {renderScene,Player} from "./player/player.js";

const tg=initTelegram(); setInitData(tg.initData);
const app=$("#app"); let myItems=[]; let current=null; let selected=null; let sceneIndex=0; let editing=false; let player=null; let drag=null;

function shell(content,nav=true){
 app.innerHTML=`<div class="app-shell"><div class="topbar"><div class="brand"><span>✨</span> SurpriseBox</div><div class="spacer"></div><button class="icon-btn" id="refresh">↻</button></div>${content}</div>`;
 if(nav) addNav();
 $("#refresh")?.addEventListener("click",()=>loadHome());
}
function addNav(){
 const n=document.createElement("nav");n.className="bottom-nav";n.innerHTML=`<button data-v="home"><span class="emoji">🏠</span>Главная</button><button data-v="mine"><span class="emoji">❤️</span>Мои</button><button data-v="templates"><span class="emoji">🎨</span>Шаблоны</button>`;
 n.querySelectorAll("button").forEach(b=>b.onclick=()=>b.dataset.v==="home"?loadHome():b.dataset.v==="mine"?loadMine():loadTemplates());app.querySelector(".app-shell").append(n);
}
function setActive(v){document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.v===v))}
async function loadHome(){
 setActive("home");
 let mine=[];
 try{mine=(await api.list()).items;myItems=mine}catch{}
 shell(`<section class="hero"><div class="eyebrow">ИНТЕРАКТИВНЫЕ ИСТОРИИ</div><h1>Создай сюрприз,<br>который захочется открыть.</h1><p>Собери несколько сцен, добавь фото, текст и эффекты — и отправь маленький интерактивный фильм прямо в Telegram.</p><div style="margin-top:22px"><button class="primary" id="create">✨ Создать сюрприз</button></div></section>
 <div class="grid"><button class="feature" id="magic"><div style="font-size:30px">🎲</div><b>Удиви меня</b><small>Случайный готовый сценарий, который можно изменить.</small></button><button class="feature" id="tpl"><div style="font-size:30px">🎨</div><b>Шаблоны</b><small>Love, Birthday, Space, Gift и другие.</small></button></div>
 <div class="section-title"><h2>Твои сюрпризы</h2><button class="ghost-btn" id="mine">Все</button></div>
 <div id="recent" class="cards"></div>`,true);
 renderCards($("#recent"),mine.slice(0,4));
 $("#create").onclick=()=>createNew();
 $("#magic").onclick=()=>createMagic();
 $("#tpl").onclick=()=>loadTemplates();
 $("#mine").onclick=()=>loadMine();
 if(!tg.available) toast("Открой приложение из Telegram, чтобы создавать и сохранять сюрпризы.");
}
function renderCards(host,items){
 if(!items.length){host.className="empty";host.textContent="Пока нет сюрпризов. Создай первый — он появится здесь.";return}
 host.className="cards";host.innerHTML=items.map(s=>`<article class="card"><h3>${esc(s.title)}</h3><div class="stat">👀 ${s.open_count||0} открытий</div><div class="card-actions"><button data-act="preview" data-id="${s.id}">▶ Preview</button><button data-act="edit" data-id="${s.id}">✏️ Редакт.</button><button class="send" data-act="send" data-id="${s.id}">📤 Отправить</button><button data-act="delete" data-id="${s.id}">🗑 Удалить</button></div></article>`).join("");
 host.querySelectorAll("button").forEach(b=>b.onclick=async()=>{const s=items.find(x=>x.id===b.dataset.id);try{
   if(b.dataset.act==="preview")startPlayer(s,true);
   if(b.dataset.act==="edit")openEditor(s);
   if(b.dataset.act==="send"){await api.share(s.id);toast("Сообщение отправлено тебе в Telegram");}
   if(b.dataset.act==="delete"&&confirm("Удалить этот сюрприз?")){await api.del(s.id);loadMine()}
 }catch(e){toast(e.message)}})
}
async function loadMine(){
 setActive("mine");let items=[];try{items=(await api.list()).items;myItems=items}catch(e){toast(e.message)}
 shell(`<section class="hero" style="padding-top:16px"><div class="eyebrow">КОЛЛЕКЦИЯ</div><h1 style="font-size:32px">❤️ Мои сюрпризы</h1><p>Редактируй, отправляй и открывай их снова — счётчик считает каждый новый запуск.</p></section><div class="section-title"><h2>${items.length} сюрпризов</h2><button class="ghost-btn" id="new2">＋</button></div><div id="list"></div>`,true);
 renderCards($("#list"),items);$("#new2").onclick=createNew;
}
async function loadTemplates(){
 setActive("templates");let ts=[];try{ts=await api.templates()}catch{}
 const icons={love:"❤️",birthday:"🎂",gift:"🎁",space:"🌌",prank:"😂",sad:"🥺",party:"🎉",dark:"🖤"};
 shell(`<section class="hero" style="padding-top:16px"><div class="eyebrow">БЫСТРЫЙ СТАРТ</div><h1 style="font-size:32px">🎨 Шаблоны</h1><p>Каждый шаблон — обычный сюрприз, его можно полностью переделать в редакторе.</p></section><div class="cards" id="tpls"></div>`,true);
 $("#tpls").innerHTML=ts.map(t=>`<button class="card" data-key="${t.key}" style="text-align:left"><div style="font-size:34px">${icons[t.key]||"✨"}</div><h3 style="margin-top:14px">${esc(t.name.replace(/^.\s/,""))}</h3><div class="stat">Создать основу →</div></button>`).join("");
 $("#tpls").querySelectorAll("button").forEach(b=>b.onclick=async()=>{try{openEditor(await api.create({template:b.dataset.key,title:ts.find(x=>x.key===b.dataset.key)?.name}))}catch(e){toast(e.message)}})
}
async function createNew(){
 try{openEditor(await api.create({title:"✨ Новый сюрприз",theme:"love"}))}catch(e){toast(e.message)}
}
async function createMagic(){
 try{openEditor(await api.create({kind:"magic",title:"🎁 Magic Gift"}))}catch(e){toast(e.message)}
}

function openEditor(s){
 current=clone(s);editing=true;sceneIndex=0;selected=null;renderEditor();
}
function scene(){return current.scenes[sceneIndex]}
function renderEditor(){
 const s=scene();
 app.innerHTML=`<div class="app-shell editor"><div class="topbar"><button class="icon-btn" id="back">←</button><div class="brand">${esc(current.title)}</div><div class="spacer"></div><button class="ghost-btn" id="play">▶</button><button class="ghost-btn" id="sendtop">📤</button></div>
 <div class="editor-main"><div class="stage-wrap"><div class="workspace-title"><span>Рабочая область</span><small>Перетаскивай элементы прямо здесь</small></div><div id="editor-stage" class="stage"></div></div><aside class="editor-side"><div class="toolbar"><button class="tool" data-add="text">📝 Текст</button><button class="tool" data-add="photo">🖼 Фото</button><button class="tool" data-add="button">🔘 Кнопка</button><button class="tool" data-add="effect">✨ Эффект</button><button class="tool" data-add="background">🎨 Фон</button><button class="tool" data-add="scene">＋ Сцена</button></div><div class="scene-tabs" id="scenes"></div><div id="props"></div></aside></div>
 <div class="editor-footer"><button id="deleteScene">Удалить сцену</button><button id="save" class="save">💾 Сохранить</button></div></div>`;
 $("#back").onclick=()=>loadMine();$("#play").onclick=()=>startPlayer(current,true);$("#sendtop").onclick=shareCurrent;$("#save").onclick=saveCurrent;$("#deleteScene").onclick=deleteScene;
 $(".toolbar")?.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addThing(b.dataset.add));
 renderSceneTabs();renderEditorStage();renderProps();
}
function renderSceneTabs(){
 const h=$("#scenes");
 h.innerHTML=current.scenes.map((x,i)=>`<div class="scene-tab-wrap" draggable="true" data-i="${i}"><button class="scene-tab ${i===sceneIndex?"active":""}" data-i="${i}">${esc(x.name||`Сцена ${i+1}`)}</button><button class="scene-move" data-dir="left" data-i="${i}" title="Влево">‹</button><button class="scene-move" data-dir="right" data-i="${i}" title="Вправо">›</button></div>`).join("");
 h.querySelectorAll(".scene-tab").forEach(b=>b.onclick=()=>{sceneIndex=+b.dataset.i;selected=null;renderEditor()});
 h.querySelectorAll(".scene-move").forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();moveScene(+b.dataset.i,b.dataset.dir)});
 h.querySelectorAll(".scene-tab-wrap").forEach(w=>{
   w.addEventListener("dragstart",()=>w.classList.add("dragging"));
   w.addEventListener("dragend",()=>w.classList.remove("dragging"));
   w.addEventListener("dragover",ev=>ev.preventDefault());
   w.addEventListener("drop",ev=>{ev.preventDefault();const from=+w.dataset.i;const dragging=h.querySelector(".dragging");if(!dragging)return;const to=+dragging.dataset.i;if(from!==to)reorderScenes(from,to)});
 });
}
function moveScene(i,dir){const to=dir==="left"?i-1:i+1;if(to<0||to>=current.scenes.length)return;reorderScenes(i,to)}
function reorderScenes(from,to){const arr=current.scenes;const [item]=arr.splice(from,1);arr.splice(to,0,item);if(sceneIndex===from)sceneIndex=to;else if(from<sceneIndex&&to>=sceneIndex)sceneIndex--;else if(from>sceneIndex&&to<=sceneIndex)sceneIndex++;selected=null;renderEditor()}

function renderEditorStage(){
 const st=$("#editor-stage");
 renderScene(st,scene(),{editor:true,onElementClick:(e,ev)=>{
   if(ev.pointerType==="mouse"&&ev.button!==0)return;
   selected=e;
   const node=st.querySelector(`[data-id="${e.id}"]`);
   if(node){
     node.classList.add("selected");
     node.setPointerCapture?.(ev.pointerId);
     if(!node.querySelector(".handle")){const h=document.createElement("i");h.className="handle";node.append(h);}
     if(!node.querySelector(".rotate-handle")){const r=document.createElement("i");r.className="rotate-handle";node.append(r);}
   }
   beginDrag(e,ev);
   renderProps();
   focusTextEditorIfNeeded(false);
 }});
 if(selected){const node=st.querySelector(`[data-id="${selected.id}"]`);node?.classList.add("selected");}
}
function beginDrag(e,ev){
 if(ev.pointerType==="mouse"&&ev.button!==0)return;
 const st=$("#editor-stage"), rect=st.getBoundingClientRect();
 const sx=ev.clientX, sy=ev.clientY;
 const start={x:e.x,y:e.y};
 let moved=false;
 const move=(v)=>{
   const dx=(v.clientX-sx)/rect.width*100;
   const dy=(v.clientY-sy)/rect.height*100;
   if(Math.abs(dx)+Math.abs(dy)>0.5)moved=true;
   e.x=Math.max(0,Math.min(100,start.x+dx));
   e.y=Math.max(0,Math.min(100,start.y+dy));
   const n=st.querySelector(`[data-id="${e.id}"]`);
   if(n){n.style.left=e.x+"%";n.style.top=e.y+"%";}
 };
 const up=()=>{
   window.removeEventListener("pointermove",move);
   window.removeEventListener("pointerup",up);
   window.removeEventListener("pointercancel",up);
   renderProps();
 };
 window.addEventListener("pointermove",move,{passive:false});
 window.addEventListener("pointerup",up,{once:true});
 window.addEventListener("pointercancel",up,{once:true});
}
function focusTextEditorIfNeeded(force){
 if(!selected || !["text","emoji","button","placeholder"].includes(selected.type))return;
 const input=$("#etext");
 if(!input)return;
 if(force){input.focus();input.select();}
}
function renderProps(){
 const p=$("#props");if(!p)return;
 const bg=scene().background||{};
 const bgType=bg.type||"solid";
 p.innerHTML=`<div class="field"><label>Название сцены</label><input id="sceneName" value="${esc(scene().name||"")}"></div>
 <div class="field"><label>Фон сцены</label><div class="row"><select id="bgType"><option value="solid">Однотонный</option><option value="gradient">Градиент</option><option value="image">Изображение</option></select><input id="bgColor" type="color" value="${bgType==="solid"&&/^#([0-9a-f]{6})$/i.test(bg.value||"")?bg.value:"#120c24"} "></div></div>
 <div class="field" id="bgValueWrap"><label>Значение фона</label><input id="bg" value="${esc(bg.value||"#120c24")}"></div>
 <div class="row"><div class="field"><label>Переход</label><select id="transition"><option value="tap">Tap</option><option value="automatic">Automatic</option><option value="timer">Timer</option></select></div><div class="field"><label>Секунды</label><input id="duration" type="number" step=".1" min=".3" value="${scene().transition?.duration||3}"></div></div>
 ${selected?elementProps(selected):`<div class="muted" style="padding:18px 5px;line-height:1.5">Выбери объект на сцене. Его можно двигать пальцем или мышью.</div>`}`;
 $("#transition").value=scene().transition?.type||"tap";
 $("#sceneName").oninput=e=>scene().name=e.target.value.slice(0,40);
 $("#bg").oninput=e=>{scene().background={type:"gradient",value:e.target.value};renderEditorStage()};
 $("#transition").onchange=e=>scene().transition.type=e.target.value;
 $("#duration").oninput=e=>scene().transition.duration=Math.max(.3,+e.target.value||3);
}
function elementProps(e){
 const s=e.style||{};let extra="";
 if(e.type==="text"||e.type==="emoji"||e.type==="button"||e.type==="placeholder")extra=`<div class="field text-editor-field"><label>Текст</label><textarea id="etext" rows="3" spellcheck="false">${esc(e.text||"")}</textarea><button type="button" class="secondary edit-text-btn" id="editText">✏️ Редактировать текст</button><div class="field-hint">Можно редактировать здесь или дважды нажать на текст на сцене.</div></div>`;
 if(e.type==="photo")extra=`<div class="field"><label>Фото</label><button class="secondary" id="replacePhoto">Выбрать фото</button></div>`;
 if(e.type==="effect")extra=`<div class="field"><label>Эффект</label><select id="effect"><option value="hearts">❤️ Hearts</option><option value="confetti">🎉 Confetti</option><option value="stars">🌌 Stars</option><option value="sparkles">✨ Sparkles</option><option value="rain">🌧 Rain</option><option value="glitch">🖤 Glitch</option><option value="smoke">💨 Smoke</option></select><div class="field-hint">Здесь меняется текущий эффект, новый поверх него не добавляется.</div></div>`;
 return `<div class="field"><b>Выбран: ${e.type}</b></div>${extra}<div class="row"><div class="field"><label>X %</label><input id="ex" type="number" value="${e.x}"></div><div class="field"><label>Y %</label><input id="ey" type="number" value="${e.y}"></div></div><div class="row"><div class="field"><label>Ширина %</label><input id="ew" type="number" value="${e.w}"></div><div class="field"><label>Высота %</label><input id="eh" type="number" value="${e.h}"></div></div><div class="row"><div class="field"><label>Размер</label><input id="efs" type="number" value="${s.fontSize||24}"></div><div class="field"><label>Поворот</label><input id="er" type="number" value="${e.rotation||0}"></div></div><button class="secondary" id="dup">⧉ Дублировать</button><button class="secondary" id="remove" style="margin-top:7px">🗑 Удалить объект</button>`;
}
function bindPropInputs(){
 const e=selected;if(!e)return;
 const set=(id,fn,rerender=true)=>{const x=$("#"+id);if(x)x.oninput=()=>{fn(x.value);if(rerender)renderEditorStage()}};
 set("etext",v=>{e.text=v;const n=$("#editor-stage")?.querySelector(`[data-id="${e.id}"]`);if(n)n.textContent=v},false);
 $("#editText")?.addEventListener("click",()=>{const x=$("#etext");x?.focus();x?.select()});
 set("ex",v=>e.x=+v||0);set("ey",v=>e.y=+v||0);set("ew",v=>e.w=Math.max(5,+v||5));set("eh",v=>e.h=Math.max(3,+v||3));set("efs",v=>e.style.fontSize=Math.max(8,+v||8));set("er",v=>e.rotation=+v||0);
 if($("#effect")){ $("#effect").value=e.effect||"sparkles"; $("#effect").addEventListener("change",x=>{e.effect=x.target.value;renderEditorStage()}); }
 $("#dup")?.addEventListener("click",()=>{const c=clone(e);c.id=uid("el_");c.x=Math.min(95,c.x+4);c.y=Math.min(95,c.y+4);scene().elements.push(c);selected=c;renderEditor()});
 $("#remove")?.addEventListener("click",()=>{scene().elements=scene().elements.filter(x=>x.id!==e.id);selected=null;renderEditor()});
 $("#replacePhoto")?.addEventListener("click",()=>choosePhoto(e));
}
function renderPropsAndBind(){renderProps();bindPropInputs()}
const oldRenderProps=renderProps; renderProps=function(){oldRenderProps();bindPropInputs()};
async function choosePhoto(e){
 const input=document.createElement("input");input.type="file";input.accept="image/jpeg,image/png,image/webp,image/gif";input.onchange=async()=>{if(!input.files[0])return;try{toast("Загружаю фото…");e.src=(await api.upload(input.files[0])).url;e.type="photo";renderEditor()}catch(x){toast(x.message)}};input.click();
}
async function chooseBackgroundImage(){
 const input=document.createElement("input");input.type="file";input.accept="image/jpeg,image/png,image/webp";
 input.onchange=async()=>{if(!input.files[0])return;try{toast("Загружаю фон…");const u=await api.upload(input.files[0]);scene().background={type:"image",value:u.url};renderEditor()}catch(e){toast(e.message)}};input.click();
}

function addThing(type){
 if(type==="background"){chooseBackgroundImage();return}
 if(type==="effect"){
   if(selected?.type==="effect"){selected.effect=selected.effect||"sparkles";renderEditor();return}
   const existing=scene().elements.find(x=>x.type==="effect");
   if(existing){selected=existing;renderEditor();return}
 }
 if(type==="scene"){current.scenes.push({id:uid("scene_"),name:`Сцена ${current.scenes.length+1}`,background:{type:"gradient",value:"#120c24"},elements:[],transition:{type:"tap",duration:3}});sceneIndex=current.scenes.length-1;selected=null;renderEditor();return}
 if(type==="photo"){const e={id:uid("el_"),type:"photo",src:"",alt:"Фото",x:50,y:50,w:72,h:45,rotation:0,style:{radius:22,shadow:true},animation:{in:"fadeUp"}};scene().elements.push(e);selected=e;choosePhoto(e);return}
 const base={id:uid("el_"),type,x:50,y:50,w:type==="effect"?100:60,h:type==="effect"?100:12,rotation:0,style:{fontSize:type==="button"?17:28,color:"#fff",weight:700,align:"center",background:type==="button"?"#ff4f9a":"transparent",radius:type==="button"?999:0},animation:{in:"fadeUp",out:"none",duration:700}};
 if(type==="text")base.text="Новый текст";
 if(type==="button"){base.text="Продолжить";base.action={type:"next"}}
 if(type==="effect"){base.effect="sparkles";base.options={density:28}}
 scene().elements.push(base);selected=base;renderEditor();
}
async function saveCurrent(){
 try{current=await api.update(current.id,current);toast("Сохранено ✓")}catch(e){toast(e.message)}
}
async function shareCurrent(){try{await saveCurrent();await api.share(current.id);toast("Готово — сообщение отправлено в Telegram")}catch(e){toast(e.message)}}
async function deleteScene(){
 if(current.scenes.length<=1){toast("Нужна хотя бы одна сцена");return}
 current.scenes.splice(sceneIndex,1);sceneIndex=Math.max(0,sceneIndex-1);selected=null;renderEditor()
}
async function startPlayer(s,preview=false){
 if(!preview){try{s=await api.open(s.id)}catch(e){toast(e.message);return}}
 player=new Player({host:app,onClose:()=>{if(editing)renderEditor();else loadHome()},preview});
 await player.start(clone(s));
}
async function boot(){
 try{
   await api.health();

   // A Main Mini App deep link such as https://t.me/<bot>?startapp=<surprise_id>
   // must open the requested surprise directly, not the home screen. Telegram can
   // expose the parameter as start_param or tgWebAppStartParam depending on the client.
   const start=String(tg.startParam||"").trim();
   if(start){
     const s=await api.get(start);
     editing=false;
     await startPlayer(s,false);
     return;
   }

   await loadHome();
 }catch(e){
   shell(`<section class="hero"><div class="eyebrow">SURPRISEBOX</div><h1>Не удалось открыть сюрприз</h1><p>${esc(e.message||"Неизвестная ошибка")}</p><div style="margin-top:20px"><button class="primary" id="retry">Повторить</button></div></section>`,false);
   $("#retry").onclick=boot;
 }
}
boot();
