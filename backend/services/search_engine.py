import math
from typing import List, Dict, Any, Optional
from backend.database import query_db, get_db_connection

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    r = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)

def get_stats() -> Dict[str, Any]:
    """Retrieve statistical summary for GastronomIA dashboard and queries."""
    total = query_db("SELECT COUNT(*) as count FROM restaurantes;", one=True)["count"]
    with_phone = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE telefono IS NOT NULL AND telefono != '';", one=True)["count"]
    with_web = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE website IS NOT NULL AND website != '';", one=True)["count"]
    sin_tacc = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE es_sin_tacc LIKE 'Apto%';", one=True)["count"]
    vegano = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE es_vegano LIKE 'Apto%';", one=True)["count"]
    vegetariano = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE es_vegetariano LIKE 'Apto%';", one=True)["count"]
    osm_count = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE fuente_dato = 'OpenStreetMap';", one=True)["count"]
    badata_count = query_db("SELECT COUNT(*) as count FROM restaurantes WHERE fuente_dato LIKE '%BA Data%';", one=True)["count"]
    barrios_count = query_db("SELECT COUNT(DISTINCT barrio_localidad) as count FROM restaurantes;", one=True)["count"]

    top_barrios = query_db("""
        SELECT barrio_localidad, COUNT(*) as count 
        FROM restaurantes 
        WHERE barrio_localidad NOT IN ('No especificado', 'Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'CABA')
        GROUP BY barrio_localidad 
        ORDER BY count DESC 
        LIMIT 10;
    """)

    return {
        "total_establecimientos": total,
        "con_telefono": with_phone,
        "con_website": with_web,
        "apto_sin_tacc": sin_tacc,
        "apto_vegano": vegano,
        "apto_vegetariano": vegetariano,
        "fuente_osm": osm_count,
        "fuente_badata": badata_count,
        "total_barrios": barrios_count,
        "top_barrios": top_barrios
    }

def get_all_barrios() -> List[Dict[str, Any]]:
    """Return all barrios and municipalities in dataset with counts."""
    return query_db("""
        SELECT barrio_localidad as nombre, COUNT(*) as count
        FROM restaurantes
        GROUP BY barrio_localidad
        ORDER BY count DESC;
    """)

def get_all_categories() -> List[Dict[str, Any]]:
    """Return all categories with counts."""
    return query_db("""
        SELECT tipo_categoria as nombre, COUNT(*) as count
        FROM restaurantes
        GROUP BY tipo_categoria
        ORDER BY count DESC;
    """)

def get_map_points(
    barrio: Optional[str] = None,
    es_sin_tacc: Optional[bool] = None,
    es_vegano: Optional[bool] = None,
    es_vegetariano: Optional[bool] = None
) -> List[Dict[str, Any]]:
    """Retrieve lightweight points for map clustering across all 8.181 venues."""
    where = []
    params = []
    if barrio and barrio.strip():
        b = barrio.strip()
        if b.lower() not in ["todos", "todas", "cualquiera", "ambas", "caba y gba"]:
            where.append("barrio_localidad LIKE ?")
            params.append(f"%{b}%")
    if es_sin_tacc:
        where.append("es_sin_tacc LIKE 'Apto%'")
    if es_vegano:
        where.append("es_vegano LIKE 'Apto%'")
    if es_vegetariano:
        where.append("es_vegetariano LIKE 'Apto%'")
    
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    sql = f"""
        SELECT id, nombre, tipo_categoria, cocina, direccion, barrio_localidad, telefono, website, es_sin_tacc, es_vegano, es_vegetariano, latitud, longitud, fuente_dato
        FROM restaurantes
        {where_sql}
        ORDER BY id ASC;
    """
    return query_db(sql, tuple(params))

