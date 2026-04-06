#!/usr/bin/env python3
"""
Convert PilotLogbook.xlsx to logbook.json for the Pilot Logbook web app.

Run from the project root:
    python3 scripts/import_excel.py

Then upload logbook.json to Dropbox at:
    Apps/PilotLogbook/logbook.json
"""

import json
import uuid
from datetime import datetime, time
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("openpyxl not found. Install it with:  pip3 install openpyxl")
    raise SystemExit(1)

# ── Helpers ───────────────────────────────────────────────────────────────────

def time_to_minutes(value) -> int | None:
    """Convert a datetime.time object to total minutes, or None."""
    if value is None:
        return None
    if isinstance(value, time):
        return value.hour * 60 + value.minute
    return None


def format_time(value) -> str | None:
    """Format a datetime.time object as 'HH:MM' string."""
    if isinstance(value, time):
        return f"{value.hour:02d}:{value.minute:02d}"
    return None


def format_date(value) -> str | None:
    """Format a datetime object as 'YYYY-MM-DD' string."""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, str):
        return value
    return None


def calc_minutes(start: time | None, end: time | None) -> int | None:
    """Calculate duration in minutes between two time objects (same day)."""
    if not isinstance(start, time) or not isinstance(end, time):
        return None
    s = start.hour * 60 + start.minute
    e = end.hour * 60 + end.minute
    return e - s if e > s else None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    project_root = Path(__file__).parent.parent
    excel_path   = project_root / "PilotLogbook.xlsx"
    output_path  = project_root / "logbook.json"

    if not excel_path.exists():
        print(f"ERROR: Excel file not found at {excel_path}")
        raise SystemExit(1)

    print(f"Reading {excel_path} …")
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active

    flights = []

    for row_idx, row in enumerate(ws.iter_rows(values_only=True)):
        if row_idx == 0:
            continue  # skip header

        (date, registration, model, flight_start, flight_end, total_flight_time,
         from_icao, to_icao, landings, name_of_pic, cross_country, night,
         se, flight_rules, pic, co_pilot, dual, fi, comments) = row

        # Skip empty rows
        if date is None and registration is None:
            continue

        # Total flight time: prefer the cell value if it's a real time object,
        # otherwise calculate from block-off / block-on
        if isinstance(total_flight_time, time):
            total_mins = time_to_minutes(total_flight_time)
        else:
            total_mins = calc_minutes(flight_start, flight_end)

        flight = {
            "id":              str(uuid.uuid4()),
            "date":            format_date(date),
            "registration":    str(registration).strip().upper() if registration else "",
            "model":           str(model).strip()                if model        else "",
            "flightStart":     format_time(flight_start),
            "flightEnd":       format_time(flight_end),
            "totalFlightTime": total_mins,
            "from":            str(from_icao).strip().upper()    if from_icao    else "",
            "to":              str(to_icao).strip().upper()      if to_icao      else "",
            "landings":        int(landings)                     if landings is not None else 0,
            "nameOfPIC":       str(name_of_pic).strip()          if name_of_pic  else "",
            "crossCountry":    time_to_minutes(cross_country),
            "night":           time_to_minutes(night),
            "se":              se == "Yes" or se is True,
            "flightRules":     str(flight_rules).strip()         if flight_rules else "VFR",
            "pic":             time_to_minutes(pic),
            "coPilot":         time_to_minutes(co_pilot),
            "dual":            time_to_minutes(dual),
            "fi":              time_to_minutes(fi),
            "comments":        str(comments).strip() if comments else None,
        }

        # Normalise empty comments to null
        if flight["comments"] == "":
            flight["comments"] = None

        flights.append(flight)

    # Sort newest first (matches app behaviour)
    flights.sort(
        key=lambda f: (f["date"] or "", f["flightStart"] or ""),
        reverse=True,
    )

    logbook = {"version": 1, "flights": flights}

    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(logbook, fh, indent=2, ensure_ascii=False)

    print(f"Done — exported {len(flights)} flights to {output_path}")
    print()
    print("Next steps:")
    print("  1. Open dropbox.com")
    print("  2. Navigate to  Apps / PilotLogbook /")
    print("  3. Upload  logbook.json")
    print("  4. Open the app on your iPad and tap  Settings → Sync Now")


if __name__ == "__main__":
    main()
