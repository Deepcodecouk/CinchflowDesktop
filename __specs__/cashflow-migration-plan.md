# Cashflow migration plan

## Goal
Migrate cashflow from its current partially improved state to the target architecture described in `__specs__/refactor-cashflow.md` without breaking core financial behavior, keyboard editing, or month-to-month projection logic.

This plan assumes:
- database schema remains unchanged unless a later phase exposes a clear simplification win
- feature behavior should remain stable while internal ownership becomes clearer
- each phase should leave the feature in a shippable state

## Success criteria
- the route becomes a thin shell over a dedicated feature controller
- cashflow data loading is feature-specific and typed end to end
- month and row derivation live in pure builders with focused tests
- the table renders from an explicit row model rather than incidental JSX branching
- budget editing, comments, links, and drilldown continue to work with clearer ownership
- future work can be done without reopening large cross-cutting files

## Guiding rules
- prefer additive migration over one-shot rewrite
- preserve user-visible behavior until explicit product changes are agreed
- separate authoritative data from UI state from derived table state
- keep the feature shippable after every phase
- do not move files and rewrite logic in the same step unless the logic is already trivial

## Phase 0: Lock down behavior before refactor
### Objective
Create enough test and example coverage that the refactor does not silently change financial behavior.

### Scope
- add worked examples from the spec as executable tests where practical
- document current behavior that is intentionally preserved
- capture any known mismatches between current behavior and desired behavior

### Deliverables
- pure test fixtures for:
  - opening balance
  - actual display sign inversion
  - hybrid selection
  - carry-forward behavior
  - available funds progression
  - linked-category display metadata
  - uncategorised variable-expense behavior
- a short list of behavior changes that are deferred rather than accidentally introduced

### Notes
- this phase can begin before any structural code move
- if current code is too tangled for good unit coverage, start by extracting the smallest pure helpers needed for tests

### Done when
- core financial calculations have focused tests
- at least the worked examples with the highest regression risk are encoded

## Phase 1: Introduce typed feature contracts
### Objective
Make cashflow a first-class feature contract across `shared`, `main`, `preload`, and `renderer`.

### Scope
- define shared DTOs for table data, comments, links, and carry-forward mode
- introduce typed IPC request/response shapes
- keep the current renderer behavior, but stop relying on broad generic contracts

### Deliverables
- `shared` cashflow contract types
- feature-specific preload surface for cashflow
- thin IPC handlers forwarding to feature-oriented services

### Risks
- broad type changes can ripple through existing calls
- preload typing may reveal existing implicit or inconsistent behavior

### Done when
- cashflow has an explicit typed contract from renderer to main
- renderer no longer needs to guess cashflow-specific payload shapes

## Phase 2: Build backend cashflow query/service layer
### Objective
Move cashflow-specific read composition out of the renderer and into a dedicated backend layer.

### Scope
- add a `cashflow` query/service layer responsible for:
  - opening balance calculation
  - actual aggregation by category/month
  - budget aggregation by category/month
  - category hierarchy loading
  - comment loading
  - relevant linked-category loading
- keep repositories persistence-focused

### Deliverables
- feature query service such as `cashflow-query-service`
- one table-data read entry point such as `cashflow.getTableData(accountId, year)`
- focused backend tests for opening balance and aggregation rules

### Risks
- opening balance rules for future years are easy to get subtly wrong
- moving aggregation into the backend can surface inconsistencies in current renderer assumptions

### Done when
- renderer can request one authoritative table-data payload
- opening balance logic is no longer reconstructed in renderer code

## Phase 3: Create pure builders for months and rows
### Objective
Replace ad hoc render-time branching with pure, typed derived-model builders.

### Scope
- create pure functions for:
  - month metadata derivation
  - opening/closing balance projection
  - section/header/category/summary row derivation
  - comparison colour metadata
  - editable-cell metadata
  - link and comment display metadata
- keep builders renderer-only and persistence-free

### Deliverables
- `buildCashflowMonthMeta(...)`
- `buildCashflowTableModel(...)`
- small helper modules for sign normalization, comparison logic, and carry-forward
- direct unit tests for builders

### Risks
- builder scope can become too large if every formatting detail is pushed into it
- duplicate logic may appear temporarily while old rendering still exists

### Done when
- row ordering is explicit and typed
- the derived table model can be inspected without reading JSX

## Phase 4: Introduce feature folder and thin route shell
### Objective
Move cashflow toward the target folder and ownership structure without changing core behavior.

### Scope
- create `src/renderer/features/cashflow`
- introduce:
  - route shell
  - `useCashflowController`
  - pure builder modules
  - feature-scoped components
- keep compatibility wrappers if needed while old imports are retired gradually

### Deliverables
- route file that mostly reads URL params and renders feature entry
- controller owning:
  - data loading
  - UI state
  - mutation orchestration
  - keyboard integration
  - dialog/menu state

### Risks
- moving files too early can make diffs noisy and harder to review
- the controller can become another god object if pure builder work is not already separated

### Done when
- route logic is thin
- feature ownership is visible from folder structure

## Phase 5: Convert table rendering to row-model-driven rendering
### Objective
Make the table read like a simple rendering of an explicit model.

### Scope
- replace branch-heavy section rendering with:
  - `CashflowTable`
  - `CashflowTableHeader`
  - `CashflowRowRenderer`
  - row-kind-specific row components
