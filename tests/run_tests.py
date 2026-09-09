import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import asyncio

from backend.main import (
    health_check, 
    api_stats, 
    api_barrios, 
    api_search, 
    api_chat, 
    ChatRequest
)
from backend.services.search_engine import search_restaurants, get_stats, get_all_barrios
from backend.services.llm_agent import ask_gastronomia, detect_out_of_coverage, extract_intent_and_filters

def test_all():
    print("[1/5] Probando consistencia de Base de Datos y Métricas...")
    stats = get_stats()
    assert stats["total_establecimientos"] == 8181, f"Expected 8181, got {stats['total_establecimientos']}"
    assert stats["apto_sin_tacc"] >= 9
    assert stats["apto_vegano"] >= 60
    assert stats["fuente_osm"] == 5441
    assert stats["fuente_badata"] == 2740
    print(f"      OK: 8.181 registros verificados ({stats['con_telefono']} con teléfono, {stats['con_website']} con web).")

    print("[2/5] Probando filtros dietarios y búsqueda por barrio...")
    res_sin_tacc = search_restaurants(es_sin_tacc=True)
    assert res_sin_tacc["total"] >= 9
    for r in res_sin_tacc["results"]:
        assert r["es_sin_tacc"].startswith("Apto")
    
    res_palermo = search_restaurants(barrio="Palermo", limit=5)
    assert res_palermo["total"] > 100
    for r in res_palermo["results"]:
        assert "palermo" in r["barrio_localidad"].lower()
    print("      OK: Búsqueda y filtros dietarios funcionando correctamente.")

    print("[3/5] Probando guardrails de seguridad y detección fuera de zona...")
    assert detect_out_of_coverage("Quiero ir a comer a Córdoba") == "Córdoba"
    assert detect_out_of_coverage("Mejores empanadas en Rosario") == "Rosario"
    assert detect_out_of_coverage("Restaurantes en Palermo") is None

    filters = extract_intent_and_filters("Busco algo sin tacc en Recoleta")
    assert filters["es_sin_tacc"] is True
    assert filters["is_dietary"] is True
    assert filters["barrio"] == "Recoleta"
    print("      OK: Guardrails de cobertura y parser semántico validados.")

    print("[4/5] Probando protocolo estricto de seguridad alimentaria en el Asistente...")
    chat_diet_res = asyncio.run(ask_gastronomia("Opciones sin tacc en Palermo"))
    assert chat_diet_res["disclaimer_applied"] is True
    assert "Recomendación importante de salud" in chat_diet_res["reply"] or "Aviso de Seguridad" in chat_diet_res["reply"]
    assert len(chat_diet_res["venues"]) > 0
    # Verify phone / web inclusion
    has_contact = any(v.get("telefono") or v.get("website") for v in chat_diet_res["venues"])
    assert has_contact, "Should provide contact for verification"

    chat_oob = asyncio.run(ask_gastronomia("Recomendame un bar en Mendoza"))
    assert chat_oob["venues"] == []
    assert "cobertura" in chat_oob["reply"].lower()
    print("      OK: Protocolo de seguridad y rechazo fuera de zona confirmados.")

    print("[5/5] Probando funciones de los endpoints FastAPI...")
    # Health check
    h = health_check()
    assert h["status"] == "ok"

    # Barrios
    b = api_barrios()
    assert len(b) > 50

    # Search endpoint
    s = api_search(q=None, barrio="Belgrano", categoria=None, cocina=None, sin_tacc=False, vegano=False, vegetariano=False, solo_contacto=False, lat=None, lon=None, radio_km=None, limit=5, offset=0)
    assert "results" in s
    assert len(s["results"]) <= 5

    # Chat endpoint
    c = asyncio.run(api_chat(ChatRequest(message="Cafés en San Telmo")))
    assert "reply" in c
    assert "venues" in c
    assert len(c["venues"]) > 0
    print("      OK: Todos los endpoints REST responden con datos y esquemas válidos.")

    print("\n==================================================================")
    print(" ✅  TODAS LAS PRUEBAS AUTOMATIZADAS PASARON SATISFACTORIAMENTE!")
    print("==================================================================")

if __name__ == "__main__":
    test_all()
