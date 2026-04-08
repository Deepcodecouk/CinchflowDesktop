# Transaction register migration plan

## Goal
Migrate the transaction register to the target architecture in `__specs__/refactor-transaction-register.md` without regressing running balances, inline editing usability, import flows, or rule workflows.

This plan assumes:
- the register remains monthly and account-scoped
- database schema remains unchanged unless a later phase makes a strong case
- inline editing must stay usable throughout the migration

## Success criteria
- the route becomes a thin shell over a register controller
- running-balance and filtering behavior are explicit and test-covered
- inline editing uses predictable save rules and focus continuity
- import, import history, auto-categorisation, and quick-rule flows are controller-managed side workflows
- the register becomes understandable from folder structure and feature contracts alone

## Guiding rules
- preserve balance correctness over UI convenience
- keep row editing pragmatic; do not introduce architecture ceremony
- use safe local patching for inline edits, authoritative reload for structural operations
- prefer incremental extraction over a full rewrite

## Phase 0: Freeze ledger behavior with tests and examples
### Objective
Protect the most fragile register behaviors before structural refactor begins.

### Scope
- encode the worked examples from the spec as tests where practical
- capture current display-order and balance semantics
- document any behavior intentionally deferred

### Deliverables
- tests for:
  - monthly opening balance usage
  - stable ordering for same-day transactions
  - running balances derived from the full ledger before filtering
  - filtered-row display without filtered-balance corruption
  - credit/debit normalization in new-row creation
  - manual override of rule-categorised transactions
  - focus continuity across inline saves

### Done when
- the highest-risk ledger rules are executable and reviewable

## Phase 1: Introduce explicit register feature contracts
### Objective
Make register data and workflow contracts typed end to end.

### Scope
- define shared register DTOs and mutation payloads
- create typed preload surface for register workflows
- stop relying on implicit data shapes in the route

### Deliverables
- `RegisterViewData`
- shared mutation request/response types
- typed preload methods for:
  - main view data
  - row updates
  - create/delete
  - import flows
  - auto-categorise flows
  - quick-rule flows

### Risks
- existing loose typing may hide inconsistent payload shapes

### Done when
- renderer and main share an explicit register contract

## Phase 2: Build backend register query/service layer
### Objective
Move register-specific read composition and rules out of the route.

### Scope
- introduce a register query/service responsible for:
  - loading account/month transactions
  - loading opening balance
  - returning categories needed for editing/filtering
  - shaping register view data explicitly
- keep transaction service and repositories focused on mutation and persistence

### Deliverables
- feature query service such as `register-query-service`
- one register view-data entry point such as `register.getViewData(accountId, year, month)`
- backend tests around ordering and view-data shaping

### Done when
- route no longer coordinates multiple low-level reads just to render the screen

## Phase 3: Extract pure builders for sorting, balances, and filtering
### Objective
Make ledger derivation readable and testable without UI noise.

### Scope
- implement pure functions for:
  - sort ordering
  - running balance calculation
  - closing balance calculation
  - filter application
  - summary derivation
  - visible row model creation

### Deliverables
- `sortRegisterTransactions(...)`
- `calculateRunningBalances(...)`
- `applyRegisterFilters(...)`
- `buildRegisterViewModel(...)`
- direct unit tests around full-ledger balance semantics

### Risks
- balance math and display order can diverge if builders are split carelessly

### Done when
- running-balance semantics are obvious from pure code
- filters cannot accidentally rewrite balance progression

## Phase 4: Introduce feature folder and thin route/controller split
### Objective
Make the register feature structure obvious from the codebase.

### Scope
- create `src/renderer/features/register` or agreed equivalent
- introduce:
  - route shell
  - `useRegisterController`
  - feature builder modules
  - feature components
- keep import paths stable with adapters if needed during migration

### Deliverables
- route shell that mostly reads URL params
- controller owning:
  - loading and refresh state
  - filter state
  - workflow state
  - mutation orchestration
  - focus/selection coordination

### Risks
- controller can become a new oversized route unless derivation and workflow helpers are already extracted

### Done when
- main register route is no longer the place where business logic is reconstructed

## Phase 5: Rebuild table rendering around a small row model
### Objective
Render the register from an explicit, compact model rather than route-local branching.

### Scope
- introduce:
  - `RegisterTable`
  - `RegisterHeader`
  - `RegisterRowRenderer`
  - `TransactionRow`
  - empty state row
  - `NewTransactionRow`
- keep `NewTransactionRow` outside authoritative `rows[]`

### Deliverables
- table rendering that reads from `rows[]`
- clear placement of summary and new-transaction surfaces
- removal of route-local row branching

### Risks
- the new transaction row can accidentally get entangled with sorted/filtered row rendering

### Done when
- row rendering is simple to trace from the view model alone

