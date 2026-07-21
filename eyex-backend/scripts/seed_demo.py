"""Seed a local EyeX database with a demo user and workspace.

Run this after migrations are applied:
    cd eyex-backend
    python scripts/seed_demo.py
"""
from __future__ import annotations

import os
import sys

# Allow imports from the backend package
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.database import async_session_factory  # noqa: E402
from app.models.organization import Organization, OrganizationMember  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.workspace import Workspace, WorkspaceMember  # noqa: E402

DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@eyex.app")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "DemoPass123!")
DEMO_ORG_NAME = os.getenv("DEMO_ORG_NAME", "EyeX Demo Workspace")
DEMO_ORG_SLUG = os.getenv("DEMO_ORG_SLUG", "eyex-demo")


async def seed() -> None:
    async with async_session_factory() as session:  # type: ignore[var-annotated]
        user = await _ensure_demo_user(session)
        org = await _ensure_demo_org(session, user)
        await _ensure_demo_workspace(session, org, user)
        await session.commit()
        print(f"Demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print("Demo workspace ready.")


async def _ensure_demo_user(session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.email == DEMO_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        print(f"Demo user already exists: {DEMO_EMAIL}")
        return user

    user = User(
        email=DEMO_EMAIL,
        hashed_password=hash_password(DEMO_PASSWORD),
        full_name="Demo User",
        is_active=True,
        is_superuser=True,
    )
    session.add(user)
    await session.flush()
    print(f"Created demo user: {DEMO_EMAIL}")
    return user


async def _ensure_demo_org(session: AsyncSession, user: User) -> Organization:
    result = await session.execute(select(Organization).where(Organization.slug == DEMO_ORG_SLUG))
    org = result.scalar_one_or_none()
    if org is None:
        org = Organization(
            name=DEMO_ORG_NAME,
            slug=DEMO_ORG_SLUG,
            description="Local demo workspace for testing the EyeX platform.",
            owner_id=user.id,
            settings="{}",
        )
        session.add(org)
        await session.flush()
        print(f"Created demo organization: {DEMO_ORG_SLUG} (owner: {DEMO_EMAIL})")
    else:
        if org.owner_id != user.id:
            org.owner_id = user.id
            print(f"Updated demo organization owner to: {DEMO_EMAIL}")

    # Ensure the demo user is an owner member
    member_result = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == user.id,
        )
    )
    if member_result.scalar_one_or_none() is None:
        # Remove any stale owner membership for this org
        stale = await session.execute(
            select(OrganizationMember).where(OrganizationMember.organization_id == org.id)
        )
        for m in stale.scalars().all():
            await session.delete(m)
        session.add(
            OrganizationMember(
                organization_id=org.id,
                user_id=user.id,
                role="owner",
            )
        )
        print(f"Ensured demo user owns organization: {DEMO_ORG_SLUG}")

    return org


async def _ensure_demo_workspace(
    session: AsyncSession, org: Organization, user: User
) -> Workspace:
    result = await session.execute(
        select(Workspace).where(Workspace.slug == DEMO_ORG_SLUG)
    )
    workspace = result.scalar_one_or_none()
    if workspace is None:
        workspace = Workspace(
            organization_id=org.id,
            name=DEMO_ORG_NAME,
            slug=DEMO_ORG_SLUG,
            description="Default workspace for local demos and testing.",
            is_default=True,
            settings={},
        )
        session.add(workspace)
        await session.flush()
        print(f"Created demo workspace: {DEMO_ORG_SLUG}")
    else:
        if workspace.organization_id != org.id:
            workspace.organization_id = org.id
            print(f"Updated demo workspace organization to: {DEMO_ORG_SLUG}")

    # Ensure the demo user is an owner member of the workspace
    member_result = await session.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if member_result.scalar_one_or_none() is None:
        stale = await session.execute(
            select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace.id)
        )
        for m in stale.scalars().all():
            await session.delete(m)
        session.add(
            WorkspaceMember(
                workspace_id=workspace.id,
                user_id=user.id,
                role="owner",
            )
        )
        print(f"Ensured demo user owns workspace: {DEMO_ORG_SLUG}")

    return workspace


if __name__ == "__main__":
    import asyncio

    try:
        asyncio.run(seed())
    except Exception as exc:  # pragma: no cover - CLI helper
        print(f"Seeding failed: {exc}", file=sys.stderr)
        sys.exit(1)
