from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Signature
from app.dependencies import require_role
from app.schemas.signature import SignatureCreate
from app.services.qiskit_service import run_signature_protocol


router = APIRouter(
    prefix="/signatures",
    tags=["Signatures"]
)


@router.post("")
def create_signature(
    signature_data: SignatureCreate,
    current_user: dict = Depends(
        require_role("signer")
    ),
    db: Session = Depends(get_db)
):
    signer_user_id = int(current_user["sub"])

    last_sequence = (
        db.query(func.max(Signature.sequence_no))
        .filter(
            Signature.signer_user_id == signer_user_id
        )
        .scalar()
    )

    next_sequence = (
        last_sequence + 1
        if last_sequence is not None
        else 1
    )

    protocol_result = run_signature_protocol(
    signature_data.message
)

    signature = Signature(
    signer_user_id=signer_user_id,
    sequence_no=next_sequence,
    message_digest=protocol_result["message_digest"],
    basis_schedule=protocol_result["basis_schedule"],
    expected_bits=protocol_result["expected_bits"]
)

    db.add(signature)
    db.commit()
    db.refresh(signature)

    return {
        "message": "Signature created successfully",
        "signature": {
            "id": signature.id,
            "signer_user_id": signature.signer_user_id,
            "sequence_no": signature.sequence_no,
            "message_digest": signature.message_digest,
            "basis_schedule": signature.basis_schedule,
            "expected_bits": signature.expected_bits
        }
    }