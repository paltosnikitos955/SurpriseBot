let initData="";
export function setInitData(v){initData=v||""}
async function req(url,options={}){const headers=new Headers(options.headers||{});if(initData)headers.set("X-Telegram-Init-Data",initData);const r=await fetch(url,{...options,headers});let data=null;try{data=await r.json()}catch{}if(!r.ok)throw new Error(data?.detail||`Ошибка ${r.status}`);return data}
export const api={
 health:()=>req("/api/health"),me:()=>req("/api/me"),list:()=>req("/api/surprises"),
 get:(id)=>req(`/api/surprises/${encodeURIComponent(id)}`),
 open:(id)=>req(`/api/surprises/${encodeURIComponent(id)}/open`,{method:"POST"}),
 create:(body)=>req("/api/surprises",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),
 update:(id,body)=>req(`/api/surprises/${encodeURIComponent(id)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),
 del:(id)=>req(`/api/surprises/${encodeURIComponent(id)}`,{method:"DELETE"}),
 share:(id)=>req(`/api/surprises/${encodeURIComponent(id)}/share`,{method:"POST"}),
 upload:(file)=>{const f=new FormData();f.append("file",file);return req("/api/upload",{method:"POST",body:f})},
 templates:()=>req("/api/templates")
};
