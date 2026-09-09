import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from backend.config import settings
from backend.services.search_engine import (
    search_restaurants, 
    get_stats, 
    get_all_barrios, 
    get_all_categories, 
    get_venue_by_id,
    get_map_points
)
from backend.services.llm_agent import ask_gastronomia

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("GastronomIA.API")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para el Asistente Gastronómico Inteligente de CABA y GBA"
)

# Enable CORS for frontend interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}

@app.get("/api/stats")
def api_stats():
    """Returns dataset summary metrics and statistics."""
    return get_stats()

@app.get("/api/barrios")
def api_barrios():
    """Returns list of barrios and municipalities with venue counts."""
    return get_all_barrios()

@app.get("/api/categories")
def api_categories():
    """Returns list of establishment categories."""
    return get_all_categories()

@app.get("/api/map-points")
def api_map_points(
    barrio: Optional[str] = Query(None, description="Filtro opcional por barrio"),
    sin_tacc: Optional[bool] = Query(False, description="Filtrar por Sin TACC"),
    vegano: Optional[bool] = Query(False, description="Filtrar por Vegano"),
    vegetariano: Optional[bool] = Query(False, description="Filtrar por Vegetariano")
):
    """Returns lightweight points for full map clustering (up to all 8.181 venues)."""
    points = get_map_points(
        barrio=barrio,
        es_sin_tacc=sin_tacc,
        es_vegano=vegano,
        es_vegetariano=vegetariano
    )
    return {"total": len(points), "points": points}

@app.get("/api/search")
def api_search(
    q: Optional[str] = Query(None, description="Término de búsqueda libre"),
    barrio: Optional[str] = Query(None, description="Filtro por barrio o municipio"),
    categoria: Optional[str] = Query(None, description="Filtro por categoría (Restaurante, Cafetería, Bar, etc.)"),
    cocina: Optional[str] = Query(None, description="Tipo de cocina (pizza, sushi, parrilla, etc.)"),
    sin_tacc: Optional[bool] = Query(False, description="Filtrar por opciones Sin TACC"),
    vegano: Optional[bool] = Query(False, description="Filtrar por opciones Veganas"),
    vegetariano: Optional[bool] = Query(False, description="Filtrar por opciones Vegetarianas"),
    solo_contacto: Optional[bool] = Query(False, description="Filtrar solo locales con teléfono o web"),
    lat: Optional[float] = Query(None, description="Latitud del usuario"),
    lon: Optional[float] = Query(None, description="Longitud del usuario"),
    radio_km: Optional[float] = Query(None, description="Radio de búsqueda en km"),
    limit: int = Query(15, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Structured and full-text search endpoint."""
    return search_restaurants(
        query=q,
        barrio=barrio,
        categoria=categoria,
        cocina=cocina,
        es_sin_tacc=sin_tacc,
        es_vegano=vegano,
        es_vegetariano=vegetariano,
        solo_con_contacto=solo_contacto,
        lat=lat,
        lon=lon,
        radio_km=radio_km,
        limit=limit,
        offset=offset
    )

@app.get("/api/restaurant/{venue_id}")
def api_get_restaurant(venue_id: int):
    """Retrieve detailed venue information."""
    venue = get_venue_by_id(venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Establecimiento no encontrado")
    return venue

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """Main conversational endpoint for GastronomIA."""
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
    
    result = await ask_gastronomia(req.message, req.history)
    return result

# Static files for Frontend
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_frontend_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
