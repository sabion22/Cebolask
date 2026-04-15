# TASK STATUS (handoff)

## Scope
Implement Phase 1 (base critical) as previously planned:
1) Task model to multi-assignee (retrocompatible with assigneeId)
2) Refactor Tasks UI (filters/organization/interactive)
3) Refactor Dashboard into hub with KPIs and filters
4) Critical fixes (notifications, task modal, Clients bug, Office click bug)

## Current Progress
- DONE: Task model updated for multi-assignee and notifications enriched
  - `src/types.ts`
    - Added `assigneeIds: string[]` and `normalizeTask()`
    - Added notification type metadata fields
  - `src/store.tsx`
    - Normalizes tasks via `normalizeTask()` on read
    - `createTask` supports multi-assignee + notifications per assignee
    - `notifyUser` accepts metadata (type/actor/entity/tags)
    - `markNotificationRead` stores `readAt`

- IN PROGRESS: `src/pages/Tasks.tsx`
  - Plan: rewrite to multi-assignee selector, filters (client/assignee/status),
    grouping (by client / assignee / status), and better completed tasks history.
  - Modal needs to be larger, responsive, and handle long titles.
  - Remove current white checkbox logic and replace with interactive status controls.

## Next Actions (resume here)
1) Rewrite `src/pages/Tasks.tsx` completely.
2) Update `src/pages/Dashboard.tsx` to hub layout with KPIs and cross-module filters.
3) Fix critical bugs:
   - `src/pages/Clients.tsx` delete bug (currently calls deleteClient when deleting task)
   - `src/pages/Office.tsx` click area and overlay issue
   - Notif flow on task nudge uses `notifyUser` with metadata

## Validation
- After code changes: run `npm run build`
