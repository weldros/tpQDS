from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import random
import uuid
from backend.db.storage import init_db, save_message, save_log

app = FastAPI(title="QDS Backend Engine")

# Allow React UI to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the local file-based database
init_db()

# Global state for continuous mode
class AppState:
    def __init__(self):
        self.continuous_running = False
        self.configured_attack_type = None
        self.configured_intercept_rate = 0.0
        self.execute_attack_flag = False

state = AppState()

class TransmitRequest(BaseModel):
    text: str
    sender: str
    receiver: str

class AttackConfigRequest(BaseModel):
    attack_type: str
    intercept_rate: float

@app.post("/signatures/transmit")
async def transmit_message(req: TransmitRequest):
    # Standard single transmission
    mock_qber = random.uniform(0.0, 5.0)
    verdict = "ACCEPT" if mock_qber < 11.0 else "REJECT"
    
    filepath = save_message(req.sender, req.receiver, req.text, mock_qber, verdict)
    
    return {
        "status": "success",
        "message": "Message transmitted successfully.",
        "qber": mock_qber,
        "verdict": verdict,
        "db_path": filepath
    }

@app.post("/attacks/configure")
async def configure_eavesdropper(req: AttackConfigRequest):
    """Sets up Eve's parameters on the channel, but she remains passive until executed."""
    state.configured_attack_type = req.attack_type
    state.configured_intercept_rate = req.intercept_rate
    return {"status": "Eve configured. Waiting for execution.", "attack_type": state.configured_attack_type}

@app.post("/attacks/execute")
async def execute_attack():
    """Eve actively observes the channel, collapsing the wavefunction."""
    if not state.configured_attack_type:
        return {"error": "Eve is not configured yet."}
    
    state.execute_attack_flag = True
    return {"status": "Attack sent to the channel! Wavefunction will collapse."}

@app.post("/stream/start")
async def start_stream():
    state.continuous_running = True
    state.execute_attack_flag = False # Reset on new stream
    return {"status": "Continuous stream started"}

@app.post("/stream/stop")
async def stop_stream():
    state.continuous_running = False
    return {"status": "Continuous stream stopped"}

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    run_id = str(uuid.uuid4())[:8]
    
    try:
        while True:
            if state.continuous_running:
                # 1. Auto-generate random payload (NOT saved to DB)
                payload = f"AUTO_PAYLOAD_{random.randint(1000, 9999)}"
                
                # 2. Simulate physical steps
                await websocket.send_json({"step": "Hashing payload...", "payload": payload})
                await asyncio.sleep(0.5)
                await websocket.send_json({"step": "Entangling message qubit..."})
                await asyncio.sleep(0.5)
                
                # Send to core engine
                from backend.module1.qdsEngine import runSignature
                engine_result = runSignature(
                    message=payload.encode(),
                    shots=1,
                    execute_attack=state.execute_attack_flag,
                    attack_type=state.configured_attack_type
                )
                
                # Check engine's verdict to dictate the halt signal
                if engine_result["verdict"] == "REJECT":
                    await websocket.send_json({
                        "step": f"ATTACK EXECUTED ({engine_result.get('attack_type', 'UNKNOWN')})! Wavefunction collapsed.",
                        "status": "HALTED",
                        "qber": engine_result["qber"],
                        "verdict": engine_result["verdict"]
                    })
                    state.continuous_running = False # Halt transfer on engine's signal
                    state.execute_attack_flag = False # Reset flag
                    
                    # Log the interception
                    save_log(run_id, engine_result)
                    continue
                
                # Normal transmission
                await websocket.send_json({"step": "Applying Pauli corrections..."})
                await asyncio.sleep(0.5)
                
                # Log telemetry
                save_log(run_id, engine_result)
                
                await websocket.send_json({"step": "Transmission Complete.", "metrics": engine_result})
                
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        state.continuous_running = False
        print("Client disconnected from stream.")
