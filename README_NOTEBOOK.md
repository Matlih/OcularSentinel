# Notebook Setup Instructions

To utilize the true AMD hardware for the Ocular Sentinel Cloud VLM, you will run an OpenAI-compatible API server using vLLM directly on your AMD GPU instance.

Run the following commands in a new Jupyter Notebook cell:

```bash
# 1. Install ngrok to expose the API to your local PC
!pip install pyngrok

# 2. In a separate cell, start the vLLM server in the background
import subprocess
import time

print("Starting vLLM server on port 8000...")
subprocess.Popen(["python", "-m", "vllm.entrypoints.openai.api_server", 
                  "--model", "Qwen/Qwen2-VL-7B-Instruct", 
                  "--dtype", "bfloat16", 
                  "--port", "8000",
                  "--max-model-len", "4096"])

time.sleep(10) # wait a few seconds for startup

# 3. Expose the port using ngrok (Put your ngrok authtoken here if required)
from pyngrok import ngrok
# ngrok.set_auth_token("YOUR_TOKEN") # Uncomment if you have an ngrok account
public_url = ngrok.connect(8000)
print(f"=====================================================")
print(f"YOUR AMD VLM ENDPOINT URL: {public_url.public_url}")
print(f"Copy this URL and paste it into backend/vlm_client.py")
print(f"=====================================================")
```

Once you get that URL, the `vlm_client.py` on your local PC will start routing all threat frames directly to your AMD GPU for processing!
