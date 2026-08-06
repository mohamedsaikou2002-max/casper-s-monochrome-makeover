"""
Central config. Pull from env vars in production — never hardcode keys.
"""
import os

# Ollama connection (local daemon or Ollama Cloud — same client either way)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Model split: fast orchestrator/structurer vs deep analyst
MODEL_ORCHESTRATOR = os.getenv("MODEL_ORCHESTRATOR", "qwen3-14b-abliterated")
MODEL_ANALYST = os.getenv("MODEL_ANALYST", "dolphin-mistral")

# Tool binaries — must be installed on the host / container running this API
WHATWEB_BIN = os.getenv("WHATWEB_BIN", "whatweb")
SUBFINDER_BIN = os.getenv("SUBFINDER_BIN", "subfinder")
NMAP_BIN = os.getenv("NMAP_BIN", "nmap")
NUCLEI_BIN = os.getenv("NUCLEI_BIN", "nuclei")

# Timeouts (seconds) per tool call
TOOL_TIMEOUT = int(os.getenv("TOOL_TIMEOUT", "120"))

# Storage for job records (swap for Postgres/Supabase in production —
# CASPER already uses Supabase, so wire JobStore in storage.py to that instead of memory)
JOBS_DB_PATH = os.getenv("JOBS_DB_PATH", "./jobs.sqlite3")

# Hard safety gate: no exploit is ever auto-executed by this service.
# Every entry in exploit_suggestions requires a POST to /approve before
# ANY execution helper in exploit_exec.py will run, and even then it only
# prints/logs the msfconsole command rather than firing it automatically.
REQUIRE_HUMAN_APPROVAL = True
