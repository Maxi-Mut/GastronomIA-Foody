import os
import sys
import traceback

# Ensure project root is in sys.path for clean backend package imports
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
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

except Exception:
    # Si la app falla al importarse, exponemos el traceback real en pantalla
    # para poder diagnosticar el problema en el entorno serverless.
    _tb = traceback.format_exc()
    print("IMPORT ERROR:\n", _tb, flush=True)
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    app = FastAPI()

    @app.get("/{full_path:path}")
    def _import_error(full_path: str):
        info = (
            f"IMPORT ERROR EN backend.main\n"
            f"python: {sys.version}\n"
            f"cwd: {os.getcwd()}\n"
            f"root files: {sorted(os.listdir(PROJECT_ROOT))}\n\n"
            f"{_tb}"
        )
        return PlainTextResponse(info, status_code=200)
