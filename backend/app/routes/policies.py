from fastapi import APIRouter, HTTPException
from typing import List
from ..models.schemas import CompliancePolicy
from ..agents.compliance_agent import get_policies, get_policy_by_id

router = APIRouter(prefix="/policies", tags=["Compliance Policies"])

@router.get("", response_model=List[CompliancePolicy])
async def list_policies():
    """Retrieve all standard and custom legal compliance policy engines."""
    return get_policies()

@router.get("/{policy_id}", response_model=CompliancePolicy)
async def get_policy(policy_id: str):
    """Retrieve a single legal compliance policy profile and its rules."""
    policy = get_policy_by_id(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy
