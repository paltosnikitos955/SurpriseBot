import os, uuid, mimetypes
from pathlib import Path
from fastapi import FastAPI, Header, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import httpx

from backend.storage.json_repository import JSONRepository, now_iso
from backend.services.auth import user_from_header
from backend.services.schema import base_surprise, template, magic_gift, TEMPLATES

BASE_DIR=Path(__file__).resolve().parent.parent
DATA_DIR=Path(os.getenv("DATA_DIR","/data"))
UPLOADS_DIR=Path(os.getenv("UPLOADS_DIR",str(DATA_DIR/"uploads")))
UPLOADS_DIR.mkdir(parents=True,exist_ok=True)
repo=JSONRepository(str(DATA_DIR/"surprises.json"))
BOT_TOKEN=os.getenv("BOT_TOKEN","")
WEBAPP_URL=os.getenv("WEBAPP_URL","").rstrip("/")
MAX_UPLOAD=int(os.getenv("MAX_UPLOAD_MB","8"))*1024*1024

app=FastAPI(title="SurpriseBox",version="1.0.0")
app.mount("/static",StaticFiles(directory=BASE_DIR/"frontend"),name="static")
app.mount("/uploads",StaticFiles(directory=UPLOADS_DIR),name="uploads")

def auth(x_telegram_init_data):
    if not BOT_TOKEN: raise HTTPException(503,"Bot is not configured")
    return user_from_header(x_telegram_init_data,BOT_TOKEN)

def public(s):
    s=dict(s); s.pop("owner_id",None); return s

@app.get("/api/health")
async def health(): return {"status":"ok","app":"surprisebox","version":"1.0.0"}

@app.get("/api/me")
async def me(x_telegram_init_data: str|None=Header(default=None)):
    return auth(x_telegram_init_data)

@app.get("/api/surprises")
async def list_surprises(x_telegram_init_data: str|None=Header(default=None)):
    u=auth(x_telegram_init_data)
    return {"items":[public(s) for s in sorted(repo.list_by_owner(u["id"]),key=lambda x:x["updated_at"],reverse=True)]}

@app.post("/api/surprises")
async def create_surprise(body: dict, x_telegram_init_data: str|None=Header(default=None)):
    u=auth(x_telegram_init_data)
    kind=body.get("kind","blank")
    s=magic_gift(u["id"]) if kind=="magic" else template(u["id"],body.get("template")) if body.get("template") else base_surprise(u["id"],str(body.get("title") or "Новый сюрприз"),str(body.get("theme") or "love"))
    if body.get("title"): s["title"]=str(body["title"])[:80]
    repo.create(s)
    return public(s)

@app.get("/api/surprises/{sid}")
async def get_surprise(sid:str):
    s=repo.get(sid)
    if not s: raise HTTPException(404,"Сюрприз не найден")
    return public(s)

@app.post("/api/surprises/{sid}/open")
async def open_surprise(sid:str):
    s=repo.increment_open(sid)
    if not s: raise HTTPException(404,"Сюрприз не найден")
    return public(s)

@app.put("/api/surprises/{sid}")
async def update_surprise(sid:str, body:dict, x_telegram_init_data: str|None=Header(default=None)):
    u=auth(x_telegram_init_data); current=repo.get(sid)
    if not current: raise HTTPException(404,"Сюрприз не найден")
    if int(current["owner_id"])!=int(u["id"]): raise HTTPException(403,"Нет доступа")
    allowed={"title","settings","scenes"}
    patch={k:body[k] for k in allowed if k in body}
    if "title" in patch: patch["title"]=str(patch["title"])[:80]
    if "scenes" in patch and (not isinstance(patch["scenes"],list) or len(patch["scenes"])>40): raise HTTPException(422,"Слишком много сцен")
    return public(repo.update(sid,u["id"],patch))

@app.delete("/api/surprises/{sid}")
async def delete_surprise(sid:str,x_telegram_init_data: str|None=Header(default=None)):
    u=auth(x_telegram_init_data)
    if not repo.delete(sid,u["id"]): raise HTTPException(404,"Сюрприз не найден")
    return {"ok":True}

@app.post("/api/upload")
async def upload(file:UploadFile=File(...),x_telegram_init_data: str|None=Header(default=None)):
    auth(x_telegram_init_data)
    allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"}
    ctype=(file.content_type or "").lower()
    if ctype not in allowed: raise HTTPException(415,"Поддерживаются JPG, PNG, WEBP и GIF")
    data=await file.read()
    if len(data)>MAX_UPLOAD: raise HTTPException(413,f"Файл больше {MAX_UPLOAD//1024//1024} MB")
    if ctype=="image/jpeg" and not data.startswith(b"\xff\xd8\xff"): raise HTTPException(415,"Некорректный JPEG")
    if ctype=="image/png" and not data.startswith(b"\x89PNG\r\n\x1a\n"): raise HTTPException(415,"Некорректный PNG")
    if ctype=="image/webp" and not data.startswith(b"RIFF"): raise HTTPException(415,"Некорректный WEBP")
    name=f"{uuid.uuid4().hex}.{allowed[ctype]}"
    (UPLOADS_DIR/name).write_bytes(data)
    return {"url":f"/uploads/{name}"}

@app.get("/api/templates")
async def templates():
    return [{"name":n,"key":k} for n,k in TEMPLATES]

@app.post("/api/surprises/{sid}/share")
async def share(sid:str,x_telegram_init_data: str|None=Header(default=None)):
    u=auth(x_telegram_init_data); s=repo.get(sid)
    if not s: raise HTTPException(404,"Сюрприз не найден")
    if int(s["owner_id"])!=int(u["id"]): raise HTTPException(403,"Нет доступа")
    if not BOT_TOKEN or not WEBAPP_URL: raise HTTPException(503,"Bot sharing is not configured")
    # Main Mini App deep link: Telegram passes startapp to the Mini App.
    username=os.getenv("BOT_USERNAME","").lstrip("@")
    if not username:
        async with httpx.AsyncClient(timeout=8) as client:
            r=await client.get(f"https://api.telegram.org/bot{BOT_TOKEN}/getMe"); r.raise_for_status()
            username=r.json()["result"]["username"]
    link=f"https://t.me/{username}?startapp={sid}"
    text="🎁 <b>Тебе кое-что приготовили...</b>\n\nНажми кнопку, чтобы открыть сюрприз 👀"
    payload={"chat_id":u["id"],"text":text,"parse_mode":"HTML","reply_markup":{"inline_keyboard":[[{"text":"🎁 Открыть сюрприз","url":link}]]}}
    async with httpx.AsyncClient(timeout=10) as client:
        r=await client.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",json=payload)
        if r.status_code>=400: raise HTTPException(502,"Telegram не смог отправить сообщение")
    return {"ok":True,"link":link}

@app.get("/")
async def index(): return FileResponse(BASE_DIR/"frontend/index.html")
