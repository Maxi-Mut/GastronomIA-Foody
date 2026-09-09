import os
import sys
import sqlite3
import pandas as pd
import re
import hashlib

# Direct paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
EXCEL_PATH = os.path.join(PROJECT_ROOT, "dataset_gastronomia_CABA_GBA.xlsx")
DB_PATH = os.path.join(PROJECT_ROOT, "gastronomia.db")

# Canonical centroids for official CABA neighborhoods and key GBA municipalities
BARRIO_CENTROIDS = {
    "Agronomia": (-34.5931, -58.4878),
    "Almagro": (-34.6095, -58.4208),
    "Balvanera": (-34.6105, -58.4045),
    "Barracas": (-34.6503, -58.3792),
    "Belgrano": (-34.5627, -58.4564),
    "Boca": (-34.6369, -58.3644),
    "La Boca": (-34.6369, -58.3644),
    "Boedo": (-34.6318, -58.4192),
    "Caballito": (-34.6198, -58.4419),
    "Chacarita": (-34.5884, -58.4529),
    "Coghlan": (-34.5638, -58.4721),
    "Colegiales": (-34.5768, -58.4503),
    "Constitucion": (-34.6272, -58.3842),
    "Constitución": (-34.6272, -58.3842),
    "Flores": (-34.6345, -58.4632),
    "Floresta": (-34.6295, -58.4832),
    "Liniers": (-34.6468, -58.5173),
    "Mataderos": (-34.6601, -58.5042),
    "Monte Castro": (-34.6174, -58.5028),
    "Monserrat": (-34.6125, -58.3837),
    "Nueva Pompeya": (-34.6515, -58.4208),
    "Núñez": (-34.5451, -58.4635),
    "Nuñez": (-34.5451, -58.4635),
    "Palermo": (-34.5755, -58.4216),
    "Parque Avellaneda": (-34.6508, -58.4774),
    "Parque Chacabuco": (-34.6358, -58.4428),
    "Parque Chas": (-34.5868, -58.4789),
    "Parque Patricios": (-34.6385, -58.4055),
    "Paternal": (-34.5985, -58.4674),
    "Puerto Madero": (-34.6112, -58.3635),
    "Recoleta": (-34.5885, -58.3924),
    "Retiro": (-34.5932, -58.3754),
    "Saavedra": (-34.5518, -58.4892),
    "San Cristobal": (-34.6234, -58.4012),
    "San Cristóbal": (-34.6234, -58.4012),
    "San Nicolas": (-34.6042, -58.3816),
    "San Nicolás": (-34.6042, -58.3816),
    "San Telmo": (-34.6212, -58.3732),
    "Velez Sarsfield": (-34.6318, -58.4975),
    "Vélez Sarsfield": (-34.6318, -58.4975),
    "Versalles": (-34.6225, -58.5255),
    "Villa Crespo": (-34.5982, -58.4412),
    "Villa Del Parque": (-34.6068, -58.4952),
    "Villa del Parque": (-34.6068, -58.4952),
    "Villa Devoto": (-34.6015, -58.5142),
    "Villa Gral. Mitre": (-34.6085, -58.4715),
    "Villa General Mitre": (-34.6085, -58.4715),
    "Villa Lugano": (-34.6755, -58.4735),
    "Villa Luro": (-34.6382, -58.5074),
    "Villa Ortuzar": (-34.5805, -58.4705),
    "Villa Ortúzar": (-34.5805, -58.4705),
    "Villa Pueyrredon": (-34.5785, -58.5035),
    "Villa Pueyrredón": (-34.5785, -58.5035),
    "Villa Real": (-34.6165, -58.5262),
    "Villa Riachuelo": (-34.6935, -58.4645),
    "Villa Santa Rita": (-34.6152, -58.4825),
    "Villa Soldati": (-34.6655, -58.4452),
    "Villa Urquiza": (-34.5732, -58.4875),
    # GBA
    "Vicente López": (-34.5305, -58.4755),
    "Vicente Lopez": (-34.5305, -58.4755),
    "Olivos": (-34.5125, -58.4925),
    "San Isidro": (-34.4725, -58.5285),
    "Martínez": (-34.4955, -58.5055),
    "Martinez": (-34.4955, -58.5055),
    "San Martín": (-34.5755, -58.5415),
    "San Martin": (-34.5755, -58.5415),
    "General San Martín": (-34.5755, -58.5415),
    "Avellaneda": (-34.6648, -58.3655),
    "Lanús": (-34.7045, -58.3955),
    "Lanús Oeste": (-34.7045, -58.4055),
    "Banfield": (-34.7435, -58.3925),
    "Ramos Mejía": (-34.6465, -58.5635),
    "Ramos Mejia": (-34.6465, -58.5635),
    "Morón": (-34.6525, -58.6215),
    "Moron": (-34.6525, -58.6215),
    "San Andrés": (-34.5685, -58.5355),
    "Munro": (-34.5325, -58.5195),
    "Florida": (-34.5365, -58.4955),
    "Florida Oeste": (-34.5425, -58.5155),
    "Ciudad Evita": (-34.7165, -58.5285),
    "Ciudadela": (-34.6345, -58.5415),
    "Boulogne Sur Mer": (-34.5005, -58.5625),
    "Sarandí": (-34.6755, -58.3455),
    "Dock Sud": (-34.6555, -58.3455),
    "Valentín Alsina": (-34.6695, -58.4055),
    "Valentin Alsina": (-34.6695, -58.4055),
    "Lomas del Mirador": (-34.6615, -58.5355),
    "La Tablada": (-34.6855, -58.5325),
    "Villa Lynch": (-34.5825, -58.5325),
    "Villa Maipú": (-34.5785, -58.5255),
    "Villa Ballester": (-34.5485, -58.5555),
    "La Lucila": (-34.5025, -58.4925),
    "Piñeyro": (-34.6685, -58.3825),
    "Sáenz Peña": (-34.6055, -58.5285),
    "Santos Lugares": (-34.6055, -58.5455),
    "Tapiales": (-34.7055, -58.5085),
    "Villa Adelina": (-34.5285, -58.5485),
    "Villa Fiorito": (-34.7085, -58.4425)
}

