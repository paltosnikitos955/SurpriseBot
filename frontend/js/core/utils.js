export const $=(s,p=document)=>p.querySelector(s);
export const $$=(s,p=document)=>[...p.querySelectorAll(s)];
export const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
export const clone=x=>JSON.parse(JSON.stringify(x));
export const uid=p=>p+Math.random().toString(36).slice(2,10);
export function toast(text){const x=document.createElement("div");x.textContent=text;x.style.cssText="position:fixed;left:50%;bottom:95px;transform:translateX(-50%);z-index:999;background:rgba(20,20,28,.94);color:#fff;padding:12px 16px;border-radius:14px;font-weight:700;box-shadow:0 12px 30px #0006";document.body.append(x);setTimeout(()=>x.remove(),2200)}
