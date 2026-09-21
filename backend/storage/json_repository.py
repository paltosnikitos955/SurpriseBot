import json, os, tempfile
from pathlib import Path
from datetime import datetime, timezone
from threading import RLock

def now_iso(): return datetime.now(timezone.utc).isoformat()

class JSONRepository:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = RLock()
        if not self.path.exists():
            self._write({"surprises": []})

    def _read(self):
        try:
            return json.loads(self.path.read_text("utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            return {"surprises": []}

    def _write(self, data):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix=".surprises-", suffix=".json", dir=str(self.path.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.flush(); os.fsync(f.fileno())
            os.replace(tmp, self.path)
        finally:
            if os.path.exists(tmp): os.unlink(tmp)

    def list_by_owner(self, owner_id):
        with self.lock:
            return [s for s in self._read()["surprises"] if int(s["owner_id"]) == int(owner_id)]

    def get(self, sid):
        with self.lock:
            return next((s for s in self._read()["surprises"] if s["id"] == sid), None)

    def create(self, item):
        with self.lock:
            data=self._read(); data["surprises"].append(item); self._write(data); return item

    def update(self, sid, owner_id, patch):
        with self.lock:
            data=self._read()
            for i,s in enumerate(data["surprises"]):
                if s["id"] == sid:
                    if int(s["owner_id"]) != int(owner_id): return None
                    s.update(patch); s["updated_at"]=now_iso(); data["surprises"][i]=s; self._write(data); return s
        return None

    def delete(self, sid, owner_id):
        with self.lock:
            data=self._read()
            old=len(data["surprises"])
            data["surprises"]=[s for s in data["surprises"] if not (s["id"]==sid and int(s["owner_id"])==int(owner_id))]
            if len(data["surprises"]) == old: return False
            self._write(data); return True

    def increment_open(self, sid):
        with self.lock:
            data=self._read()
            for i,s in enumerate(data["surprises"]):
                if s["id"] == sid:
                    s["open_count"]=int(s.get("open_count",0))+1
                    data["surprises"][i]=s; self._write(data); return s
        return None