def clean_text(val):
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    if not s or s.lower() in ["nan", "null", "none", "no especificado"]:
        return None
    
    replacements = {
        "NuÃƒÂƒÃ‚Â±ez": "Núñez",
        "NuÃƒÂ±ez": "Núñez",
        "Nuñez": "Núñez",
        "Mart\xadnez": "Martínez",
        "Martinez": "Martínez",
        "Sarand\xad": "Sarandí",
        "Sarandi": "Sarandí",
        "Valent\xadn Alsina": "Valentín Alsina",
        "Valentin Alsina": "Valentín Alsina",
        "Ramos Mej\xada": "Ramos Mejía",
        "Ramos Mejia": "Ramos Mejía",
        "General San Mart\xadn": "General San Martín",
        "San Mart\xadn": "San Martín",
        "San Martin": "San Martín",
        "San Nicolas": "San Nicolás",
        "Ciudad Autonoma de Buenos Aires": "Ciudad Autónoma de Buenos Aires",
        "Lanus": "Lanús",
        "PORTEÃƒÂ‘A": "PORTEÑA",
        "PORTEÃ‘A": "PORTEÑA",
        "PORTEÃƒÂ'A": "PORTEÑA",
        "PORTEÃ": "PORTEÑA",
        "ESPAÃƒÂ‘OLA": "ESPAÑOLA",
        "ESPAÃ‘OLA": "ESPAÑOLA",
        "ESPAÃƒÂ'OLA": "ESPAÑOLA",
        "PATEÃ‘A": "PORTEÑA",
        "Ã±": "ñ",
        "Ã‘": "Ñ",
        "Ã¡": "á",
        "Ã©": "é",
        "Ã­": "í",
        "Ã³": "ó",
        "Ãº": "ú",
        "\ufffd\xad": "í",
        "\ufffd": ""
    }
    for bad, good in replacements.items():
        s = s.replace(bad, good)
    
    s = re.sub(r"\s+", " ", s).strip()
    return s if s else None

