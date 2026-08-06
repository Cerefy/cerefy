"""Repository for πX Universal Enterprise Memory Engine.

Defines the ``MemoryRepository`` interface and implementations:
- ``InMemoryMemoryRepository``: for tests and lightweight use.
- ``SqlAlchemyMemoryRepository``: for production with PostgreSQL.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Sequence

from app.models.memory import MemoryAudit, MemoryObject


class MemoryRepository(ABC):
    """Abstract repository for memory objects."""

    @abstractmethod
    async def create(self, obj: MemoryObject) -> MemoryObject:
        """Persist a new memory object."""

    @abstractmethod
    async def get(self, memory_id: str, organization_id: str) -> MemoryObject | None:
        """Fetch a memory object by id, scoped to organization."""

    @abstractmethod
    async def search(
        self,
        organization_id: str,
        query: str | None = None,
        memory_type: str | None = None,
        tags: list[str] | None = None,
        entity_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MemoryObject]:
        """Search memory objects within an organization."""

    @abstractmethod
    async def update(self, obj: MemoryObject) -> MemoryObject:
        """Update an existing memory object."""

    @abstractmethod
    async def delete(self, memory_id: str, organization_id: str) -> None:
        """Delete a memory object."""

    @abstractmethod
    async def log_audit(
        self,
        memory_id: str,
        action: str,
        user_id: str | None = None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        """Append an audit entry."""


class InMemoryMemoryRepository(MemoryRepository):
    """In-memory implementation for tests and lightweight use."""

    def __init__(self) -> None:
        self._store: dict[str, MemoryObject] = {}
        self._audit: list[MemoryAudit] = []

    async def create(self, obj: MemoryObject) -> MemoryObject:
        obj.id = uuid.uuid4() if not obj.id else obj.id
        now = datetime.now(timezone.utc)
        obj.created_at = now
        obj.updated_at = now
        self._store[str(obj.id)] = obj
        return obj

    async def get(self, memory_id: str, organization_id: str) -> MemoryObject | None:
        obj = self._store.get(memory_id)
        if obj and str(obj.organization_id) == organization_id:
            return obj
        return None

    async def search(
        self,
        organization_id: str,
        query: str | None = None,
        memory_type: str | None = None,
        tags: list[str] | None = None,
        entity_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MemoryObject]:
        results = [
            obj
            for obj in self._store.values()
            if str(obj.organization_id) == organization_id
        ]
        if memory_type:
            results = [o for o in results if o.memory_type == memory_type]
        if tags:
            results = [o for o in results if any(t in o.tags for t in tags)]
        if entity_ids:
            results = [
                o
                for o in results
                if any(e.get("id") in entity_ids for e in o.entities)
            ]
        if query:
            q = query.lower()
            results = [
                o
                for o in results
                if q in (o.title or "").lower()
                or q in str(o.content).lower()
            ]
        results.sort(key=lambda o: o.updated_at, reverse=True)
        return results[offset : offset + limit]

    async def update(self, obj: MemoryObject) -> MemoryObject:
        obj.updated_at = datetime.now(timezone.utc)
        self._store[str(obj.id)] = obj
        return obj

    async def delete(self, memory_id: str, organization_id: str) -> None:
        obj = self._store.get(memory_id)
        if obj and str(obj.organization_id) == organization_id:
            del self._store[memory_id]

    async def log_audit(
        self,
        memory_id: str,
        action: str,
        user_id: str | None = None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        audit = MemoryAudit(
            id=uuid.uuid4(),
            memory_id=memory_id,
            user_id=user_id,
            action=action,
            detail=detail or {},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._audit.append(audit)


class SqlAlchemyMemoryRepository(MemoryRepository):
    """Production repository backed by SQLAlchemy async session."""

    def __init__(self, session: Any) -> None:
        self._session = session

    async def create(self, obj: MemoryObject) -> MemoryObject:
        self._session.add(obj)
        await self._session.flush()
        return obj

    async def get(self, memory_id: str, organization_id: str) -> MemoryObject | None:
        from sqlalchemy import select

        result = await self._session.execute(
            select(MemoryObject).where(
                MemoryObject.id == memory_id,
                MemoryObject.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        organization_id: str,
        query: str | None = None,
        memory_type: str | None = None,
        tags: list[str] | None = None,
        entity_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MemoryObject]:
        from sqlalchemy import select
        from sqlalchemy.dialects.postgresql import ARRAY

        stmt = select(MemoryObject).where(
            MemoryObject.organization_id == organization_id
        )
        if memory_type:
            stmt = stmt.where(MemoryObject.memory_type == memory_type)
        if tags:
            for tag in tags:
                stmt = stmt.where(MemoryObject.tags.contains([tag]))
        if entity_ids:
            for eid in entity_ids:
                stmt = stmt.where(MemoryObject.entities.contains([{"id": eid}]))
        if query:
            q = query.lower()
            stmt = stmt.where(
                MemoryObject.title.ilike(f"%{q}%")
                | MemoryObject.content.cast(Text).ilike(f"%{q}%")
            )
        stmt = stmt.order_by(MemoryObject.updated_at.desc()).limit(limit).offset(offset)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, obj: MemoryObject) -> MemoryObject:
        await self._session.flush()
        return obj

    async def delete(self, memory_id: str, organization_id: str) -> None:
        from sqlalchemy import delete

        await self._session.execute(
            delete(MemoryObject).where(
                MemoryObject.id == memory_id,
                MemoryObject.organization_id == organization_id,
            )
        )

    async def log_audit(
        self,
        memory_id: str,
        action: str,
        user_id: str | None = None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        audit = MemoryAudit(
            memory_id=memory_id,
            user_id=user_id,
            action=action,
            detail=detail or {},
        )
        self._session.add(audit)
        await self._session.flush()
