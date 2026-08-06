"""
CASPER Recon API

POST /recon    -> runs full recon + vuln scan + two-model AI analysis, returns job_id + report
GET  /jobs/{id} -> fetch a past job's full result
POST /approve  -> human signs off on a specific exploit suggestion (required before /manual-instructions)
GET  /manual-instructions/{job_id}/{suggestion_id} -> returns manual run info for an APPROVED suggestion only

Run:
    uvicorn app.main:app --host 0.0.0.0 --port 8000

Point your Lovable frontend at this base URL. CORS is wide open below for
development — lock allow_origins down to your actual Lovable domain before
this touches anything real.
"""
import uuid
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import ReconRequest, ApprovalRequest, ScanStatus
from . import recon, vuln_scan, ai_pipeline, exploit_suggest, exploit_exec, storage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("casper.main")

app = FastAPI(title="CASPER Recon API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict to your Lovable app's domain before going live
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/recon")
def run_recon(req: ReconRequest):
    if not req.scope_confirmed:
        raise HTTPException(
            status_code=400,
            detail="scope_confirmed must be true — confirm target is authorized before scanning.",
        )

    job_id = str(uuid.uuid4())
    logger.info("Starting recon job %s for target=%s", job_id, req.target)

    # 1. Raw recon
    raw = recon.full_recon(req.target, fast_scan=req.fast_scan)

    # 2. Model A: structure it
    structured = ai_pipeline.structure_recon(raw)

    # 3. Vuln scan (nuclei) against tech findings
    nuclei_raw = vuln_scan.run_nuclei(req.target)
    vuln_findings = vuln_scan.summarize_findings(nuclei_raw)

    # 4. Model B: human-readable prioritized breakdown
    analysis = ai_pipeline.analyze_findings(structured, vuln_findings)

    # 5. Exploit suggestions (lookup only, never executed)
    suggestions = exploit_suggest.build_suggestions(vuln_findings)

    result_data = {
        "raw": raw,
        "structured": structured,
        "vuln_matches": vuln_findings,
        "analysis": analysis,
        "exploit_suggestions": suggestions,
    }

    storage.save_job(job_id, req.target, ScanStatus.COMPLETE.value, result_data)

    return {
        "job_id": job_id,
        "target": req.target,
        "status": ScanStatus.COMPLETE.value,
        "started_at": datetime.now(timezone.utc).isoformat(),
        **result_data,
    }


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = storage.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return job


@app.post("/approve")
def approve_suggestion(req: ApprovalRequest):
    suggestion = storage.get_suggestion(req.job_id, req.suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="suggestion not found on this job")

    record = storage.record_approval(req.job_id, req.suggestion_id, req.approved_by, req.notes)
    logger.info(
        "Suggestion %s on job %s approved by %s",
        req.suggestion_id, req.job_id, req.approved_by,
    )
    return record


@app.get("/manual-instructions/{job_id}/{suggestion_id}")
def manual_instructions(job_id: str, suggestion_id: str):
    try:
        return exploit_exec.get_manual_run_instructions(job_id, suggestion_id)
    except exploit_exec.NotApprovedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
