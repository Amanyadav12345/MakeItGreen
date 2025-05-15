from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from detect import detect_ppe

app = FastAPI()

# Allow CORS from localhost (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageInput(BaseModel):
    image: str

@app.post("/detect-ppe")
async def detect(image_input: ImageInput):
    result = detect_ppe(image_input.image)
    return {"result": result}