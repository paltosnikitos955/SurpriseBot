const tg=window.Telegram?.WebApp||null;

function readStartParam(){
  const unsafe=tg?.initDataUnsafe||{};
  if(unsafe.start_param) return String(unsafe.start_param);

  const candidates=[];
  try{
    const search=new URLSearchParams(window.location.search||"");
    candidates.push(search.get("tgWebAppStartParam"), search.get("startapp"), search.get("start_param"));
  }catch{}
  try{
    const hash=(window.location.hash||"").replace(/^#/,"");
    const hashParams=new URLSearchParams(hash);
    candidates.push(hashParams.get("tgWebAppStartParam"), hashParams.get("startapp"), hashParams.get("start_param"));
  }catch{}

  // Telegram documents tgWebAppStartParam as the GET parameter for Main Mini App
  // deep links. Keep a final raw initData fallback for clients that expose it there.
  try{
    const init=new URLSearchParams(tg?.initData||"");
    candidates.push(init.get("start_param"));
  }catch{}

  return candidates.find(v=>v!==null&&v!==undefined&&String(v).trim()!=="")||null;
}

export function initTelegram(){
 if(!tg)return {available:false,user:null,startParam:readStartParam(),initData:""};
 tg.ready();tg.expand();
 try{tg.setHeaderColor?.("bg_color");tg.setBackgroundColor?.("bg_color");tg.enableVerticalSwipes?.();}catch{}
 return {available:true,user:tg.initDataUnsafe?.user||null,startParam:readStartParam(),initData:tg.initData||""};
}
export {tg};
