import cv2
import time
import threading
import collections
import os

class TripwireEngine:
    def __init__(self, stream_url, on_trigger_callback):
        self.stream_url = stream_url
        self.on_trigger_callback = on_trigger_callback
        self.running = False
        self.thread = None
        self.manual_trigger = False

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()

    def trigger_manually(self):
        """Forces an anomaly capture on the next frame."""
        self.manual_trigger = True

    def _run_loop(self):
        cap = cv2.VideoCapture(self.stream_url)
        if not cap.isOpened():
            print(f"Failed to open stream: {self.stream_url}")
            return

        from ultralytics import YOLO
        import logging
        logging.getLogger("ultralytics").setLevel(logging.WARNING)
        
        # Load YOLO11n model. It will auto-download on first run.
        print("Loading YOLO11n Edge Model...")
        model = YOLO("yolo11n.pt")
        
        # COCO Classes: 0:person, 2:car, 3:motorcycle, 4:airplane, 5:bus, 7:truck, 24:backpack, 26:handbag, 28:suitcase
        target_classes = [0, 2, 3, 4, 5, 7, 24, 26, 28]
        
        # To sample 1 frame per second roughly
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0 or fps != fps: # Handle NaN or 0
            fps = 30
        
        frame_count = 0
        frame_buffer = collections.deque(maxlen=90)  # Stores approx 3 seconds of video
        
        print(f"Started Tripwire on {self.stream_url} at ~{fps} FPS")

        while self.running:
            ret, frame = cap.read()
            if not ret:
                # Video ended, loop seamlessly back to start
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            # Downscale frame to 640x360 to save VLM tokens and bandwidth
            frame_resized = cv2.resize(frame, (640, 360))
            frame_buffer.append(frame_resized)
            
            # Simulate real-time playback for local video files
            if not str(self.stream_url).startswith("http"):
                time.sleep(1.0 / fps)
                
            frame_count += 1
            
            # Process ~1 frame per second to save CPU
            if frame_count % int(fps) == 0 or self.manual_trigger:
                is_anomaly = False
                
                if not self.manual_trigger:
                    # Run YOLO inference on the original frame
                    results = model(frame, classes=target_classes, conf=0.4, verbose=False)
                    
                    if len(results) > 0 and len(results[0].boxes) > 0:
                        detected = [model.names[int(c)] for c in results[0].boxes.cls]
                        print(f"YOLO Edge Tripwire Triggered! Detected: {', '.join(detected)}")
                        is_anomaly = True
                
                if self.manual_trigger:
                    print("Manual trigger activated!")
                    is_anomaly = True
                    self.manual_trigger = False
                
                if is_anomaly:
                    # Sample every 5th frame (timelapse) to drastically reduce token count
                    sampled_frames = list(frame_buffer)[::5]
                    print(f"Compiling {len(sampled_frames)} downsampled frames for VLM context...")
                    height, width, _ = sampled_frames[0].shape
                    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                    out = cv2.VideoWriter('anomaly.mp4', fourcc, fps, (width, height))
                    for f in sampled_frames:
                        out.write(f)
                    out.release()
                    
                    with open('anomaly.mp4', 'rb') as f:
                        video_bytes = f.read()
                        
                    # Call the callback with the video bytes (this blocks until VLM finishes)
                    self.on_trigger_callback(video_bytes)

        cap.release()
        print("Tripwire Engine stopped.")

# Example callback function
def _test_callback(frame_bytes):
    print(f"Anomaly triggered, captured {len(frame_bytes)} bytes")

if __name__ == "__main__":
    # Test with a local webcam
    engine = TripwireEngine(0, _test_callback)
    engine.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        engine.stop()
