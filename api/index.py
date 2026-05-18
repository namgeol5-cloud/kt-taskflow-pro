import sys
import os

# Vercel 서버리스 환경에서 api/ 디렉토리를 sys.path에 추가
_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import engine, Base
from routers.tasks import router as tasks_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskFlow Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    field = str(first.get("loc", ["unknown"])[-1])
    msg = first.get("msg", "validation error")
    return JSONResponse(status_code=400, content={"error": f"{field}: {msg}"})


app.include_router(tasks_router, prefix="/api")
