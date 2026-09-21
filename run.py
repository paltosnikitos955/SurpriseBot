import asyncio
import os
import uvicorn
from bot.bot import main as bot_main

async def main():
    if not os.getenv("BOT_TOKEN"):
        raise RuntimeError("BOT_TOKEN is not set")
    port = int(os.getenv("PORT", "80"))
    server = uvicorn.Server(uvicorn.Config("backend.main:app", host="0.0.0.0", port=port, log_level="info"))
    await asyncio.gather(server.serve(), bot_main())

if __name__ == "__main__":
    asyncio.run(main())
