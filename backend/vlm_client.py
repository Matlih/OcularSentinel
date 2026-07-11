import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Setup OpenAI client to point to the vLLM server on the AMD Notebook via Ngrok
# The user will need to update this URL with their actual ngrok URL
VLLM_API_URL = os.getenv("VLLM_API_URL", "http://localhost:8000/v1") 

client = OpenAI(
    api_key="EMPTY", # vLLM doesn't require an API key by default
    base_url=VLLM_API_URL,
)

def analyze_frame(video_bytes: bytes) -> dict:
    """
    Sends the video buffer to Qwen-VL running on the AMD Notebook.
    Requests both a detailed incident report and the bounding box of the primary threat.
    """
    encoded_video = base64.b64encode(video_bytes).decode("utf-8")
    
    prompt = """
    You are an autonomous C4ISR security agent. 
    Analyze this surveillance video clip and do the following:
    1. Identify any primary threats (Fire, Car Crash, Intruder).
    2. Write a detailed incident report summarizing the threat and context.
    3. Determine the primary action to take (e.g., 'Dispatch Fire Dept', 'Alert Security', 'None').
    4. Provide the bounding box coordinates [y1, x1, y2, x2] of the primary threat (normalized between 0 and 1000).

    Respond strictly in valid JSON format matching this schema:
    {
      "threat_detected": boolean,
      "incident_report": "string",
      "recommended_action": "string",
      "bounding_box": [y1, x1, y2, x2]
    }
    """

    try:
        response = client.chat.completions.create(
            model="Qwen/Qwen2-VL-7B-Instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "video_url",
                            "video_url": {
                                "url": f"data:video/mp4;base64,{encoded_video}"
                            },
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=500
        )
        
        result_text = response.choices[0].message.content
        return json.loads(result_text)
    
    except Exception as e:
        print(f"VLM API Error: {e}")
        return {
            "threat_detected": False,
            "incident_report": f"VLM connection failed: {str(e)}",
            "recommended_action": "None",
            "bounding_box": [0,0,0,0]
        }

if __name__ == "__main__":
    # Simple test if run directly (requires a test.jpg)
    try:
        with open("test.jpg", "rb") as f:
            data = f.read()
            print(analyze_frame(data))
    except FileNotFoundError:
        print("test.jpg not found, skipping direct test.")
