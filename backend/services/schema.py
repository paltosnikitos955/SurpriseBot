from datetime import datetime, timezone
import secrets, copy

def uid(prefix=""): return prefix + secrets.token_urlsafe(8).replace("-","").replace("_","")[:10]

def base_surprise(owner_id, title="Новый сюрприз", theme="love"):
    return {
        "id": uid(), "owner_id": int(owner_id), "title": title,
        "open_count": 0, "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "settings": {"theme": theme, "performance": "auto", "final_title": "✨ Сюрприз завершён",
                     "final_text": "Надеюсь, тебе понравилось ❤️"},
        "scenes": [
            {"id": uid("scene_"), "name":"Сцена 1", "background":{"type":"gradient","value":"#120c24"},
             "elements":[],
             "transition":{"type":"tap","duration":2.5}}
        ]
    }

def magic_gift(owner_id):
    s=base_surprise(owner_id,"🎁 Magic Gift","love")
    scenes=[]
    def scene(name,bg,elements,transition="tap"):
        return {"id":uid("scene_"),"name":name,"background":bg,"elements":elements,"transition":{"type":transition,"duration":3}}
    scenes.append(scene("Коробка",{"type":"gradient","value":"#160b2f"},[
        {"id":uid("el_"),"type":"text","text":"У меня для тебя кое-что есть...","x":50,"y":25,"w":82,"h":12,"rotation":0,"style":{"fontSize":27,"color":"#fff","weight":800,"align":"center"},"animation":{"in":"fadeUp","out":"none","duration":700}},
        {"id":uid("el_"),"type":"emoji","text":"🎁","x":50,"y":53,"w":35,"h":25,"rotation":0,"style":{"fontSize":100,"align":"center"},"animation":{"in":"pop","out":"none","duration":600}},
        {"id":uid("el_"),"type":"button","text":"Открыть 🎁","x":50,"y":82,"w":55,"h":9,"rotation":0,"style":{"fontSize":17,"color":"#fff","background":"#ff4f9a","radius":999},"action":{"type":"next"}}
    ]))
    scenes.append(scene("Сияние",{"type":"gradient","value":"#2a104d"},[
        {"id":uid("el_"),"type":"emoji","text":"✨","x":50,"y":48,"w":50,"h":30,"rotation":0,"style":{"fontSize":120,"align":"center"},"animation":{"in":"pop","out":"none","duration":900}},
        {"id":uid("el_"),"type":"text","text":"Подарок открыт!","x":50,"y":75,"w":85,"h":10,"rotation":0,"style":{"fontSize":28,"color":"#fff","weight":800,"align":"center"},"animation":{"in":"fadeUp","out":"none","duration":700}}
    ],"automatic"))
    scenes.append(scene("Мысль",{"type":"gradient","value":"#0d1028"},[
        {"id":uid("el_"),"type":"text","text":"Я долго думал, как это подарить...","x":50,"y":45,"w":84,"h":16,"rotation":0,"style":{"fontSize":29,"color":"#fff","weight":700,"align":"center","shadow":True},"animation":{"in":"type","out":"none","duration":1200}},
        {"id":uid("el_"),"type":"effect","effect":"stars","x":50,"y":50,"w":100,"h":100,"rotation":0,"options":{"density":45}}
    ],"automatic"))
    scenes.append(scene("Фото",{"type":"solid","value":"#090b16"},[
        {"id":uid("el_"),"type":"text","text":"Для тебя ❤️","x":50,"y":14,"w":85,"h":9,"rotation":0,"style":{"fontSize":25,"color":"#fff","weight":800,"align":"center"},"animation":{"in":"fadeUp","out":"none","duration":700}},
        {"id":uid("el_"),"type":"placeholder","text":"Добавь своё фото","x":50,"y":52,"w":74,"h":48,"rotation":0,"style":{"fontSize":20,"color":"#fff","background":"#251d39","radius":24,"align":"center"}}
    ]))
    scenes.append(scene("Финал",{"type":"gradient","value":"#240b25"},[
        {"id":uid("el_"),"type":"effect","effect":"hearts","x":50,"y":50,"w":100,"h":100,"rotation":0,"options":{"density":26}},
        {"id":uid("el_"),"type":"text","text":"И я очень рад, что встретил тебя ❤️","x":50,"y":45,"w":88,"h":18,"rotation":0,"style":{"fontSize":30,"color":"#fff","weight":900,"align":"center","shadow":True},"animation":{"in":"pop","out":"none","duration":900}}
    ],"automatic"))
    s["scenes"]=scenes
    return s

TEMPLATES = [
    ("❤️ Love","love"),("🎂 Birthday","birthday"),("🎁 Gift","gift"),("🌌 Space","space"),
    ("😂 Prank","prank"),("🥺 Open when sad","sad"),("🎉 Party","party"),("🖤 Dark","dark")
]

def template(owner_id, key):
    title, theme = next((x for x in TEMPLATES if x[1]==key), ("✨ Surprise", "love"))
    s=base_surprise(owner_id,title,theme)
    colors={"love":"#24102d","birthday":"#18213f","gift":"#26170c","space":"#070c22","prank":"#151515","sad":"#0c1726","party":"#26102f","dark":"#050505"}
    bg={"type":"gradient","value":colors.get(theme,"#120c24")}
    texts={"love":"Ты — мой особенный человек ❤️","birthday":"С днём рождения! 🎂","gift":"Для тебя есть подарок 🎁","space":"Где-то среди звёзд...","prank":"Подожди... что-то тут не так 👀","sad":"Открой, когда станет грустно","party":"Сегодня повод для праздника! 🎉","dark":"История начинается..."}
    s["scenes"]=[
        {"id":uid("scene_"),"name":"Сцена 1","background":bg,"elements":[{"id":uid("el_"),"type":"text","text":texts.get(theme),"x":50,"y":43,"w":88,"h":16,"rotation":0,"style":{"fontSize":30,"color":"#fff","weight":850,"align":"center","shadow":True},"animation":{"in":"fadeUp","out":"none","duration":800}},{"id":uid("el_"),"type":"effect","effect":{"love":"hearts","birthday":"confetti","gift":"sparkles","space":"stars","prank":"glitch","sad":"rain","party":"confetti","dark":"smoke"}[theme],"x":50,"y":50,"w":100,"h":100,"rotation":0,"options":{"density":30}}],
         "transition":{"type":"tap","duration":3}},
        {"id":uid("scene_"),"name":"Сцена 2","background":bg,"elements":[{"id":uid("el_"),"type":"text","text":"Нажми, чтобы продолжить ✨","x":50,"y":45,"w":90,"h":14,"rotation":0,"style":{"fontSize":24,"color":"#fff","weight":700,"align":"center"},"animation":{"in":"pop","out":"none","duration":600}},{"id":uid("el_"),"type":"button","text":"Продолжить","x":50,"y":78,"w":55,"h":9,"rotation":0,"style":{"fontSize":17,"color":"#fff","background":"#ff4f9a","radius":999},"action":{"type":"next"}}],"transition":{"type":"tap","duration":3}}
    ]
    return s