def get_venue_by_id(venue_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve full details of a specific venue."""
    return query_db("SELECT * FROM restaurantes WHERE id = ?;", (venue_id,), one=True)

def search_restaurants(
    query: Optional[str] = None,
    barrio: Optional[str] = None,
    categoria: Optional[str] = None,
    cocina: Optional[str] = None,
    es_sin_tacc: Optional[bool] = None,
    es_vegano: Optional[bool] = None,
    es_vegetariano: Optional[bool] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radio_km: Optional[float] = None,
    solo_con_contacto: Optional[bool] = None,
    limit: int = 15,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Search and filter restaurants in CABA and GBA.
    Supports FTS5 full-text queries, structured filters, and geospatial distance calculation.
    """
    params = []
    where_clauses = []
    use_fts = False

    # 1. Text search
    if query and query.strip():
        clean_q = query.strip().replace("'", "").replace('"', "")
        # Remove common stop words for FTS
        tokens = [t for t in clean_q.split() if len(t) > 2 and t.lower() not in ["los", "las", "del", "con", "para", "por", "una", "uno"]]
        if tokens:
            fts_term = " ".join([f'"{t}"*' for t in tokens])
            where_clauses.append("r.id IN (SELECT id FROM restaurantes_fts WHERE restaurantes_fts MATCH ?)")
            params.append(fts_term)
            use_fts = True
        else:
            where_clauses.append("(r.nombre LIKE ? OR r.cocina LIKE ?)")
            params.extend([f"%{clean_q}%", f"%{clean_q}%"])

    # 2. Neighborhood / Locality filter
    if barrio and barrio.strip():
        b = barrio.strip()
        if b.lower() not in ["todos", "todas", "cualquiera", "ambas", "caba y gba"]:
            where_clauses.append("r.barrio_localidad LIKE ?")
            params.append(f"%{b}%")

    # 3. Category filter
    if categoria and categoria.strip():
        cat = categoria.strip()
        if cat.lower() not in ["todos", "todas", "cualquiera"]:
            where_clauses.append("r.tipo_categoria = ?")
            params.append(cat)

    # 4. Cuisine filter
    if cocina and cocina.strip():
        where_clauses.append("r.cocina LIKE ?")
        params.append(f"%{cocina.strip()}%")

    # 5. Dietary restrictions
    if es_sin_tacc:
        where_clauses.append("r.es_sin_tacc LIKE 'Apto%'")
    if es_vegano:
        where_clauses.append("r.es_vegano LIKE 'Apto%'")
    if es_vegetariano:
        where_clauses.append("r.es_vegetariano LIKE 'Apto%'")

    # 6. Contact availability filter
    if solo_con_contacto:
        where_clauses.append("((r.telefono IS NOT NULL AND r.telefono != '') OR (r.website IS NOT NULL AND r.website != ''))")

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Count total matching results
    count_sql = f"SELECT COUNT(*) as count FROM restaurantes r {where_sql};"
    total_matches = query_db(count_sql, tuple(params), one=True)["count"]

    # Order priority:
    # 1. Venues with contact phone/web prioritized (for health confirmation safety!)
    # 2. Name ascending
    order_by_sql = """
        ORDER BY 
            (CASE WHEN (r.telefono IS NOT NULL AND r.telefono != '') OR (r.website IS NOT NULL AND r.website != '') THEN 1 ELSE 2 END) ASC,
            r.nombre ASC
    """

    # Fetch rows
    fetch_sql = f"""
        SELECT 
            r.id, r.id_origen, r.nombre, r.tipo_establecimiento, r.tipo_categoria,
            r.cocina, r.direccion, r.barrio_localidad, r.telefono, r.website,
            r.es_vegano, r.es_vegetariano, r.es_sin_tacc, r.latitud, r.longitud, r.fuente_dato
        FROM restaurantes r
        {where_sql}
        {order_by_sql}
        LIMIT ? OFFSET ?;
    """
    fetch_params = tuple(params + [limit, offset])
    rows = query_db(fetch_sql, fetch_params)

    # Calculate distance if user lat/lon provided
    results = []
    for row in rows:
        item = dict(row)
        if lat is not None and lon is not None:
            dist = haversine_distance(lat, lon, item["latitud"], item["longitud"])
            item["distancia_km"] = dist
            if radio_km is not None and dist > radio_km:
                continue
        results.append(item)

    if lat is not None and lon is not None:
        results.sort(key=lambda x: x.get("distancia_km", 9999))

    return {
        "total": total_matches,
        "returned": len(results),
        "limit": limit,
        "offset": offset,
        "results": results
    }
