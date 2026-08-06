"""High-level service for the πX Universal Enterprise Memory Engine."""

from __future__ import annotations

from typing import Any

from app.memory.repository import InMemoryMemoryRepository, MemoryRepository
from app.models.memory import MemoryObject


class MemoryService:
    """Service layer for memory operations.

    Enforces organization scoping and audit logging.
    """

    def __init__(self, repository: MemoryRepository | None = None) -> None:
        self._repo = repository or InMemoryMemoryRepository()

    async def store_memory(
        self,
        organization_id: str,
        owner_id: str,
        source: str,
        memory_type: str,
        content: dict[str, Any],
        title: str | None = None,
        entities: list[dict[str, Any]] | None = None,
        relationships: list[dict[str, Any]] | None = None,
        tags: list[str] | None = None,
        confidence: float = 0.0,
        access_level: str = "org",
        permissions: dict[str, Any] | None = None,
        embedding: list[float] | None = None,
        chunk_ids: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> MemoryObject:
        obj = MemoryObject(
            organization_id=organization_id,
            owner_id=owner_id,
            source=source,
            memory_type=memory_type,
            title=title,
            content=content,
            entities=entities or [],
            relationships=relationships or [],
            tags=tags or [],
            confidence=confidence,
            access_level=access_level,
            permissions=permissions or {},
            embedding=embedding,
            chunk_ids=chunk_ids or [],
            metadata_=metadata or {},
        )
        created = await self._repo.create(obj)
        await self._repo.log_audit(
            str(created.id), "create", user_id=owner_id,
            detail={"memory_type": memory_type, "source": source},
        )
        return created

    async def retrieve_memory(
        self,
        organization_id: str,
        memory_id: str,
    ) -> MemoryObject | None:
        obj = await self._repo.get(memory_id, organization_id)
        if obj:
            await self._repo.log_audit(str(obj.id), "read", user_id=str(obj.owner_id))
        return obj

    async def search_memories(
        self,
        organization_id: str,
        query: str | None = None,
        memory_type: str | None = None,
        tags: list[str] | None = None,
        entity_ids: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MemoryObject]:
        return await self._repo.search(
            organization_id,
            query=query,
            memory_type=memory_type,
            tags=tags,
            entity_ids=entity_ids,
            limit=limit,
            offset=offset,
        )

    async def update_memory(
        self,
        organization_id: str,
        memory_id: str,
        content: dict[str, Any] | None = None,
        tags: list[str] | None = None,
        confidence: float | None = None,
        **extra: Any,
    ) -> MemoryObject | None:
        obj = await self._repo.get(memory_id, organization_id)
        if not obj:
            return None
        if content is not None:
            obj.content = content
        if tags is not None:
            obj.tags = tags
        if confidence is not None:
            obj.confidence = confidence
        obj.version += 1
        updated = await self._repo.update(obj)
        await self._repo.log_audit(str(obj.id), "update", user_id=str(obj.owner_id))
        return updated

    async def delete_memory(self, organization_id: str, memory_id: str) -> None:
        await self._repo.log_audit(memory_id, "delete", user_id=organization_id)
        await self._repo.delete(memory_id, organization_id)

    async def can_access(
        self,
        organization_id: str,
        memory_id: str,
        user_id: str,
        role: str = "member",
    ) -> bool:
        """Check if a user can access a memory object.

        Access levels:
        - public: anyone
        - org: same organization
        - restricted: owner or admin only
        - private: owner only
        """
        obj = await self._repo.get(memory_id, organization_id)
        if not obj:
            return False
        if obj.access_level == "public":
            return True
        if obj.access_level == "org":
            return True
        if obj.access_level == "restricted":
            return role == "admin" or str(obj.owner_id) == user_id
        if obj.access_level == "private":
            return str(obj.owner_id) == user_id
        return False