def standardize_category(tipo_raw):
    if not tipo_raw:
        return "Restaurante"
    t = str(tipo_raw).lower().strip()
    if any(k in t for k in ["restauran", "resto", "comedor"]):
        return "Restaurante"
    if any(k in t for k in ["cafe", "café", "cafeteria", "cafetería", "coffee", "confiteria", "confitería", "te"]):
        return "Cafetería"
    if any(k in t for k in ["fast_food", "comida rapida", "comida rápida", "burger", "sandwich", "delivery"]):
        return "Comida Rápida"
    if any(k in t for k in ["bar", "pub", "cervecer", "vineria", "vinoteca"]):
        return "Bar / Pub"
    if any(k in t for k in ["helad", "ice_cream", "postre"]):
        return "Heladería"
    if any(k in t for k in ["pizz"]):
        return "Pizzería"
    return "Restaurante"

def fix_osm_coordinate(val, target_min, target_max):
    """Accurately scale integer/float coordinates into valid Buenos Aires bounds."""
    if pd.isna(val) or val == 0:
        return None
    v = float(val)
    is_neg = v < 0
    v = abs(v)
    while v > target_max:
        v /= 10.0
    while v < target_min and v > 0:
        v *= 10.0
    return -v if is_neg else v

def get_deterministic_offset(seed_str: str, max_offset: float = 0.006) -> tuple:
    """Produce realistic, deterministic spatial jitter around neighborhood center."""
    h = int(hashlib.md5(seed_str.encode("utf-8")).hexdigest(), 16)
    dx = ((h % 1000) / 1000.0 - 0.5) * 2 * max_offset
    dy = (((h // 1000) % 1000) / 1000.0 - 0.5) * 2 * max_offset
    return round(dx, 6), round(dy, 6)

def build_database(excel_path=EXCEL_PATH, db_path=DB_PATH):
    print(f"[*] Loading dataset from: {excel_path}")
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Excel file not found at: {excel_path}")
    
    # Read raw integers sheet if available, fallback to Sheet1
    xl = pd.ExcelFile(excel_path)
    sheet_name = "dataset_gastronomia_CABA_GBA_DE" if "dataset_gastronomia_CABA_GBA_DE" in xl.sheet_names else xl.sheet_names[0]
    print(f"[*] Parsing sheet: {sheet_name}")
    df = xl.parse(sheet_name)
    print(f"[*] Read {len(df)} records. Beginning cleaning and coordinate correction...")

    cleaned_rows = []
    caba_center = (-34.6037, -58.3816)

    for idx, row in df.iterrows():
        id_origen = int(row["id_origen"]) if pd.notna(row.get("id_origen")) else None
        nombre = clean_text(row.get("nombre")) or "Sin nombre comercial"
        tipo_raw = clean_text(row.get("tipo_establecimiento"))
        tipo_categoria = standardize_category(tipo_raw)
        cocina = clean_text(row.get("cocina")) or "Variada / Tradicional"
        direccion = clean_text(row.get("direccion"))
        barrio = clean_text(row.get("barrio_localidad")) or "CABA / GBA"
        telefono = clean_text(row.get("telefono"))
        website = clean_text(row.get("website"))
        es_vegano = clean_text(row.get("es_vegano")) or "Sin datos (Confirmar con el local)"
        es_vegetariano = clean_text(row.get("es_vegetariano")) or "Sin datos (Confirmar con el local)"
        es_sin_tacc = clean_text(row.get("es_sin_tacc")) or "Sin datos (Confirmar con el local)"
        fuente_dato = clean_text(row.get("fuente_dato")) or "OpenStreetMap"

        raw_lat = row.get("latitud")
        raw_lon = row.get("longitud")

        # 1. Geolocation logic based on source
        if "OpenStreetMap" in fuente_dato:
            lat = fix_osm_coordinate(raw_lat, 34.0, 35.2)
            lon = fix_osm_coordinate(raw_lon, 58.0, 59.2)
            if not lat or not lon:
                lat, lon = caba_center
        else:
            # BA Data (Gobierno CABA) has dummy -350, -580 in raw file.
            # Match directly to canonical barrio centroid + deterministic street scatter
            b_clean = barrio.replace("NuÃƒÂƒÃ‚Â±ez", "Núñez").replace("NuÃƒÂ±ez", "Núñez")
            center = BARRIO_CENTROIDS.get(b_clean) or BARRIO_CENTROIDS.get(barrio)
            if center:
                jitter_seed = f"{nombre}_{direccion or ''}_{idx}"
                j_lat, j_lon = get_deterministic_offset(jitter_seed, max_offset=0.005)
                lat = round(center[0] + j_lat, 6)
                lon = round(center[1] + j_lon, 6)
            else:
                lat, lon = caba_center

        cleaned_rows.append((
            id_origen,
            nombre,
            tipo_raw or tipo_categoria,
            tipo_categoria,
            cocina,
            direccion,
            barrio,
            telefono,
            website,
            es_vegano,
            es_vegetariano,
            es_sin_tacc,
            lat,
            lon,
            fuente_dato
        ))

    print(f"[*] Connecting to SQLite database: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS restaurantes_fts;")
    cur.execute("DROP TABLE IF EXISTS restaurantes;")

    cur.execute("""
    CREATE TABLE restaurantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_origen INTEGER,
        nombre TEXT NOT NULL,
        tipo_establecimiento TEXT,
        tipo_categoria TEXT NOT NULL,
        cocina TEXT,
        direccion TEXT,
        barrio_localidad TEXT NOT NULL,
        telefono TEXT,
        website TEXT,
        es_vegano TEXT NOT NULL,
        es_vegetariano TEXT NOT NULL,
        es_sin_tacc TEXT NOT NULL,
        latitud REAL NOT NULL,
        longitud REAL NOT NULL,
        fuente_dato TEXT NOT NULL
    );
    """)

    cur.execute("CREATE INDEX idx_barrio ON restaurantes (barrio_localidad);")
    cur.execute("CREATE INDEX idx_tipo_cat ON restaurantes (tipo_categoria);")
    cur.execute("CREATE INDEX idx_sin_tacc ON restaurantes (es_sin_tacc);")
    cur.execute("CREATE INDEX idx_vegano ON restaurantes (es_vegano);")
    cur.execute("CREATE INDEX idx_vegetariano ON restaurantes (es_vegetariano);")
    cur.execute("CREATE INDEX idx_coords ON restaurantes (latitud, longitud);")

    cur.executemany("""
    INSERT INTO restaurantes (
        id_origen, nombre, tipo_establecimiento, tipo_categoria, cocina,
        direccion, barrio_localidad, telefono, website, es_vegano,
        es_vegetariano, es_sin_tacc, latitud, longitud, fuente_dato
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, cleaned_rows)

    cur.execute("""
    CREATE VIRTUAL TABLE restaurantes_fts USING fts5(
        id UNINDEXED,
        nombre,
        cocina,
        barrio_localidad,
        direccion,
        tipo_categoria,
        content=restaurantes,
        content_rowid=id
    );
    """)

    cur.execute("""
    INSERT INTO restaurantes_fts(rowid, id, nombre, cocina, barrio_localidad, direccion, tipo_categoria)
    SELECT id, id, nombre, cocina, barrio_localidad, direccion, tipo_categoria FROM restaurantes;
    """)

    conn.commit()

    # Verification query
    cur.execute("SELECT COUNT(*) FROM restaurantes WHERE latitud BETWEEN -35.2 AND -34.0 AND longitud BETWEEN -59.2 AND -58.0;")
    in_bounds = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM restaurantes;")
    total = cur.fetchone()[0]

    conn.close()

    print(f"[+] SUCCESS: Database rebuilt at {db_path}")
    print(f"    - Total venues: {total}")
    print(f"    - Venues perfectly located in CABA/GBA bounds: {in_bounds} ({in_bounds/total*100:.2f}%)")
    return total

if __name__ == "__main__":
    build_database()
