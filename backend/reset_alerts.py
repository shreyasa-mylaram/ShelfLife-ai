from app.core.database import SessionLocal
from app.models.alert import Alert

db = SessionLocal()
num_deleted = db.query(Alert).delete()
db.commit()
print(f"Deleted {num_deleted} active alerts from cooldown memory.")
