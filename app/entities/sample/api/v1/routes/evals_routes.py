from fastapi import APIRouter
from fastapi.responses import JSONResponse


router = APIRouter(prefix="/chat", tags=["chat"])

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