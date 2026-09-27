import os
import json
from datetime import datetime

# TODO (Future): Replace this file-based storage with PostgreSQL models (SQLAlchemy/SQLModel)
DB_ROOT = "database"
MESSAGES_DIR = os.path.join(DB_ROOT, "messages")
LOGS_DIR = os.path.join(DB_ROOT, "logs")

def init_db():
    os.makedirs(MESSAGES_DIR, exist_ok=True)
    os.makedirs(LOGS_DIR, exist_ok=True)

def save_message(sender: str, receiver: str, text: str, qber: float, verdict: str):
    """Saves single-transmission message payload to database/messages/"""
    timestamp = datetime.now().isoformat()
    filename = f"{timestamp.replace(':', '-')}_{sender}_to_{receiver}.json"
    
    data = {
        "timestamp": timestamp,
        "sender": sender,
        "receiver": receiver,
        "text": text,
        "qber": qber,
        "verdict": verdict
    }
    
    filepath = os.path.join(MESSAGES_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
    return filepath

def save_log(run_id: str, metrics: dict):
    """Saves detailed telemetry to database/logs/ (used for continuous mode graphing)"""
    timestamp = datetime.now().isoformat()
    filename = f"log_{run_id}_{timestamp.replace(':', '-')}.json"
    
    data = {
        "run_id": run_id,
        "timestamp": timestamp,
        "metrics": metrics
    }
    
    filepath = os.path.join(LOGS_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
    return filepath
