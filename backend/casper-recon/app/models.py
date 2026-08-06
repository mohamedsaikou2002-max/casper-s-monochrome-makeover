"""
Pydantic schemas shared across the API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class ScanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"
    AWAITING_APPROVAL = "awaiting_approval"


class ReconRequest(BaseModel):
    target: str = Field(..., description="Domain or IP to recon, e.g. example.com")
    scope_confirmed: bool = Field(
        ...,
        description="Caller must explicitly confirm this target is in-scope / authorized.",
    )
    fast_scan: bool = Field(True, description="Use -F (fast) nmap scan instead of full port range")


class ReconResult(BaseModel):
    job_id: str
    target: str
    status: ScanStatus
    started_at: datetime
    raw: Optional[Dict[str, str]] = None
    structured: Optional[Dict[str, Any]] = None
    analysis: Optional[str] = None
    vuln_matches: Optional[List[Dict[str, Any]]] = None
    exploit_suggestions: Optional[List[Dict[str, Any]]] = None


class ApprovalRequest(BaseModel):
    job_id: str
    suggestion_id: str
    approved_by: str = Field(..., description="Name/id of the human approving this action")
    notes: Optional[str] = None


class ApprovalRecord(BaseModel):
    job_id: str
    suggestion_id: str
    approved_by: str
    approved_at: datetime
    notes: Optional[str] = None