- keep row renderer dumb: switch on row kind, render the right component

### Deliverables
- row-kind renderer
- explicit row components for opening balance, banner, header, category, total, available funds, summary
- removal of hidden component-like `renderX()` helpers

### Risks
- alignment behavior can regress if aggregate rows stop reserving editable-cell spacing
- collapse behavior can get split incorrectly between builder and row component

### Done when
- row rendering can be followed from the row model alone
- section structure is explicit without reading large orchestration files

## Phase 6: Narrow cell responsibilities
### Objective
Keep cell behavior purpose-specific instead of reintroducing a universal god cell.

### Scope
- implement or refine:
  - `BudgetCell`
  - `ActualCell`
  - `HybridCell`
  - `AggregateValueCell`
- move edit-input construction into the budget-edit cell boundary
- preserve shared spacing/layout primitives where they genuinely reduce duplication

### Deliverables
- focused cell components with narrow prop contracts
- stable alignment rules for totals and derived rows
- explicit comment, context-menu, and drilldown affordances at the correct cell boundary

### Risks
- duplication can creep in if shared layout pieces are not factored carefully
- keyboard logic can become split between controller and cell components

### Done when
- no parent component is building a child-specific editor element
- cell contracts match behavior rather than generic data blobs

## Phase 7: Make side workflows first-class
### Objective
Treat comments, links, drilldown, and rename flows as explicit feature workflows rather than incidental branching.

### Scope
- ensure comments are loaded and updated through the feature data contract
- ensure linked categories provide explicit display metadata and mutation hooks
- keep links-management dialog separate, but driven from controller state
- keep drilldown state and comment dialog state controller-owned

### Deliverables
- explicit controller-managed state for dialogs and menus
- clear mutation pathways for comments and link-aware budget changes
- removal of ad hoc row-level discovery for links/comments

### Risks
- comments and links can regress if treated as purely decorative rather than behavioral
- side workflows can bloat the controller if not backed by small helper modules

### Done when
- comments and links are visible in the model, not discovered ad hoc during render
- controller-owned workflow state is easy to trace

## Phase 8: Harden saves, refreshes, and failure behavior
### Objective
Make mutation behavior predictable and safe.

### Scope
- define where safe patching is acceptable versus where a reload is required
- standardize error surface for failed budget saves, comments, rename operations, and fill-right actions
- ensure active edits behave consistently during year/account change and collapse

### Deliverables
- shared cashflow mutation helpers
- visible error handling rules
- tests for failed save and mutation edge cases

### Done when
- failed saves cannot leave stale display values on screen as if they persisted
- navigation and editing rules are stable under error conditions

## Phase 9: Cleanup and remove transitional code
### Objective
Retire compatibility layers and dead logic after the new feature path is stable.

### Scope
- remove obsolete helpers, route logic, and transitional adapters
- collapse duplicated types
- simplify imports and naming

### Done when
- there is one obvious path through the feature
- old cashflow-only branching code is gone

## Testing strategy
- unit tests for pure builders and financial rules
- focused integration tests for:
  - editable budget cells
  - comment indicators and comment saves
  - carry-forward switching
  - collapsed/expanded section rendering
  - linked-category affordances
- regression tests for alignment-sensitive aggregate rows

## Rollout recommendation
- land phases 1 to 3 before any major visual rewrite
- ship phases 4 to 6 behind normal review, but keep behavior unchanged
- treat phase 7 and phase 8 as safety phases, not optional polish

## Suggested commit slices
1. shared contracts + preload typing
2. backend cashflow query service
3. pure builder extraction with tests
4. route/controller/folder reorganization
5. row-model-driven table rendering
6. focused cell split
7. comments/links workflow cleanup
8. mutation safety + final cleanup

## Resolved implementation decisions
### `cashflow.getTableData(...)`
The target API should be one aggregated feature query.

Migration does not need to reach that in one step.
The recommended approach is:
- define the final `CashflowTableData` contract first
- introduce a backend adapter/composer that can assemble that contract from existing lower-level reads
- point the renderer only at the composed feature contract
- later replace the adapter internals with a dedicated `cashflow-query-service` without changing renderer code

This keeps the renderer contract stable while allowing the backend refactor to land incrementally.

### Patch vs reload rules
Only patch authoritative local state when the mutation is isolated, bounded, and cannot change row structure or cross-account behavior.

Safe local patch candidates:
- single-cell budget save
- comment create/update/delete
- UI-only state such as collapse, selection, carry-forward mode, and historic-budget visibility

Prefer authoritative reload:
- fill-right operations
- category rename
- bulk month operations
- account/year changes
- any mutation that can change hierarchy shape, row membership, totals provenance, or cross-account state
- any link-aware mutation whose downstream effects are not fully returned in the mutation response

Initial implementation bias should favor correctness over clever patching.
If there is any doubt that a mutation can be patched safely, reload.

### Linked-category validation
Linked-category rules should be enforced in the backend, not inferred in the renderer.

Backend responsibilities:
- validate whether a category is linkable
- validate link targets
- decide whether a mutation propagates, mirrors, blocks, or requires special handling
- enforce link-aware rules for fill-right, rename, and other budget-affecting mutations

Renderer responsibilities:
- display link indicators and tooltip/help text
- expose link-management entry points
- call typed mutations
- react to typed mutation outcomes

This avoids drifting back to renderer-owned domain assumptions and keeps linked-category behavior authoritative and testable.
