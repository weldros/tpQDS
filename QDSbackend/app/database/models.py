from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(50),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        nullable=False
    )

    token_id = Column(
        String(255),
        unique=True,
        nullable=False
    )

    issued_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    revoked_at = Column(
        DateTime(timezone=True),
        nullable=True
    )
    
class Signature(Base):
    __tablename__ = "signatures"

    id = Column(Integer, primary_key=True, index=True)

    signer_user_id = Column(
    Integer,
    nullable=False
)

    sequence_no = Column(
        Integer,
        nullable=False
    )

    message_digest = Column(
        String(255),
        nullable=False
    )

    basis_schedule = Column(
        String(1000),
        nullable=False
    )

    expected_bits = Column(
        String(1000),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )