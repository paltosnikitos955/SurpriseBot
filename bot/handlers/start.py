import os
from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from bot.keyboards.main import main_menu_keyboard
router=Router()

@router.message(CommandStart())
async def start_handler(message: Message):
    url=os.getenv("WEBAPP_URL","").rstrip("/")
    if not url:
        await message.answer("⚠️ Mini App пока не настроен.")
        return
    await message.answer(
        "🎁 <b>Добро пожаловать в SurpriseBox!</b>\n\n"
        "Создавай интерактивные сюрпризы и отправляй их друзьям ❤️\n\n"
        "Один сюрприз — маленький интерактивный фильм внутри Telegram.",
        reply_markup=main_menu_keyboard(url))
