#!/usr/bin/env python3
"""
Fetch lat/lng for all districts using Open-Meteo Geocoding API.
Much faster than Nominatim (no 1req/s limit).
Supports resume via progress file.
"""

import json
import time
import urllib.request
import urllib.parse
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DISTRICTS_FILE = os.path.join(PROJECT_DIR, "assets/data/districts.json")
STATES_FILE = os.path.join(PROJECT_DIR, "assets/data/states.json")
PROGRESS_FILE = os.path.join(SCRIPT_DIR, ".geocode-progress.json")

OPEN_METEO_URL = "https://geocoding-api.open-meteo.com/v1/search"

# Turkish char normalization for matching
def normalize_tr(s: str) -> str:
    return (s.upper()
        .replace("İ", "I").replace("Ö", "O").replace("Ü", "U")
        .replace("Ş", "S").replace("Ç", "C").replace("Ğ", "G")
        .replace("Â", "A").replace("Î", "I").replace("Û", "U"))


def geocode(name: str, state_name: str) -> dict | None:
    params = urllib.parse.urlencode({
        "name": name,
        "count": "10",
        "language": "tr",
        "format": "json",
    })
    url = f"{OPEN_METEO_URL}?{params}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            results = data.get("results", [])
            
            # Filter to Turkey only
            results = [r for r in results if r.get("country_code") == "TR"]
            
            if not results:
                return None
            
            # Try to match by admin1 (state/il)
            norm_state = normalize_tr(state_name)
            for r in results:
                admin1 = r.get("admin1", "")
                if normalize_tr(admin1) == norm_state:
                    return {"lat": round(r["latitude"], 6), "lng": round(r["longitude"], 6)}
            
            # Partial match
            for r in results:
                admin1 = r.get("admin1", "")
                if norm_state[:4] in normalize_tr(admin1) or normalize_tr(admin1)[:4] in norm_state:
                    return {"lat": round(r["latitude"], 6), "lng": round(r["longitude"], 6)}
            
            # Just take first Turkey result
            r = results[0]
            return {"lat": round(r["latitude"], 6), "lng": round(r["longitude"], 6)}
    except Exception as e:
        print(f"  ERROR: {e}")
    return None


def geocode_state(state_name: str) -> dict | None:
    """Geocode a state/il name as fallback."""
    params = urllib.parse.urlencode({
        "name": state_name,
        "count": "5",
        "language": "tr",
        "format": "json",
    })
    url = f"{OPEN_METEO_URL}?{params}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            results = [r for r in data.get("results", []) if r.get("country_code") == "TR"]
            if results:
                r = results[0]
                return {"lat": round(r["latitude"], 6), "lng": round(r["longitude"], 6)}
    except Exception as e:
        print(f"  STATE ERROR: {e}")
    return None


def main():
    with open(DISTRICTS_FILE, "r", encoding="utf-8") as f:
        districts = json.load(f)
    with open(STATES_FILE, "r", encoding="utf-8") as f:
        states = json.load(f)

    state_map = {s["id"]: s["name"] for s in states}

    # Load progress
    progress = {}
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            progress = json.load(f)
        print(f"Resuming ({len(progress)} cached)")

    total = len(districts)
    found = 0
    not_found_ids = []

    for i, d in enumerate(districts):
        did = d["id"]
        state_name = state_map.get(d["state_id"], "")

        if did in progress:
            d["lat"] = progress[did]["lat"]
            d["lng"] = progress[did]["lng"]
            found += 1
            continue

        print(f"[{i+1}/{total}] {d['name']}, {state_name}...", end=" ", flush=True)

        result = geocode(d["name"], state_name)

        if result:
            d["lat"] = result["lat"]
            d["lng"] = result["lng"]
            progress[did] = result
            found += 1
            print(f"OK ({result['lat']}, {result['lng']})")
        else:
            not_found_ids.append(did)
            print("NOT FOUND")

        # Save progress every 50 items
        if (i + 1) % 50 == 0:
            with open(PROGRESS_FILE, "w") as f:
                json.dump(progress, f)
            print(f"  --- progress saved: {found}/{i+1} ---")

        # Small delay to be polite
        time.sleep(0.15)

    # Handle not-found: use state center
    state_coords = {}
    for did in not_found_ids:
        d = next(dd for dd in districts if dd["id"] == did)
        sid = d["state_id"]
        state_name = state_map.get(sid, "")

        if sid not in state_coords:
            print(f"Getting state center for {state_name}...", end=" ", flush=True)
            result = geocode_state(state_name)
            if result:
                state_coords[sid] = result
                print(f"OK ({result['lat']}, {result['lng']})")
            else:
                state_coords[sid] = {"lat": 39.9334, "lng": 32.8597}
                print("FALLBACK Ankara")
            time.sleep(0.15)

        d["lat"] = state_coords[sid]["lat"]
        d["lng"] = state_coords[sid]["lng"]
        progress[did] = state_coords[sid]
        found += 1

    # Final save
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f)
    with open(DISTRICTS_FILE, "w", encoding="utf-8") as f:
        json.dump(districts, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {found}/{total} districts geocoded.")
    if not_found_ids:
        names = [next(d["name"] for d in districts if d["id"] == did) for did in not_found_ids]
        print(f"Used state center for: {names}")


if __name__ == "__main__":
    main()
