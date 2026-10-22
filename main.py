import os
import sys
import traceback

# Ensure project root is in sys.path for clean backend package imports
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import Request
from fastapi.responses import JSONResponse
from backend.main import app

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_tb = traceback.format_exc()
    print("UNHANDLED RUNTIME EXCEPTION:\n", err_tb, flush=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc), "traceback": err_tb}
    )
