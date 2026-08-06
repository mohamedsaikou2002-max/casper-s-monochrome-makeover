# CASPER Recon API

Two-model AI recon pipeline: raw tool output → structured findings → vuln match → prioritized
human-readable breakdown → ranked exploit *suggestions* (never auto-executed).

## Architecture

```
Lovable frontend
      │  POST /recon {target, scope_confirmed}
      ▼
FastAPI (app/main.py)
      │
      ├─► recon.py        whatweb + subfinder + nmap  (raw tool output)
      ├─► ai_pipeline.py   Model A: structures raw output into JSON
      ├─► vuln_scan.py     nuclei: matches findings against CVE templates
      ├─► ai_pipeline.py   Model B: writes prioritized attack-surface report
      ├─► exploit_suggest.py  searchsploit lookup, ranked by severity — SUGGESTIONS ONLY
      └─► storage.py       persists job + later approval records (SQLite by default)

      │  POST /approve {job_id, suggestion_id, approved_by}
      ▼
exploit_exec.py   returns MANUAL run instructions only, after checking an approval record exists.
                  This module never executes anything against a target.
```

## Why two models

- **Orchestrator** (small/fast — Qwen abliterated 14B by default): turns messy multi-tool stdout
  into structured JSON. Needs to be fast since it runs on every job.
- **Analyst** (larger — Dolphin-Mistral by default): writes the actual prioritized breakdown a
  human reads. Needs depth more than speed, so it's fine if this call is slower.

Swap either model in `app/config.py` — anything Ollama can run works, including `-cloud` tags if
you don't want to host the GPU yourself.

## Setup

1. Install host tooling (all standard, most ship with Kali):
   ```
   whatweb, subfinder, nmap, nuclei, searchsploit
   ```
2. Install Ollama and pull your two models:
   ```
   ollama pull qwen3-14b-abliterated
   ollama pull dolphin-mistral
   ```
3. Install Python deps:
   ```
   pip install -r requirements.txt
   ```
4. Run:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## Wiring into Lovable

Point Lovable's API calls at this service's base URL (e.g. `https://your-server:8000`).
Endpoints:

- `POST /recon` — body: `{"target": "example.com", "scope_confirmed": true, "fast_scan": true}`
- `GET /jobs/{job_id}` — pull a past job's full result
- `POST /approve` — body: `{"job_id": "...", "suggestion_id": "...", "approved_by": "your name"}`
- `GET /manual-instructions/{job_id}/{suggestion_id}` — 403s unless approved first

**Before deploying:** lock down `allow_origins` in `main.py` to your actual Lovable domain instead
of `"*"`, and put this behind auth (API key header at minimum) since it runs recon/scan tools on
arbitrary input — you don't want this endpoint open to the internet unauthenticated.

## Scope and authorization

`scope_confirmed` is a required field on every `/recon` call by design — it's a deliberate speed
bump, not a rubber stamp. Nothing here checks it against an actual authorization record yet;
if CASPER is going to be used across multiple client engagements, the next real upgrade is
wiring this to a Supabase table of signed scope-of-work records so the API can reject targets
that were never actually authorized, rather than trusting the caller's boolean.

## What this does NOT do

It does not execute exploits. `exploit_exec.py` is intentionally inert — it returns manual
instructions and exploit references after an approval record exists, and stops there. Wiring
real execution (e.g. via `msfrpc`) is a decision to make deliberately later, not a default.
