from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models, database, crud

scheduler = AsyncIOScheduler()

def check_expiration_and_notify():
    # Logic to check expiration
    # This will be refined to use DB sessions
    print(f"Checking expirations at {datetime.now()}")
    # 1. Get DB Session
    # 2. Query companies expiring in 3 days -> Send WhatsApp
    # 3. Query expired companies -> Suspend
    # 4. Query deleted pending -> Delete

def start_scheduler():
    scheduler.add_job(check_expiration_and_notify, 'interval', hours=24)
    scheduler.start()
