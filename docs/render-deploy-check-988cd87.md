
## Timestamp-order repair deployment

Render service events now show:

```text
Deploying next b9fe382: fix: order workflow migration after existing journal entries
```

The prior commit `1231c31` is marked `live`, but its migration log still showed the missing-table error because `0008` had a `when` value older than the last applied migration. The new commit uses `when: 1795694400008`, greater than `0007`'s timestamp, and is currently deploying.

## Successful live workflow verification

After the timestamp-order repair deployed, the public endpoints returned:

```text
GET /health/live  -> HTTP 200
GET /health/ready -> HTTP 200, status=healthy
```

The authenticated end-to-end workflow smoke test also passed against Render:

```text
registrationStatus=200
workflowCreateStatus=201
workflowPublishStatus=200
workflowRunStatus=202
finalWorkflowStatus=SUCCEEDED
completedStepTypes=[AI_ANALYSIS, APPROVAL, CREATE_DECISION, NOTIFY]
approvalStatus=APPROVED
runId=cff08fcb-eb64-40be-a2a8-57d62ec11491
workflowId=ff974a2f-ba9d-4e2f-91b9-457dacfa45b8
```

This confirms live creation, publication, asynchronous execution, Gemini-backed analysis, a persisted approval gate, post-approval resume, decision creation, and non-fabricated notification state.
