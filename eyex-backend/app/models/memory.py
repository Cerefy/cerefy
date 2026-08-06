"""SQLAlchemy models for the πX Universal Enterprise Memory Engine."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Float, Integer, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class MemoryObject(Base):
    """A unit of organizational memory.

    Memory is intelligence, not just storage. Each object is scoped to an
    organization and carries permissions, confidence, and audit history.
    """

    __tablename__ = "memory_objects"

    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    owner_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    source: Mapped[str] = mapped_column(String(256), nullable=False)
    memory_type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    entities: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)
    relationships: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)
    tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    access_level: Mapped[str] = mapped_column(
        String(32), nullable=False, default="org"
    )
    permissions: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    embedding: Mapped[list[float] | None] = mapped_column(JSONB, nullable=True)
    chunk_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    audit_history = relationship("MemoryAudit", back_populates="memory", lazy="selectin")


class MemoryAudit(Base):
    """Audit trail entry for a memory object."""

    __tablename__ = "memory_audit"

    memory_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("memory_objects.id"), nullable=False, index=True
    )
    user_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    detail: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)


class MemoryPermission(Base):
    """Explicit permission grants for a memory object."""

    __tablename__ = "memory_permissions"

    memory_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("memory_objects.id"), nullable=False, index=True
    )
    user_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    role: Mapped[str | None] = mapped_column(String(64), nullable=True)
    permission: Mapped[str] = mapped_column(String(32), nullable=False)
    granted_by: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
