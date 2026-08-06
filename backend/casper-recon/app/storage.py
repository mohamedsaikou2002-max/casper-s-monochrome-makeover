"""
Job + approval storage.

Ships with a plain SQLite backend so the service runs standalone with zero
external dependencies. CASPER already uses Supabase elsewhere — when you're
ready, swap the functions below for Supabase client calls (same signatures)
so job history lands in the same place as the rest of the platform's data.
"""
import sqlite3
import json
import threading
from datetime import datetime, timezone
from contextlib import contextmanager
from . import config
from .models import ApprovalRecord

_lock = threading.Lock()


def _init_db():
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                target TEXT,
                status TEXT,
                started_at TEXT,
                data TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS approvals (
                job_id TEXT,
                suggestion_id TEXT,
                approved_by TEXT,
                approved_at TEXT,
                notes TEXT,
                PRIMARY KEY (job_id, suggestion_id)
            )
        """)


@contextmanager
def _connect():
    conn = sqlite3.connect(config.JOBS_DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def save_job(job_id: str, target: str, status: str, data: dict):
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO jobs (job_id, target, status, started_at, data) "
            "VALUES (?, ?, ?, ?, ?)",
            (job_id, target, status, datetime.now(timezone.utc).isoformat(), json.dumps(data)),
        )


def get_job(job_id: str) -> dict | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if row is None:
            return None
        cols = [d[0] for d in conn.execute("SELECT * FROM jobs LIMIT 0").description]
        record = dict(zip(cols, row))
        record["data"] = json.loads(record["data"])
        return record


def get_suggestion(job_id: str, suggestion_id: str) -> dict | None:
    job = get_job(job_id)
    if not job:
        return None
    for s in job["data"].get("exploit_suggestions", []):
        if s["suggestion_id"] == suggestion_id:
            return s
    return None


def record_approval(job_id: str, suggestion_id: str, approved_by: str, notes: str | None) -> ApprovalRecord:
    now = datetime.now(timezone.utc)
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO approvals (job_id, suggestion_id, approved_by, approved_at, notes) "
            "VALUES (?, ?, ?, ?, ?)",
            (job_id, suggestion_id, approved_by, now.isoformat(), notes),
        )
    return ApprovalRecord(
        job_id=job_id, suggestion_id=suggestion_id,
        approved_by=approved_by, approved_at=now, notes=notes,
    )


def get_approval(job_id: str, suggestion_id: str) -> ApprovalRecord | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT job_id, suggestion_id, approved_by, approved_at, notes FROM approvals "
            "WHERE job_id = ? AND suggestion_id = ?",
            (job_id, suggestion_id),
        ).fetchone()
        if row is None:
            return None
        return ApprovalRecord(
            job_id=row[0], suggestion_id=row[1], approved_by=row[2],
            approved_at=datetime.fromisoformat(row[3]), notes=row[4],
        )


_init_db()
