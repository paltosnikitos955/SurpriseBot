from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
def main_menu_keyboard(url):
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="✨ Создать сюрприз",web_app=WebAppInfo(url=url))]])
