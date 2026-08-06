## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## Taskboard

A drag-and-drop task board lives at [`/taskboard`](http://localhost:3000/taskboard) (also linked from the home page). It demonstrates local React state management, TypeScript, native drag-and-drop, and performance-conscious component design.

### Running it

```bash
pnpm install
pnpm dev      # app served at http://localhost:3000/taskboard
pnpm test     # jest + react-testing-library unit tests
pnpm test:coverage
```

### Features

- **Board**: three columns (Todo / In Progress / Done), each task card shows title, description, priority, assignee (with initials avatar), tags, and created date.
- **Drag and drop**: implemented with the native HTML5 Drag and Drop API (no extra dependency) — drag a card between columns to change its status.
- **Create, edit, and delete tasks**: "New Task" opens a modal form (title/description/assignee required, priority/tags optional). Clicking any card opens the same form prefilled for editing; a "Delete" button (two-step confirm) removes the task. See "Advanced features" for how editing interacts with the real-time simulator.
- **Filtering**: search by title/description (debounced), filter by assignee, filter by priority. Filters compose together.
- **Dark mode**: a sun/moon icon (taskboard header and home page) toggles the whole app between light and dark. Defaults to the OS preference on first visit, then remembers the explicit choice.
- **Optimistic status updates with rollback**: dragging a card to a new column updates the UI immediately, fires a simulated API call, and either settles quietly or rolls back with an error toast — see "Advanced features" below.
- **Real-time simulation**: a simulated teammate edits a random task every 10-15s; changes toast in, and conflicts with whatever you're currently dragging are resolved deterministically instead of silently clobbering your edit.
- **Virtualized columns**: each column only mounts the cards currently in (or near) view, so a 1000+ task board scrolls smoothly. Click "Load 1000 tasks" in the header to see it live.

### Structure

- `app/lib/definitions.ts` — `Task`, `TaskStatus`, `TaskPriority`, `NewTaskInput` types.
- `app/lib/taskboard-utils.ts` — pure, unit-tested helpers: `filterTasks`, `groupTasksByStatus`, `getUniqueAssignees`, `createTaskFromInput`, `parseTagsInput`, `generateTasks` (deterministic bulk generator for the 1000-task demo).
- `app/lib/taskboard-reducer.ts` — pure `taskBoardReducer`: optimistic status updates, rollback, and external-change conflict resolution. No I/O, no timers — see "Advanced features" below.
- `app/lib/api/tasks-api.ts` — simulated `updateTaskStatus` (2s delay, 10% failure, both injectable for tests).
- `app/lib/api/realtime-simulator.ts` — `scheduleExternalChanges`, the "another user is editing" background loop.
- `app/lib/hooks/use-task-board.ts` — orchestrates the reducer + simulated API + simulator + toasts into the imperative surface `TaskBoard` consumes (`changeTaskStatus`, `createTask`, `loadTasks`, `startEditingTask`, `saveTaskEdits`, `cancelEditingTask`, `deleteTask`).
- `app/lib/hooks/use-toasts.ts`, `app/ui/toast/` — small self-contained toast queue and viewport.
- `app/ui/taskboard/` — `TaskBoard` (wires everything together, owns the create/edit modal state machine), `TaskColumn`, `TaskCard` (click to edit), `VirtualTaskList` (virtualized rendering), `FilterBar`, `TaskFormModal` (shared create/edit form with a two-step delete confirm), `PriorityBadge`.
- `app/ui/theme/` — `ThemeProvider`/`useTheme` (React context + `localStorage` persistence) and `ThemeToggle` (the icon button).
- `app/taskboard/page.tsx` — route that feeds `mockTasks` into `TaskBoard` as its initial state.
- `app/lib/__tests__/`, `app/lib/api/__tests__/`, `app/lib/hooks/__tests__/`, `app/ui/taskboard/__tests__/`, `app/ui/theme/__tests__/`, `app/ui/toast/__tests__/` — Jest + React Testing Library specs (145 tests, ~96% statement coverage).

### State management

Filters/modal-open/dragged-card-id stay as local `useState` in `TaskBoard` — there's no reason for anything heavier there. The task list itself, along with in-flight optimistic writes and deferred external changes, lives in `taskBoardReducer` (via `useTaskBoard`) instead of plain `useState`, because those three pieces of state change together under specific rules (see below) that are much easier to get right — and to unit test — as reducer transitions than as several `useState` calls updated ad hoc from different callbacks. Filtered/grouped task lists and the assignee list are memoized so unrelated columns don't recompute on every keystroke; `TaskCard` and `TaskColumn` are wrapped in `React.memo`, and each column virtualizes its own list, so dragging one card or 1000 tasks loading in doesn't re-render or mount cards elsewhere. Search input uses the project's existing `use-debounce` dependency to avoid re-filtering on every keystroke.

### Dark mode implementation notes

Tailwind's `darkMode: 'class'` strategy drives everything: a `dark` class on `<html>` flips every `dark:` variant in the app at once, so the toggle affects the whole app (not just the taskboard) from a single switch.

- **No flash of the wrong theme**: an inline, synchronous `<script>` in `app/layout.tsx`'s `<head>` reads `localStorage` (falling back to `window.matchMedia('(prefers-color-scheme: dark)')`) and sets the class on `<html>` *before* React hydrates. Without this, a dark-mode user would see a flash of the light theme on every load. `<html>` carries `suppressHydrationWarning` since React doesn't render that class itself and shouldn't warn about it.
- **Single source of truth**: `ThemeProvider` (`app/ui/theme/theme-provider.tsx`) initializes its React state by reading the class the inline script already applied, rather than re-deriving it from `localStorage`/`matchMedia` a second time. `toggleTheme` flips the class, updates state, and writes the choice back to `localStorage` (key `taskboard-theme`).
- **Hydration-safe icon**: `ThemeToggle` renders the moon icon until a `useEffect` confirms the component is mounted, then switches to the real icon for the resolved theme. This guarantees the very first client render matches what the server rendered (server can't know the theme), avoiding a hydration mismatch on the icon itself.
- Every taskboard component (and the button/card/modal styling) got `dark:` variants; the priority badges and tags were re-tuned for contrast on dark backgrounds rather than reusing the same light-mode colors at low opacity.

### Advanced features

**Optimistic updates with rollback.** Dragging a card calls `changeTaskStatus` (`app/lib/hooks/use-task-board.ts`), which dispatches `status-change-requested` — the reducer updates the task's status *and* records the previous value immediately, before any network call. `updateTaskStatus` (`app/lib/api/tasks-api.ts`) then simulates the request with a 2s `setTimeout` and a 10% random failure rate. On success, `status-change-succeeded` just clears the pending flag (the optimistic value already stuck). On failure, `status-change-failed` restores the recorded previous value and an error toast appears. While a task has a pending write, its card shows a small spinner and stops being draggable (`aria-busy`, `draggable={false}` in `TaskCard`) so a second drag can't race the first.

**Real-time simulation + reconciliation.** `scheduleExternalChanges` (`app/lib/api/realtime-simulator.ts`) recurses on a random 10-15s `setTimeout`, picks a random task and field (status/priority/assignee), and reports the change. `useTaskBoard` feeds these into the same reducer via `external-change-received` and toasts a description of what happened. The interesting case is "editing the same task" — which now covers *two* kinds of local activity, both represented as a `PendingUpdate` in `taskboard-reducer.ts`:

- **A drag-driven status write** (`{ kind: 'status-write', field: 'status', ... }`) only blocks external changes to that one field. An external priority bump while you're mid-drag on status isn't a real conflict, so it applies immediately.
- **An open edit session** (`{ kind: 'editing' }`, started when you click a card) blocks *every* field, since you could change any of title/description/assignee/priority/tags before saving. `wouldConflict()` checks the pending entry's `kind` to decide which rule applies — one function, shared by both the reducer's actual transition and the hook's toast copy, so they can't disagree about what counts as a conflict.

Either way, a conflicting change is handled the same way:

1. It's **deferred** (held in `state.deferredExternalChanges[taskId]`, not applied) and a toast explains a conflicting edit is waiting.
2. When your local action **succeeds** (status write confirms, or you click Save Changes), the deferred change is discarded — your explicit action wins — and a toast says so.
3. When your local action **doesn't stick** (status write fails and rolls back, or you cancel/close the edit modal without saving), the deferred change is applied on top instead. Another toast explains that too.

All of this is pure state-transition logic in `app/lib/taskboard-reducer.ts` (`edit-started`/`edit-saved`/`edit-cancelled`/`task-deleted` alongside the original status actions), deliberately kept free of timers/API calls so every branch is a direct, fast unit test rather than something exercised only through the UI.

**Performance at 1000+ tasks.** Click "Load 1000 tasks" in the header to swap in a generated dataset (`generateTasks` in `taskboard-utils.ts`, deterministic — no `Math.random`) and see it in practice. Two things make that scale acceptably:

- *Virtualization*: `VirtualTaskList` (`app/ui/taskboard/virtual-task-list.tsx`) uses `@tanstack/react-virtual` per column, so only the cards within (plus a small overscan around) the visible scroll area are ever mounted — verified in the browser: with 1000 tasks loaded, `document.querySelectorAll('[data-testid^="task-card-"]')` returns ~30 nodes, not 1000 (also asserted directly in `virtual-task-list.test.tsx`). `TaskCard` is a genuinely fixed height (`CARD_HEIGHT_PX`, exported so the row-height estimate is derived from it rather than a second hand-maintained number) rather than an approximate one — an earlier version used an *estimated* row height, and cards whose real content (a wrapping title, extra tags) exceeded that estimate would render on top of the next row. `line-clamp` alone doesn't prevent that: it caps *longer* content but doesn't pad *shorter* content up to the same height, so title/description also carry explicit `min-h-*` reservations, and the tags row always renders (even empty) so tag count doesn't change the card's height either.
- *Re-render scope*: see the comment block above the memoized values in `task-board.tsx` and the one above `TaskCard`'s `memo()` call for the full reasoning, confirmed with React DevTools Profiler (drag one card in a 1000-task board → only that card, its two columns, and TaskBoard itself re-render). In short: the reducer only replaces the one task object it touches, so every other task keeps its object identity; combined with `React.memo` on `TaskCard`/`TaskColumn` and `useCallback`'d handlers, unrelated cards bail out of rendering even when their parent's `tasks` array reference changes.

**A StrictMode bug worth calling out.** The first version of the edit/delete flow closed the modal from inside a `setState` *updater function* (`setModalState(current => { sideEffect(); return nextState; })`), because `TaskFormModal` called both `onSubmit()` and `onClose()` on a successful save and the updater needed to see its own prior result to avoid double-handling. That's not a safe place for a side effect: React (in `StrictMode`, which Next.js enables by default in development) intentionally invokes updater functions twice to catch exactly this, and it did — deleting a task showed two "Deleted" toasts in the actual dev server, even though every test passed, because `render()` from React Testing Library doesn't wrap in `StrictMode` by default. The fix was to stop calling `onClose()` after a successful submit in `TaskFormModal` (the caller closes the modal itself, which is the only thing that needed the updater form) and move the side-effecting calls into the event handler body. `app/ui/taskboard/__tests__/task-board.test.tsx` now has a dedicated `StrictMode`-wrapped regression test for this.

### Assumptions / notable decisions

- **New advanced-feature dependency**: added `@tanstack/react-virtual` for the virtualized lists — hand-rolling correct variable-viewport virtualization (scroll math, overscan, resize handling) isn't something to reimplement for this scope, and it's the de facto standard, lightweight (no other dependencies) choice for this.
- **Simulated API and real-time feed live client-side only**: there's no backend in this project, so both are `setTimeout`-based simulations as the task specified, with injectable delay/failure-rate/randomness so tests don't depend on real timers or real `Math.random()` (see `app/lib/hooks/__tests__/use-task-board.test.ts`).
- **Editing/deleting only lock the whole task, not individual fields**: an open edit session defers *any* incoming external change, even to a field the user isn't touching (e.g. a live priority bump while they're only editing the title). The alternative — deferring per-field — would need the form to diff against the original values on save and merge field-by-field, which is real added complexity for a case (two people editing different fields of the same task within the same ~10s window) that's rare enough not to warrant it here.
- **Delete confirmation is in-modal, not a separate dialog**: clicking "Delete" turns the button itself into "Confirm delete?" rather than opening a second confirmation modal — avoids modal-stacking for a single destructive action, and closing/cancelling the edit modal (Escape, backdrop, Cancel) already resets that confirmation state.

- **Data source**: the task said "located in `app/lib/placeholder-data.ts`" with a stub `mockTasks` array and a `// Add 20-30 more for testing...` comment. I filled it in to 28 tasks (up from 3) with varied statuses/priorities/assignees/tags so filtering and drag-and-drop have something real to demonstrate, and exported it (it wasn't exported before).
- **Drag-and-drop library**: used the native HTML5 API instead of adding `dnd-kit`/`react-beautiful-dnd`, since the assignment explicitly allows "any drag-and-drop library or native" and native keeps the dependency footprint down for a scoped local-state feature.
- **New task defaults**: newly created tasks always start in the Todo column with a client-generated `crypto.randomUUID()` id and `createdAt` timestamp, since the form doesn't collect either.
- **Assignee field**: a free-text input with a `<datalist>` of existing assignees (autocomplete-style) rather than a closed dropdown, so new assignees can be added without extending a fixed list — the spec didn't say assignees must come from a fixed set.
- **Pre-existing scaffold gaps unrelated to this feature**: this starter is mid-way through the Next.js Learn course. Two chapters hadn't been reached yet and made the app **unusable/un-buildable regardless of the taskboard work**: `app/ui/fonts.ts` was imported by seven files but never created (`next build` failed before any of my changes), and `app/ui/global.css` was never imported into `app/layout.tsx` (so Tailwind never loaded — confirmed visually in a browser, not just by reading code). I added a minimal `app/ui/fonts.ts` (Inter/Lusitana via `next/font/google`, matching the course's own convention) and the missing global.css import so `pnpm build` and `pnpm dev` work end-to-end. Neither change touches taskboard logic.

### Testing

145 tests across the pure helpers (filtering, the reducer, the generator), the simulated API and real-time simulator (fake timers + injected randomness, no real delays), the toast queue, the `useTaskBoard` orchestration hook (optimistic success/failure/rollback, and conflict deferral/resolution for both status-writes and edit sessions — `app/lib/hooks/__tests__/use-task-board.test.ts` is the most load-bearing file here), every taskboard component in isolation, a virtualization smoke test that asserts the DOM node count stays small at 1000 tasks, and a `TaskBoard` integration test covering filtering, task creation, click-to-edit/save/cancel, delete-with-confirmation, and the optimistic drag-and-drop success/rollback paths end-to-end — including a `StrictMode`-wrapped regression test for the double-invocation bug described above. Run `pnpm test:coverage` for the full report (~96% statements). Everything was also manually exercised in a real Chrome browser — drag-and-drop, dark mode, click-to-edit/save/delete, the real-time simulator's live toasts, and the 1000-task virtualization (confirmed via `document.querySelectorAll` that only ~30 card nodes exist in the DOM despite 1000 tasks loaded) — to confirm behavior beyond jsdom.

### What I'd add next given more time

- Persisting board state (localStorage or a real API route) — currently resets on refresh, which matches "local state" in the spec but is worth flagging.
- Keyboard-accessible drag-and-drop (e.g. move-to-column buttons) as an alternative to mouse-only HTML5 DnD.
- A visible connection/activity indicator for the real-time simulator (e.g. "3 teammates online") rather than only surfacing changes via toast.
- Per-field (rather than whole-task) conflict deferral while editing, if simultaneous multi-field edits from different sources turn out to matter in practice.
- Undo for delete (a brief "Deleted \"X\" · Undo" toast) rather than the current two-step confirm-only safety net.
