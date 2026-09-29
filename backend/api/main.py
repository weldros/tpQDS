from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import random
import uuid
from backend.api.db.storage import init_db, save_message, save_session
import os
from backend.module2.noise import NoiseConfig
from dataclasses import asdict

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

@app.on_event("startup")
def startup_event():
    from backend.module2.networkTopology import build_network
    network, alice, eve, bob = build_network(verbose=True)
    state.network = network
    state.alice = alice
    state.eve = eve
    state.bob = bob

@app.on_event("shutdown")
def shutdown_event():
    if state.network:
        state.network.stop(True)

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
        self.network = None
        self.alice = None
        self.eve = None
        self.bob = None
        self.noise_config = NoiseConfig()
        self.noise_enabled = True

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
        await broadcast({"step": "Measuring joint quantum states..."})
        await asyncio.sleep(0.2)
        
        # Evaluate probabilistic interception per-packet
        current_attack_flag = False
        if state.execute_attack_flag:
            if random.random() < state.configured_intercept_rate:
                current_attack_flag = True

        # Send to core engine
        from backend.module1.qdsEngine import runSignature
        engine_result = runSignature(
            message=payload.encode(),
            shots=1,
            execute_attack=current_attack_flag,
            attack_type=state.configured_attack_type,
            noise_config_dict=asdict(state.noise_config) if state.noise_enabled else None
        )
        
        # Convert payload to bits for QuNetSim physical routing
        bits = [int(b) for b in ''.join(format(ord(c), '08b') for c in payload)]
        bits = bits[:32] # Limit for QuNetSim performance
        
        # Run the Network Topology Simulation (Module 2)
        loop = asyncio.get_running_loop()
        import concurrent.futures
        from backend.module2.networkTopology import run_topology_test
        from backend.module2.attackSimulation import AttackConfig
        with concurrent.futures.ThreadPoolExecutor() as pool:
            attack_config = None
            if current_attack_flag and state.configured_attack_type:
                attack_config = AttackConfig.from_attack_type(state.configured_attack_type, state.configured_intercept_rate)

            network_log = await loop.run_in_executor(
                pool, 
                run_topology_test, 
                state.alice, state.eve, state.bob, len(bits), bits, 
                state.noise_config if state.noise_enabled else None, 
                attack_config, 
                3, False
            )
            
        topology_qber = network_log["qber"] * 100.0
        total_qber = engine_result["qber"] + topology_qber
        
        # Round metrics to 2 decimal places
        engine_result["qber"] = round(total_qber, 2)
        engine_result["fidelity"] = round(max(0.0, 100.0 - (total_qber * 2)), 2)
        
        # Use Module 3 Statistical Engine instead of hardcoded 11.0 threshold
        from backend.module3.threatDetection import evaluateTransmission
        m_shots = 8192
        k_errors = int((total_qber / 100.0) * m_shots)
        
        verdictRecord = evaluateTransmission(
            m=m_shots, 
            k=k_errors, 
            noise_config_dict=asdict(state.noise_config) if state.noise_enabled else None
        )
        
        # If the engine already rejected it at the handshake layer (e.g. Impersonation/Replay), preserve the REJECT verdict
        if engine_result.get("verdict") != "REJECT":
            engine_result["verdict"] = verdictRecord["verdict"]
            
        engine_result["p_value"] = verdictRecord["p_value"]
        engine_result["dynamic_threshold"] = verdictRecord["threshold_percentage"]
            
        # Check engine's verdict to dictate the halt signal
        if engine_result["verdict"] == "REJECT":
            is_attack = "attack_type" in engine_result and engine_result["attack_type"] is not None
            
            if is_attack:
                step_msg = f"ATTACK EXECUTED ({engine_result['attack_type']})! Wavefunction collapsed."
                halt_reason = "ATTACK"
            else:
                step_msg = "EXCESSIVE NOISE DETECTED! (>11%). Transmission halted due to environmental decoherence."
                halt_reason = "NOISE"
                
            await broadcast({
                "step": step_msg,
                "status": "HALTED",
                "metrics": engine_result,
                "halt_reason": halt_reason
            })
            state.continuous_running = False
            state.execute_attack_flag = False
            
            # Log interception and save entire session
            attack_log = {
                "message_sent": payload,
                "message_received": "CORRUPTED_BY_EVE" if is_attack else "CORRUPTED_BY_NOISE",
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
    
    current_attack_flag = False
    if state.execute_attack_flag:
        if random.random() < state.configured_intercept_rate:
            current_attack_flag = True

    engine_result = runSignature(
        message=req.text.encode(),
        shots=1,
        execute_attack=current_attack_flag,
        attack_type=state.configured_attack_type,
        noise_config_dict=asdict(state.noise_config) if state.noise_enabled else None
    )
    
    # Convert payload to bits for QuNetSim physical routing
    bits = [int(b) for b in ''.join(format(ord(c), '08b') for c in req.text)]
    bits = bits[:32]
    
    loop = asyncio.get_running_loop()
    import concurrent.futures
    from backend.module2.networkTopology import run_topology_test
    with concurrent.futures.ThreadPoolExecutor() as pool:
        from backend.module2.attackSimulation import AttackConfig
        attack_config = None
        if current_attack_flag and state.configured_attack_type:
            attack_config = AttackConfig.from_attack_type(state.configured_attack_type, state.configured_intercept_rate)

        network_log = await loop.run_in_executor(
            pool, 
            run_topology_test, 
            state.alice, state.eve, state.bob, len(bits), bits, 
            state.noise_config if state.noise_enabled else None, 
            attack_config, 
            3, False
        )
        
    topology_qber = network_log["qber"] * 100.0
    total_qber = engine_result["qber"] + topology_qber
    
    mock_qber = round(total_qber, 2)
    engine_result["fidelity"] = round(max(0.0, 100.0 - (total_qber * 2)), 2)
    
    from backend.module3.threatDetection import evaluateTransmission
    m_shots = 8192
    k_errors = int((total_qber / 100.0) * m_shots)
    verdictRecord = evaluateTransmission(m_shots, k_errors, asdict(state.noise_config) if state.noise_enabled else None)
    
    verdict = engine_result.get("verdict")
    if verdict != "REJECT":
        verdict = verdictRecord["verdict"]
    
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


class NoiseConfigRequest(BaseModel):
    t1_enabled: bool = True
    t1_us: float = 100.0
    t2_enabled: bool = True
    t2_us: float = 100.0
    gate_time_ns: float = 100.0
    depolarizing_enabled: bool = True
    two_qubit_depolarizing_prob: float = 0.01

@app.post("/noise/configure")
async def configure_noise(req: NoiseConfigRequest):
    state.noise_config = NoiseConfig(**req.dict())
    return {"status": "Hardware noise model configured. Waiting for execution.", "noise_config": asdict(state.noise_config)}

@app.post("/noise/execute")
async def execute_noise():
    state.noise_enabled = True
    return {"status": "Hardware noise injected into the quantum channel!"}

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
