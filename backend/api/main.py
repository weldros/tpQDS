from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import random
import uuid
from backend.api.db.storage import init_db, save_message, save_session
import os

app = FastAPI(title="QDS Backend Engine")

# Allow React UI to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# Load dictionary
DICT_PATH = os.path.join(os.path.dirname(__file__), "dictionary.json")
try:
    with open(DICT_PATH, "r") as f:
        WORD_LIST = json.load(f)
except Exception:
    WORD_LIST = ["quantum", "teleportation", "secure", "message"]

class AppState:
    def __init__(self):
        self.continuous_running = False
        self.configured_attack_type = None
        self.configured_intercept_rate = 0.0
        self.execute_attack_flag = False
        self.current_session_logs = []
        self.active_websockets = set()
        self.run_id = None

state = AppState()

async def broadcast(message: dict):
    disconnected = set()
    for ws in state.active_websockets:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        state.active_websockets.remove(ws)

async def transmission_worker():
    state.run_id = str(uuid.uuid4())[:8]
    while state.continuous_running:
        # 1. Generate Dictionary Payload
        words = random.sample(WORD_LIST, k=min(4, len(WORD_LIST)))
        payload = " ".join(words)
        
        # 2. Broadcast physical steps
        await broadcast({"step": f"Hashing payload: {payload[:10]}...", "payload": payload})
        await asyncio.sleep(0.5)
        await broadcast({"step": "Entangling message qubit..."})
        await asyncio.sleep(0.5)
        
        # Send to core engine
        from backend.module1.qdsEngine import runSignature
        engine_result = runSignature(
            message=payload.encode(),
            shots=1,
            execute_attack=state.execute_attack_flag,
            attack_type=state.configured_attack_type
        )
        
        # Round metrics to 2 decimal places
        engine_result["qber"] = round(engine_result["qber"], 2)
        engine_result["fidelity"] = round(engine_result["fidelity"], 2)
        
        # Check engine's verdict to dictate the halt signal
        if engine_result["verdict"] == "REJECT":
            await broadcast({
                "step": f"ATTACK EXECUTED ({engine_result.get('attack_type', 'UNKNOWN')})! Wavefunction collapsed.",
                "status": "HALTED",
                "metrics": engine_result
            })
            state.continuous_running = False
            state.execute_attack_flag = False
            
            # Log interception and save entire session
            attack_log = {
                "message_sent": payload,
                "message_received": "CORRUPTED_BY_EVE",
                **engine_result
            }
            state.current_session_logs.append(attack_log)
            save_session(state.run_id, state.current_session_logs)
            break
        
        # Normal transmission
        await broadcast({"step": "Applying Pauli corrections..."})
        await asyncio.sleep(0.5)
        
        # Log telemetry in memory
        success_log = {
            "message_sent": payload,
            "message_received": payload, # Perfect transmission
            **engine_result
        }
        state.current_session_logs.append(success_log)
        
        await broadcast({"step": "Transmission Complete.", "metrics": engine_result})
        
        # Master interval controlling stream speed (1 second delay)
        await asyncio.sleep(1)

class TransmitRequest(BaseModel):
    text: str
    sender: str
    receiver: str

class AttackConfigRequest(BaseModel):
    attack_type: str
    intercept_rate: float

@app.post("/signatures/transmit")
async def transmit_message(req: TransmitRequest):
    # This endpoint is now solely for the "Test Single Pulse" UI button
    from backend.module1.qdsEngine import runSignature
    
    engine_result = runSignature(
        message=req.text.encode(),
        shots=1,
        execute_attack=state.execute_attack_flag,
        attack_type=state.configured_attack_type
    )
    
    mock_qber = round(engine_result["qber"], 2)
    verdict = engine_result["verdict"]
    
    filepath = save_message(req.sender, req.receiver, req.text, mock_qber, verdict)
    
    return {
        "status": "success",
        "message": "Message transmitted successfully.",
        "qber": mock_qber,
        "fidelity": round(engine_result["fidelity"], 2),
        "verdict": verdict,
        "db_path": filepath
    }

@app.post("/attacks/configure")
async def configure_eavesdropper(req: AttackConfigRequest):
    state.configured_attack_type = req.attack_type
    state.configured_intercept_rate = req.intercept_rate
    return {"status": "Eve configured. Waiting for execution.", "attack_type": state.configured_attack_type}

@app.post("/attacks/execute")
async def execute_attack():
    if not state.configured_attack_type:
        return {"error": "Eve is not configured yet."}
    
    state.execute_attack_flag = True
    return {"status": "Attack sent to the channel! Wavefunction will collapse."}

@app.post("/stream/start")
async def start_stream():
    if not state.continuous_running:
        state.continuous_running = True
        state.execute_attack_flag = False
        state.current_session_logs = []
        asyncio.create_task(transmission_worker())
    return {"status": "Continuous stream started", "session_id": state.run_id}

@app.post("/stream/stop")
async def stop_stream():
    state.continuous_running = False
    
    # Save session if there are logs collected
    if state.run_id and len(state.current_session_logs) > 0:
        save_session(state.run_id, state.current_session_logs)
        state.current_session_logs = []
        
    return {"status": "Continuous stream stopped"}

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    state.active_websockets.add(websocket)
    
    try:
        while True:
            # Passive listener: just keep the connection open to detect disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        state.active_websockets.remove(websocket)
        print("A client disconnected from stream.")
