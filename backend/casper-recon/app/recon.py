"""
Wraps standard recon tooling as subprocess calls.
Each function returns raw stdout — parsing/structuring happens in the AI layer (ai_pipeline.py).

Requires these binaries installed on the host:
  - whatweb      (tech fingerprinting)
  - subfinder    (subdomain enumeration)
  - nmap         (port/service scan)
"""
import subprocess
import shlex
import logging
from . import config

logger = logging.getLogger("casper.recon")


def _run(cmd: list[str], timeout: int = config.TOOL_TIMEOUT) -> str:
    """Run a subprocess command safely, always returning text (never raising on nonzero exit)."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            logger.warning("Command %s exited %s: %s", cmd[0], result.returncode, result.stderr[:500])
        return result.stdout or result.stderr or ""
    except FileNotFoundError:
        return f"[error] binary not found: {cmd[0]} — is it installed and on PATH?"
    except subprocess.TimeoutExpired:
        return f"[error] {cmd[0]} timed out after {timeout}s"


def fingerprint_tech(target: str) -> str:
    return _run([config.WHATWEB_BIN, "-a", "3", target])


def enumerate_subdomains(target: str) -> str:
    return _run([config.SUBFINDER_BIN, "-d", target, "-silent"])


def scan_ports(target: str, fast: bool = True) -> str:
    flags = ["-F"] if fast else ["-p-"]
    # -sV: version detection, -T4: faster timing template
    return _run([config.NMAP_BIN, *flags, "-sV", "-T4", target], timeout=300 if not fast else config.TOOL_TIMEOUT)


def full_recon(target: str, fast_scan: bool = True) -> dict[str, str]:
    """Runs the standard recon suite and returns raw output keyed by tool name."""
    return {
        "whatweb": fingerprint_tech(target),
        "subfinder": enumerate_subdomains(target),
        "nmap": scan_ports(target, fast=fast_scan),
    }
