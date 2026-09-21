import asyncio, os
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import MenuButtonWebApp, WebAppInfo
from bot.handlers.start import router as start_router

async def main():
    token=os.getenv("BOT_TOKEN")
    url=os.getenv("WEBAPP_URL","").rstrip("/")
    if not token: raise RuntimeError("BOT_TOKEN is not set")
    bot=Bot(token=token,default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp=Dispatcher(); dp.include_router(start_router)
    try:
        if url:
            await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text="✨ SurpriseBox",web_app=WebAppInfo(url=url)))
        await dp.start_polling(bot)
    finally:
        await bot.session.close()

if __name__=="__main__": asyncio.run(main())
