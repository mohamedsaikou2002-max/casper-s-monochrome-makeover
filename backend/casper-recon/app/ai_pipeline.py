"""
Two-model AI layer.

MODEL_ORCHESTRATOR: fast model, turns messy tool stdout into structured JSON.
MODEL_ANALYST: larger model, writes the prioritized human-readable breakdown.

Uses Ollama's Python client — works identically against a local daemon or
Ollama Cloud models (just point OLLAMA_HOST / use a "-cloud" model tag).
"""
import json
import logging
import ollama
from . import config

logger = logging.getLogger("casper.ai_pipeline")

_client = ollama.Client(host=config.OLLAMA_HOST)


def structure_recon(raw: dict[str, str]) -> dict:
    """Model A: convert raw tool stdout into structured JSON findings."""
    prompt = f"""You are a recon data structuring assistant. Convert the following raw
security tool output into a single JSON object with these keys:
- "tech_stack": list of identified technologies/versions
- "open_ports": list of {{port, service, version}}
- "subdomains": list of discovered subdomains
- "notable_findings": list of short strings for anything unusual (exposed admin panels,
  odd headers, outdated software, etc.)

Return ONLY valid JSON, no commentary, no markdown fences.

RAW OUTPUT:
whatweb: {raw.get('whatweb', '')[:4000]}
subfinder: {raw.get('subfinder', '')[:2000]}
nmap: {raw.get('nmap', '')[:4000]}
"""
    response = _client.chat(
        model=config.MODEL_ORCHESTRATOR,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response["message"]["content"].strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Orchestrator returned non-JSON, wrapping raw text")
        return {"raw_text": text}


def analyze_findings(structured: dict, vuln_findings: list[dict]) -> str:
    """Model B: write the prioritized attack-surface breakdown for a human reader."""
    prompt = f"""You are a security analyst writing an attack-surface breakdown for a
penetration tester. Given the structured recon data and vulnerability scan results below,
produce a concise, prioritized report covering:
1. Attack surface summary (what's exposed)
2. Highest-priority findings first (tie to severity)
3. Suggested next recon/verification steps (not exploitation — verification)

STRUCTURED RECON:
{json.dumps(structured, indent=2)[:4000]}

VULN SCAN FINDINGS:
{json.dumps(vuln_findings, indent=2)[:4000]}
"""
    response = _client.chat(
        model=config.MODEL_ANALYST,
        messages=[{"role": "user", "content": prompt}],
    )
    return response["message"]["content"]