## Phase 6: Make inline editing predictable
### Objective
Separate row-local draft behavior from persistence orchestration without over-fragmenting the UI.

### Scope
- keep `TransactionRow` as the natural row boundary
- extract row-editing logic into a row-level hook or lightweight abstraction where it simplifies code
- define stable field order, save rules, cancel rules, and focus restoration
- ensure category picker behavior is explicit and reusable

### Deliverables
- row editing abstraction such as `useTransactionRowEditing(...)`
- explicit field navigation order
- save-in-flight behavior that does not remount the whole table
- local authoritative patching on successful inline save

### Risks
- over-separating the row into many tiny editors can replace one kind of complexity with another

### Done when
- `Tab`, blur-save, and sequential edits feel stable by design, not by accident

## Phase 7: Pull side workflows under controller ownership
### Objective
Treat import and categorisation workflows as first-class feature surfaces.

### Scope
- controller manages state for:
  - import wizard
  - import history
  - auto-categorise
  - quick rule create/edit
  - confirmations
- dialogs stay componentized and focused
- route stops owning incidental workflow state

### Deliverables
- explicit workflow open/close state
- typed workflow mutation helpers
- refresh rules after import, rollback, and auto-categorise apply

### Risks
- controller bloat if each workflow is not backed by small helper modules

### Done when
- workflow behavior can be followed without reading the route body

## Phase 8: Standardize mutation safety and failure behavior
### Objective
Make save behavior consistent across inline edits and structural operations.

### Scope
- standardize:
  - inline patch-on-success behavior
  - authoritative reload after create/delete/import/rollback/auto-categorise
  - visible error surfacing
  - predictable state restoration on failed save
- ensure manual category overrides update rule affordances consistently

### Deliverables
- shared register mutation helpers
- failure-handling rules used by all workflows
- tests for failed inline update, failed flag toggle, and failed structural operations

### Done when
- the register cannot remain in a saved-looking but unsaved state after failures

## Phase 9: Remove transitional code and simplify names
### Objective
Finish the migration cleanly rather than leaving dual paths in place.

### Scope
- remove temporary adapters and dead route logic
- collapse duplicate helper names and types
- align naming with the final feature structure

### Done when
- there is one obvious way to trace register data flow and mutation flow

## Testing strategy
- unit tests for sorting, balances, filtering, and summary derivation
- integration tests for:
  - inline editing and focus continuity
  - category reassignment and rule-affordance updates
  - new transaction creation
  - import rollback refresh
  - auto-categorisation apply
- regression coverage for running-balance correctness under filtering

## Rollout recommendation
- do not begin UI decomposition until pure balance/filter builders are in place
- treat inline editing stability as a release-blocking concern
- ship workflow extraction only after the core table/controller split is understandable

## Suggested commit slices
1. shared contracts + preload typing
2. backend register query service
3. pure sorting/balance/filter builders with tests
4. route/controller/folder reorganization
5. table rendering cleanup
6. row editing abstraction
7. workflow extraction
8. mutation safety + cleanup

## Resolved implementation decisions
### Account switching
Account switching should remain outside the register screen and stay route/navigation-owned.

The register controller should react to account, year, and month from route context, but should not own account switching as local feature UI state unless a later UX change makes that necessary.

This keeps:
- route scope separate from ledger state
- account changes as navigation events rather than controller mutations
- the controller focused on register concerns rather than app-level navigation

If account switching is later exposed in the toolbar, it should still dispatch navigation/route changes rather than mutate local controller state directly.

### Inline save failure behavior
Inline save failures should preserve edit mode when the failure is recoverable and the same row/field still makes sense to edit.

Preserve edit mode for:
- validation failures
- transient IPC or infrastructure failures
- save conflicts where retry is possible
- other recoverable failures where the draft can still be corrected meaningfully

Revert to selection state when the current editing context is no longer trustworthy, such as:
- the transaction no longer exists
- the row identity changed underneath the edit
- the account/month context changed
- a refresh invalidated the current editing target

Initial implementation rule:
- if the same field on the same row can still be edited safely, keep the draft and error visible in edit mode
- if the row or context is no longer valid, restore authoritative state and fall back to selection state

### Quick-rule editing contract
Quick-rule editing should have a dedicated register-facing workflow contract, while still reusing shared rule-domain types where sensible.

Do not couple the register directly to the full rules feature contract if the register only needs a narrower workflow surface.

Recommended direction:
- shared rule-domain DTOs may remain shared
- register uses its own typed workflow contract for:
  - creating a rule seeded from a transaction
  - opening/editing the rule associated with a transaction
  - returning enough result metadata to refresh rule-affordance state in the register

This keeps the register workflow explicit and avoids importing unnecessary broader rules-feature complexity into the ledger feature.
