# Security Specification & Payload Verification

## Data Invariants
1. Users must be authenticated to access or modify data.
2. User profile records (`/users/{userId}`) can only be created or modified if `request.auth.uid == userId`.
3. System collections (`/agents`, `/logs`, `/memories`) require authenticated users to perform reads or writes.

## Dirty Dozen Security Payloads
1. Unauthenticated write attempt to `/users/user123` -> PERMISSION_DENIED
2. Authenticated user setting arbitrary `role: SUPER_ADMIN` in user profile without authorization -> PERMISSION_DENIED
3. User attempting to read another user's private data -> PERMISSION_DENIED
4. Attempting to inject non-string document ID (> 128 chars or special chars) -> PERMISSION_DENIED
5. Attempting to create agent without required `tenantId` -> PERMISSION_DENIED
6. Spoofing `createdAt` timestamp using client clock instead of `request.time` -> PERMISSION_DENIED
7. Unauthenticated list query on `/agents` -> PERMISSION_DENIED
8. Attempting to set empty `content` in `/memories` -> PERMISSION_DENIED
9. Modifying immutable `uid` in user profile on update -> PERMISSION_DENIED
10. Anonymous user write attempt when email verification is enforced -> PERMISSION_DENIED
11. Ghost field injection on `/users/{userId}` update -> PERMISSION_DENIED
12. Denial of wallet attack via 1MB string payload in `name` field -> PERMISSION_DENIED
