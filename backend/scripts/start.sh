#!/bin/bash
set -e

echo "Running database migrations..."

# Check if alembic_version table exists and has records
# If tables exist but alembic hasn't tracked them, stamp to current head
python3 << 'EOF'
import sqlite3
import os

db_url = os.environ.get("DATABASE_URL", "sqlite:///./data/marketplace.db")
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    if db_path.startswith("./"):
        db_path = db_path[2:]

    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if categories table exists (from initial migration)
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
        tables_exist = cursor.fetchone() is not None

        # Check if alembic_version table exists and has entries
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'")
        alembic_exists = cursor.fetchone() is not None

        alembic_has_version = False
        if alembic_exists:
            cursor.execute("SELECT COUNT(*) FROM alembic_version")
            alembic_has_version = cursor.fetchone()[0] > 0

        conn.close()

        if tables_exist and not alembic_has_version:
            print("Tables exist but alembic not initialized. Stamping to head...")
            import subprocess
            subprocess.run(["alembic", "stamp", "head"], check=True)
            print("Database stamped successfully.")
    else:
        print(f"Database file {db_path} does not exist yet. Migrations will create it.")
else:
    print("Non-SQLite database detected. Skipping pre-migration check.")
EOF

alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
