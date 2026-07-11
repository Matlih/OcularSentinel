from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pydantic import BaseModel
import asyncio
import json
import base64
import time
import os

from tripwire_engine import TripwireEngine
from vlm_client import analyze_frame

# Global state
STREAM_URL = "samples/normal_traffic.mp4" # Default to baseline video
tripwire_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tripwire_engine
    tripwire_engine = TripwireEngine(STREAM_URL, handle_anomaly)
    tripwire_engine.start()
    yield
    if tripwire_engine:
        tripwire_engine.stop()

app = FastAPI(title="Ocular Sentinel Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure samples directory exists
os.makedirs("samples", exist_ok=True)
# Mount the samples directory so the frontend VideoPlayer can access local files
app.mount("/samples", StaticFiles(directory="samples"), name="samples")

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error sending message to websocket: {e}")

manager = ConnectionManager()


def handle_anomaly(frame_bytes):
    """
    Called by TripwireEngine when motion/anomaly is detected.
    This runs in the Tripwire thread. We must handle the VLM call 
    and then notify the websocket.
    """
    print("Anomaly triggered! Sending to VLM...")
    
    # Base64 encode the video for the frontend so it can display the trigger clip
    encoded_video = base64.b64encode(frame_bytes).decode('utf-8')
    video_data_url = f"data:video/mp4;base64,{encoded_video}"

    # Call VLM (this is a blocking call, which is fine since it's in the tripwire thread)
    report = analyze_frame(frame_bytes)
    print("VLM Report:", report)

    # Broadcast via websockets. Since we are in a thread, we need to create a new event loop or use the existing one safely.
    payload = {
        "type": "anomaly_report",
        "timestamp": time.time(),
        "video": video_data_url,
        "report": report
    }
    
    # Hack to broadcast from a sync thread
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(json.dumps(payload)))
    except RuntimeError:
        # If no running loop in this thread
        asyncio.run(manager.broadcast(json.dumps(payload)))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/trigger")
async def manual_trigger():
    if tripwire_engine:
        tripwire_engine.trigger_manually()
        return {"status": "success", "message": "Manual trigger activated"}
    return {"status": "error", "message": "Engine not running"}

@app.post("/api/set_stream")
async def set_stream(url: str):
    global tripwire_engine
    if tripwire_engine:
        tripwire_engine.stop()
    tripwire_engine = TripwireEngine(url, handle_anomaly)
    tripwire_engine.start()
    return {"status": "success", "stream_url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
