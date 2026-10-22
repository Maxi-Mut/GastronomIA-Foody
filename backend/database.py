import os
import sqlite3
from typing import List, Dict, Any, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
DB_PATH = os.path.join(PROJECT_ROOT, "gastronomia.db")

if not os.path.exists(DB_PATH):
    alt_db = os.path.join(os.getcwd(), "gastronomia.db")
    if os.path.exists(alt_db):
        DB_PATH = alt_db

def get_db_connection():
    if not os.path.exists(DB_PATH):
        try:
            from backend.db_setup import build_database
            build_database(db_path=DB_PATH)
        except Exception:
            pass
    
    # Try connecting with URI read-only mode, fall back to standard connect
    try:
        uri_path = DB_PATH.replace('\\', '/')
        if not uri_path.startswith('/'):
            uri_path = '/' + uri_path
        conn = sqlite3.connect(f"file:{uri_path}?mode=ro", uri=True, check_same_thread=False)
    except Exception:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        
    conn.row_factory = sqlite3.Row
    return conn

def query_db(query: str, args: tuple = (), one: bool = False) -> Any:
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        rows = cur.fetchall()
        if one:
            return dict(rows[0]) if rows else None
        return [dict(row) for row in rows]
    finally:
        conn.close()
