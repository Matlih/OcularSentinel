# Ocular Sentinel

Ocular Sentinel is an AI-powered Autonomous C4ISR Security System that combines the speed of edge detection with the deep reasoning of cloud Vision-Language Models (VLMs). 

It continuously monitors video feeds (CCTV, Dashcams, Drones) using a local **YOLO11n Edge Tripwire**, which buffers frames in memory. When a potential anomaly or threat is detected, the system compiles the buffered footage and beams it to a **Qwen2-VL** multimodal model to generate a rich, contextual incident report.

## Architecture
- **Frontend**: React (Vite) + Tailwind CSS dashboard providing a cyberpunk-styled command center.
- **Backend**: FastAPI (Python) managing WebSockets, the YOLO inference thread, and video streaming.
- **VLM Node**: Jupyter Notebook running the Qwen2-VL model (optimized for AMD ROCm via vLLM) exposed securely via an Ngrok tunnel.

## Quick Start

### 1. Start the VLM Server (Cloud Node)
If you are running the VLM on a separate AMD ROCm machine or notebook environment:
1. Open `Ocular_Sentinel_VLM.ipynb`
2. Enter your Ngrok Auth Token in the designated cell.
3. "Run All" cells.
4. Note the generated `ngrok-free.dev` URL.

### 2. Start the Edge Tripwire (Backend)
Navigate to the `backend/` directory:
```bash
cd backend
pip install -r requirements.txt
```
Set the VLM API URL environment variable and run the server:
```powershell
$env:VLLM_API_URL="https://YOUR_NGROK_URL.ngrok-free.dev/v1"
python main.py
```
*(The backend runs on `http://localhost:8000`)*

### 3. Start the Command Center (Frontend)
In a new terminal window, navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
*(The frontend runs on `http://localhost:5173`)*

## Features
- **Rolling Frame Buffer**: Captures the moments *before* and *after* a threat is detected.
- **Auto-Pilot Mode**: Automatically cycles through security feeds and autonomously investigates anomalies.
- **Real-Time WebSockets**: Instant bidirectional communication between the VLM, the Tripwire Engine, and the Command Center Dashboard.
- **AMD ROCm Support**: Native compatibility for AMD GPUs via `vllm`.
