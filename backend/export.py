import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine
import os

load_dotenv()

DB_URL = os.getenv("DB_URL")

if not DB_URL:
    raise ValueError("DB_URL not found in .env")

# ── Change these to the month you want ──────────────────────
MONTH_START = "2026-04-01"
MONTH_END   = "2026-05-01"
# ────────────────────────────────────────────────────────────

print(f"Connecting to database...")
engine = create_engine(DB_URL)
print("Connected.")

query = f"""
    SELECT *
    FROM points
    WHERE stime >= '{MONTH_START}'
      AND stime <  '{MONTH_END}'
    ORDER BY stime DESC
"""

print(f"Querying rows for {MONTH_START} → {MONTH_END}...")
df = pd.read_sql(query, engine)
print(f"Fetched {len(df):,} rows.")

output_file = f"points_export_{MONTH_START[:7]}.xlsx"
print(f"Writing to {output_file}...")
df.to_excel(output_file, index=False)
print(f"Done. File saved: {output_file}")