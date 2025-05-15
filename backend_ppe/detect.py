from PIL import Image
from io import BytesIO
import base64
from ultralytics import YOLO
import numpy as np
import cv2

# Load YOLOv8 model trained to detect PPE (or use general model)
model = YOLO('yolov8s_custom.pt')  # Replace with custom PPE model if available

# Keywords to filter detections
PPE_KEYWORDS = ['helmet', 'vest', 'gloves']

def base64_to_image(base64_str):
    header, encoded = base64_str.split(",", 1)
    img_data = base64.b64decode(encoded)
    return Image.open(BytesIO(img_data))

def detect_ppe(base64_str):
    image = base64_to_image(base64_str)
    results = model.predict(image)

    # Extract names of detected objects
    detected_labels = set()
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id].lower()
            detected_labels.add(label)

    found = [item for item in PPE_KEYWORDS if any(item in d for d in detected_labels)]

    report = []
    for item in PPE_KEYWORDS:
        if item in found:
            report.append(f"{item.capitalize()}: ✅")
        else:
            report.append(f"{item.capitalize()}: ❌")

    return ', '.join(report)