"""
SHELFLIFE AI - Geopolitical Rerouting Engine
POST /api/reroute
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

CHOKEPOINTS = {
    "strait_of_hormuz": {
        "name": "Strait of Hormuz", "region": "Persian Gulf",
        "hazard_polygon": [[26.8,55.8],[27.1,56.3],[26.4,57.1],[25.9,57.3],[25.6,56.5],[26.0,55.9],[26.8,55.8]],
        "affected_corridor": {"lat_min":22.0,"lat_max":30.0,"lon_min":50.0,"lon_max":62.0},
        "routes": [
            {"id":"cape_good_hope","name":"Cape of Good Hope","description":"South via Cape of Good Hope - avoids Persian Gulf entirely","waypoints":[[24.0,58.0],[12.0,50.0],[-10.0,40.0],[-34.4,18.5],[-20.0,15.0],[0.0,5.0]],"extra_days":14,"extra_fuel_pct":35,"spoilage_risk_delta":28,"color":"#f59e0b","recommended":False},
            {"id":"oman_air","name":"Oman Sea Bypass + Air Freight","description":"Port of Salalah transfer to air cargo for ultra-perishables","waypoints":[[24.0,58.0],[19.0,57.5],[17.0,54.0],[16.9,53.0]],"extra_days":2,"extra_fuel_pct":80,"spoilage_risk_delta":4,"color":"#0d9488","recommended":True},
            {"id":"karachi_land","name":"Karachi Land Bridge","description":"Offload at Karachi - road freight via Iran border to Turkey","waypoints":[[24.0,58.0],[23.6,58.6],[24.9,67.0],[24.8,67.0]],"extra_days":6,"extra_fuel_pct":20,"spoilage_risk_delta":14,"color":"#8b5cf6","recommended":False},
        ],
    },
    "suez_canal": {
        "name": "Suez Canal", "region": "Red Sea / Egypt",
        "hazard_polygon": [[31.3,32.1],[31.5,32.4],[30.7,32.7],[30.4,32.5],[30.5,32.1],[31.3,32.1]],
        "affected_corridor": {"lat_min":28.0,"lat_max":34.0,"lon_min":30.0,"lon_max":36.0},
        "routes": [
            {"id":"cape_good_hope_suez","name":"Cape of Good Hope","description":"Full southern bypass via Cape - longest but safest","waypoints":[[25.0,35.0],[12.0,44.0],[-10.0,42.0],[-34.4,18.5],[-20.0,10.0],[0.0,5.0]],"extra_days":12,"extra_fuel_pct":30,"spoilage_risk_delta":24,"color":"#f59e0b","recommended":False},
            {"id":"turkey_rail","name":"Turkey Rail Corridor","description":"Mersin port - Turkey rail to Europe, fast for EU-bound cargo","waypoints":[[31.0,32.5],[35.0,33.5],[36.8,36.2],[37.0,35.3]],"extra_days":3,"extra_fuel_pct":15,"spoilage_risk_delta":6,"color":"#0d9488","recommended":True},
            {"id":"haifa_land","name":"Haifa Port Land Bridge","description":"Haifa port - overland to Ashdod - Mediterranean sailing","waypoints":[[31.0,32.5],[32.0,34.8],[31.8,34.9]],"extra_days":2,"extra_fuel_pct":18,"spoilage_risk_delta":5,"color":"#8b5cf6","recommended":False},
        ],
    },
    "red_sea_bab_el_mandeb": {
        "name": "Red Sea / Bab el-Mandeb", "region": "Yemen Strait",
        "hazard_polygon": [[12.8,43.2],[13.1,43.6],[12.3,44.0],[11.9,43.8],[12.1,43.1],[12.8,43.2]],
        "affected_corridor": {"lat_min":10.0,"lat_max":16.0,"lon_min":40.0,"lon_max":48.0},
        "routes": [
            {"id":"cape_red","name":"Cape of Good Hope","description":"Full southern bypass - avoids entire Red Sea","waypoints":[[12.0,45.0],[2.0,50.0],[-10.0,42.0],[-34.4,18.5],[-15.0,10.0]],"extra_days":10,"extra_fuel_pct":28,"spoilage_risk_delta":20,"color":"#f59e0b","recommended":False},
            {"id":"djibouti_air","name":"Djibouti Air Freight Hub","description":"Djibouti transship + air freight for ultra-perishables","waypoints":[[12.0,44.0],[11.6,43.1],[11.5,43.1]],"extra_days":1,"extra_fuel_pct":200,"spoilage_risk_delta":2,"color":"#0d9488","recommended":True},
            {"id":"oman_gulf","name":"Oman Gulf Route","description":"East of Arabian peninsula via Gulf of Oman","waypoints":[[12.0,45.0],[15.0,52.0],[20.0,58.0],[24.0,58.5]],"extra_days":5,"extra_fuel_pct":14,"spoilage_risk_delta":10,"color":"#8b5cf6","recommended":False},
        ],
    },
    "strait_of_malacca": {
        "name": "Strait of Malacca", "region": "Southeast Asia",
        "hazard_polygon": [[2.5,103.5],[2.8,104.2],[1.5,104.8],[1.0,104.3],[1.2,103.4],[2.5,103.5]],
        "affected_corridor": {"lat_min":-1.0,"lat_max":6.0,"lon_min":100.0,"lon_max":106.0},
        "routes": [
            {"id":"lombok","name":"Lombok Strait","description":"Indonesia inner passage via Lombok Strait - minimal delay","waypoints":[[1.5,103.0],[-2.0,106.0],[-8.5,116.0],[-8.4,116.1]],"extra_days":2,"extra_fuel_pct":8,"spoilage_risk_delta":4,"color":"#0d9488","recommended":True},
            {"id":"sunda","name":"Sunda Strait","description":"West Java passage between Java and Sumatra","waypoints":[[1.5,103.0],[-3.0,105.5],[-6.0,106.0],[-6.1,106.8]],"extra_days":3,"extra_fuel_pct":12,"spoilage_risk_delta":6,"color":"#8b5cf6","recommended":False},
            {"id":"thailand_rail","name":"Thailand Kra Rail","description":"Thailand rail land bridge Ranong to Surat Thani","waypoints":[[2.5,102.0],[9.9,98.6],[9.1,99.3]],"extra_days":1,"extra_fuel_pct":25,"spoilage_risk_delta":2,"color":"#f59e0b","recommended":False},
        ],
    },
}

CONTAINER_POSITIONS = {
    "DPW-1024A": {"lat":18.94,"lon":66.50,"cargo":"Pharmaceuticals","shelf_life_hours":720},
    "DPW-1024B": {"lat":12.50,"lon":75.50,"cargo":"Fresh Produce","shelf_life_hours":36},
    "DPW-1024C": {"lat":18.94,"lon":72.84,"cargo":"Seafood","shelf_life_hours":48},
    "DPW-1024D": {"lat":14.00,"lon":115.0,"cargo":"Vaccines","shelf_life_hours":2160},
    "DPW-1024E": {"lat":1.352,"lon":103.82,"cargo":"Dairy","shelf_life_hours":72},
    "CONT-001":  {"lat":25.20,"lon":55.27,"cargo":"Fresh Produce","shelf_life_hours":48},
}

def _urgency(h):
    if h < 48: return "critical"
    if h < 120: return "high"
    return "medium"

def _in_corridor(lat, lon, c):
    return c["lat_min"] <= lat <= c["lat_max"] and c["lon_min"] <= lon <= c["lon_max"]

@router.post("")
async def compute_reroute(req: dict):
    key = req.get("chokepoint","").lower().replace(" ","_").replace("-","_")
    if key not in CHOKEPOINTS:
        raise HTTPException(status_code=404, detail=f"Unknown chokepoint: {key}")
    cp = CHOKEPOINTS[key]
    corridor = cp["affected_corridor"]
    affected = [
        {"id":cid,"cargo":pos["cargo"],"shelf_life_hours":pos["shelf_life_hours"],
         "urgency":_urgency(pos["shelf_life_hours"]),"lat":pos["lat"],"lon":pos["lon"]}
        for cid,pos in CONTAINER_POSITIONS.items()
        if _in_corridor(pos["lat"],pos["lon"],corridor)
    ]
    logger.info(f"[REROUTE] {cp['name']} -- {len(affected)} containers affected")
    return {
        "chokepoint_name": cp["name"],
        "region": cp["region"],
        "hazard_polygon": cp["hazard_polygon"],
        "affected_containers": affected,
        "routes": cp["routes"],
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/chokepoints")
async def list_chokepoints():
    return [{"key":k,"name":v["name"],"region":v["region"]} for k,v in CHOKEPOINTS.items()]
