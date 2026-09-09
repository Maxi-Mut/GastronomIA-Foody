import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.search_engine import search_restaurants, get_stats, get_all_barrios
from backend.services.llm_agent import ask_gastronomia, detect_out_of_coverage, extract_intent_and_filters

client = TestClient(app)

def test_database_and_stats():
    """Verify all 8.181 records are available and stats match expected metrics."""
    stats = get_stats()
    assert stats["total_establecimientos"] == 8181
    assert stats["con_telefono"] > 2000
    assert stats["apto_sin_tacc"] >= 9
    assert stats["apto_vegano"] >= 60
    assert stats["fuente_osm"] == 5441
    assert stats["fuente_badata"] == 2740

def test_search_dietary_sin_tacc():
    """Verify that filtering by Sin TACC returns authentic certified/inferred records."""
    res = search_restaurants(es_sin_tacc=True)
    assert res["total"] >= 9
    for r in res["results"]:
        assert r["es_sin_tacc"].startswith("Apto")

def test_search_neighborhood_palermo():
    """Verify searching in Palermo returns venues located in Palermo."""
    res = search_restaurants(barrio="Palermo", limit=10)
    assert res["total"] > 100
    for r in res["results"]:
        assert "palermo" in r["barrio_localidad"].lower()

def test_out_of_coverage_detection():
    """Verify guardrails trigger on regions outside CABA/GBA."""
    assert detect_out_of_coverage("Quiero ir a comer a Córdoba") is not None
    assert detect_out_of_coverage("Mejores empanadas en Rosario") is not None
    assert detect_out_of_coverage("Restaurantes en Palermo") is None

def test_intent_dietary_extraction():
    """Verify intent parser correctly flags dietary needs."""
    filters = extract_intent_and_filters("Busco algo sin tacc en Recoleta")
    assert filters["es_sin_tacc"] is True
    assert filters["is_dietary"] is True
    assert filters["barrio"] == "Recoleta"

@pytest.mark.asyncio
async def test_llm_agent_dietary_disclaimer():
    """Verify food safety disclaimer is strictly applied to dietary queries."""
    res = await ask_gastronomia("Opciones sin tacc en Belgrano")
    assert res["disclaimer_applied"] is True
    assert "Recomendación importante de salud" in res["reply"] or "Aviso de Seguridad" in res["reply"]

@pytest.mark.asyncio
async def test_llm_agent_out_of_bounds_response():
    """Verify clear friendly rejection when querying outside coverage."""
    res = await ask_gastronomia("Busco un bodegón en Mendoza")
    assert res["venues"] == []
    assert "cobertura" in res["reply"].lower()

def test_api_endpoints():
    """Verify FastAPI REST endpoints respond with 200 OK."""
    # Health check
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"

    # Barrios list
    r_barrios = client.get("/api/barrios")
    assert r_barrios.status_code == 200
    assert len(r_barrios.json()) > 50

    # Search API
    r_search = client.get("/api/search?barrio=Belgrano&limit=5")
    assert r_search.status_code == 200
    data = r_search.json()
    assert "results" in data
    assert len(data["results"]) <= 5

    # Chat API
    r_chat = client.post("/api/chat", json={"message": "Lugares vegetarianos en San Telmo"})
    assert r_chat.status_code == 200
    chat_data = r_chat.json()
    assert "reply" in chat_data
    assert "venues" in chat_data
