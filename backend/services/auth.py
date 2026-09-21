import hashlib, hmac, json, time
from urllib.parse import parse_qsl
from fastapi import Header, HTTPException

def validate_init_data(init_data: str, bot_token: str, max_age: int = 86400):
    if not init_data: raise HTTPException(401, "Telegram authorization is required")
    pairs=dict(parse_qsl(init_data, keep_blank_values=True))
    received=pairs.pop("hash", None)
    if not received: raise HTTPException(401, "Invalid Telegram initData")
    auth_date=int(pairs.get("auth_date","0") or 0)
    if not auth_date or time.time()-auth_date > max_age: raise HTTPException(401, "Telegram session expired")
    data_check="\n".join(f"{k}={v}" for k,v in sorted(pairs.items()))
    secret=hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    digest=hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(digest, received): raise HTTPException(401, "Invalid Telegram signature")
    try: user=json.loads(pairs["user"])
    except Exception: raise HTTPException(401, "Telegram user data is missing")
    return user

def user_from_header(x_telegram_init_data: str | None, bot_token: str):
    return validate_init_data(x_telegram_init_data or "", bot_token)
