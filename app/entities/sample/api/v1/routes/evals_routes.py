from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.entities.sample.services.gepeto_service import call_gepeto
from app.entities.sample.models.sample_models import ChatRequest


router = APIRouter(prefix="/api", tags=["api"])

@router.get("/health")
async def health():
    try:
        print("connection made succesfully")
        return JSONResponse(content={"message": "Service is healthy"})
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": "Service Error", "status": "ERROR", "database": "disconnected", "error": str(e)}
        )


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        gepeto_response = call_gepeto(request.message)
        return JSONResponse(content=gepeto_response)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": "Service Error", "status": "ERROR", "database": "disconnected", "error": str(e)}
        )