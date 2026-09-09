import os
import sys
import webbrowser
import uvicorn

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, "gastronomia.db")

def main():
    print("=" * 65)
    print(" [*] GastronomIA - Asistente Gastronomico CABA & GBA")
    print("=" * 65)
    
    # 1. Check if database exists; if not, build it from dataset
    if not os.path.exists(DB_PATH):
        print("[*] Base de datos no encontrada. Inicializando ETL de 8.181 establecimientos...")
        from backend.db_setup import build_database
        build_database()
    else:
        print(f"[+] Base de datos detectada: {DB_PATH}")

    host = "127.0.0.1"
    port = 8000
    url = f"http://{host}:{port}"
    print(f"[+] Iniciando servidor FastAPI en: {url}")
    print(f"[+] Abrí tu navegador en: {url}")
    print("=" * 65)
    
    # Run Uvicorn server
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)

if __name__ == "__main__":
    main()
