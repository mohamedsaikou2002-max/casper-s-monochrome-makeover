"""
Nuclei-based vulnerability scanning.
Nuclei matches recon findings against thousands of community-maintained
CVE/misconfig templates — this is signature-based detection, not exploitation.
"""
import subprocess
import json
import logging
from . import config

logger = logging.getLogger("casper.vuln_scan")


def run_nuclei(target: str, tags: str | None = None, timeout: int = 180) -> list[dict]:
    """
    Runs nuclei against target, returns parsed JSON findings.
    tags: optional comma-separated nuclei tag filter, e.g. "cve,exposed-panel"
    """
    cmd = [config.NUCLEI_BIN, "-u", target, "-jsonl", "-silent"]
    if tags:
        cmd += ["-tags", tags]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except FileNotFoundError:
        return [{"error": "nuclei binary not found — install from projectdiscovery/nuclei"}]
    except subprocess.TimeoutExpired:
        return [{"error": f"nuclei timed out after {timeout}s"}]

    findings = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            findings.append(json.loads(line))
        except json.JSONDecodeError:
            logger.warning("Could not parse nuclei line: %s", line[:200])
    return findings


def summarize_findings(findings: list[dict]) -> list[dict]:
    """Trim nuclei's verbose output down to the fields that matter for triage."""
    summarized = []
    for f in findings:
        if "error" in f:
            summarized.append(f)
            continue
        info = f.get("info", {})
        summarized.append({
            "template_id": f.get("template-id"),
            "name": info.get("name"),
            "severity": info.get("severity"),
            "matched_at": f.get("matched-at"),
            "description": info.get("description"),
            "cve_ids": info.get("classification", {}).get("cve-id", []),
        })
    return summarized
