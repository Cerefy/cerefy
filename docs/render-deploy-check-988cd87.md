
## Root cause found in Render logs

The Logs tab displayed the release migration output. The decisive failure is:

```text
10:23:49 PM [f4br2] ERROR: relation "workflows" does not exist
```

The preceding lines show `ALTER TABLE` and `CREATE POLICY` operations from the RLS script. Therefore the new workflow tables were not present when `src/db/rls.sql` ran. This is a migration ordering/registration problem, not a Gemini readiness problem. The Render release is currently blocked by this error and the public service can return 502.
