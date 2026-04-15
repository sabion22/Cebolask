# IMPLEMENTATION PLAN (Phase 1)

## 1) Task Model (already applied)
- `Task` now has `assigneeIds: string[]` as source of truth.
- `assigneeId` kept for backward compat with legacy docs.
- `normalizeTask()` ensures old docs remain usable.
- Notifications now carry metadata: `type`, `actorId`, `entityId`, `tags`, `readAt`.

## 2) Tasks Page Refactor (pending)
Goal: interactive system with filters and grouping; multi-assignee selector.

### Data logic
- Normalized assignees: `const assigneeIds = task.assigneeIds.length ? task.assigneeIds : [task.assigneeId]`.
- Filters:
  - Client (multi or single)
  - Assignees (multi)
  - Status (todo/doing/done)
  - Search (title/description)
- Grouping modes:
  - By client
  - By assignee
  - By status

### UI changes
- Replace single select with tag-style multi-select for assignees (chips with remove).
- Replace white checkbox (invalid) with status pill or inline dropdown.
- Completed tasks: move to a structured panel with filters and history display.
- Modal:
  - Wider (min 720px), responsive layout with 2-column sections
  - Title with wrap and max height
  - Handles long titles with line breaks

### Behavior
- On create/update: write `assigneeIds` and `assigneeId` (first assignee).
- On nudge: send notification to all assignees (except current user) with type `task_nudge`.

## 3) Dashboard Hub Refactor (pending)
Goal: central hub with KPIs + section summaries.

### KPIs to include
- Total tasks, % completed, tasks overdue
- Tasks by status (todo/doing/done)
- Tasks per client (top 5)
- Performance by team/assignee

### Filters
- Client, team/assignee, status, date range
- Filters affect KPI blocks and summary cards

### Visual
- Clear grid layout, cards with stacked values, and small charts/bars
- Make room for expansion as new sections are added

## 4) Critical Fixes (pending)
- `src/pages/Clients.tsx`: fix task delete bug calling `deleteClient` in tasks loop
- `src/pages/Office.tsx`: fix click area in top part of canvas + overlay overlap
- `src/components/NotificationsDropdown.tsx`: display type/time tags, readAt
- `src/pages/Tasks.tsx`: ensure notify click uses `notifyUser` with metadata

## 5) Validation
- `npm run build`
- Check Tasks, Dashboard, Calendar, Clients for regressions
