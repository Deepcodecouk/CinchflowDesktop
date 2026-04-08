# Transaction register simplification

## Goal
The transaction register needs to become understandable, maintainable, and safe to evolve without requiring a reader to trace logic across one oversized route and a set of tightly coupled row/dialog components.

The current problems are:
- the route owns too many responsibilities at once
- transaction loading, running balance calculation, filtering, optimistic mutation, import flow, and rule flow are mixed together
- mutation failure handling is weak and inconsistent
- row editing is spread across route state, row-local state, and backend assumptions
- side workflows such as import, auto-categorisation, and rule creation are part of the same feature surface but are not modeled cleanly as such

The goal of this refactor is to simplify the feature from back end to front end with clearer responsibilities, stronger contracts, safer mutation handling, and a renderer structure that reflects the register domain rather than incidental implementation details.

The database schema should remain unchanged unless a schema change clearly improves the architecture and meaningfully reduces complexity.

## What the transaction register does
The transaction register is the monthly transaction ledger for a single account.

For a selected account, year, and month, it:
- loads the transactions for that month
- loads the opening balance for that month
- calculates a running balance for each transaction row
- renders transactions in reverse chronological order
- allows inline editing of transaction fields
- allows adding a new transaction
- allows transaction deletion
- allows flagging/unflagging transactions
- allows assigning and reassigning categories
- allows editing transaction notes
- supports filtering by description/note, category, and flag state
- supports import workflows
- supports auto-categorisation workflows
- supports creating or editing categorisation rules from a transaction
- supports import rollback via import history

## Coding rules
- Group everything directly related to the transaction register in a feature folder.
- Preferred renderer location: `src/renderer/features/register` or `src/renderer/features/transactions/register`.
- Shared contracts for register queries and mutations should live in feature-specific shared modules.
- The route should remain thin and should not directly own calculation, mutation coordination, filtering logic, and dialog orchestration all at once.
- Do not rely on large optimistic local state updates without explicit failure behavior.

## Key domain rules

### Register scope
The register view is monthly.
For a selected account/year/month, it shows only that month's transactions plus:
- the opening balance at the start of that month
- the derived closing balance at the end of that month
- running balances after each transaction in display order

### Transaction sign rules
Transactions are stored as account deltas.
- credit to account = positive
- debit from account = negative

The register displays them as:
- credit column shows positive values only
- debit column shows absolute value of negative values only
- balance uses the signed running total

### Category behavior
A transaction may be categorised or uncategorised.
A transaction may also reference a categorisation rule via `categorised_by_rule_id`.
Manual category reassignment should be treated as overriding prior auto-categorisation where appropriate.

### Register ordering
Transactions should have one explicit display ordering rule and that rule should be named in the spec and implementation.
Current behavior appears to be:
- sort by date descending
- then by created_at descending

That ordering rule should remain explicit and centralized.

## Target architecture

### Backend
The register should have a transaction-register-specific query/service layer in the main process.

Target responsibilities:
- register query/service
  - load transactions for account/year/month
  - load opening balance for account/year/month
  - return data already shaped for register use where appropriate
  - coordinate register-specific read models if necessary
- transaction service
  - create/update/delete/toggle flag/update note
  - enforce domain rules consistently
- repositories
  - persistence only
- IPC handlers
  - thin wrappers over typed service/query calls
- preload
  - strongly typed register feature contract

### Renderer
Renderer register should be separated into 4 layers:
- route shell
- controller / screen-state hook
- pure builders for filtered rows and running-balance view models
- components

## State model
The register should be composed from 3 distinct layers.

### 1. Loaded data model
This is authoritative feature data loaded from IPC.

Suggested shape:
- `account`
- `year`
- `month`
- `openingBalance`
- `transactions`
- `categories`

This is the source of truth for the register screen.

### 2. UI state model
This is renderer-only state.

Suggested shape:
- selected account id
- selected year
- selected month
- loading / refreshing / error state
- filter state
- row edit state
- new transaction row draft state
- import dialog state
- import history dialog state
- auto-categorise dialog state
- quick rule dialog state
- drag-and-drop import state
- confirmation state

### 3. Derived register model
This is built from loaded data + UI state via pure functions.

Suggested responsibilities:
- sort transactions for display
- calculate running balances from the full sorted transaction set
- apply filters to the display rows after balances are calculated
- calculate closing balance
- derive row metadata for display
- derive toolbar badges and summary counts if needed

This should be rebuilt from authoritative input rather than mutated as a second source of truth.

## Data loading contract
To render the register correctly, we need:
- account context
- category hierarchy for the account
- opening balance for the selected month
- transactions for the selected account/year/month

### Preferred IPC shape
Preferred direction:
- one register feature query for the main screen data
- separate typed workflows for import, auto-categorisation, import history, and rule editing

Example:
- `register.getViewData(accountId, year, month)`
  - account
  - opening balance
  - transactions
  - categories

That is preferable to the renderer coordinating several unrelated calls if it keeps the backend composition explicit and typed.

## Running balance calculation
Running balance is a pure derived concern and should not live inline in the route.

Required behavior:
1. start from the month opening balance
2. process transactions in ascending chronological order to derive per-transaction balances
3. map those balances back to the display order
4. compute closing balance as the last running balance, or opening balance if there are no transactions

### Running balance semantics under filtering
This must be explicit.

Running balances are always calculated from the full sorted transaction set before filters are applied.
Filtering changes which rows are visible, but does not change the balance progression shown for those rows.
Closing balance is derived from the full month ledger, not from the filtered subset.

This ensures the balance column remains financially correct even when the user filters the ledger.

This logic should live in a pure builder such as:
- `buildRegisterRows(...)`
- `calculateRunningBalances(...)`

## Filters
Filtering is part of the main feature and should be modeled explicitly.

Supported filters:
- description / note text filter
- category filter
- flag filter

Filter rules:
- text filter should search description and note
- category filter should support uncategorised explicitly
- filter state should be stable and renderer-owned
- filter application should be pure and derived from loaded transactions

The filtering model should not be embedded deeply inside the route.

## Inline editing
The register supports inline editing of transaction rows.

Editable fields:
- date
- description
- note
- category
- credit
- debit

### Editing behavior
- clicking a field enters field edit mode
- `Tab` and `Shift+Tab` should move across editable fields in a defined order
- `Enter` should save current field
- `Escape` should cancel current field edit
- blur should save current field if changed
- category editing should use a dedicated picker interaction, not ad hoc state branching in the route

### Important note
Field-level local draft state should remain local to the row or row editing abstraction, but persistence coordination should not be scattered unpredictably.

## New transaction row
The "new transaction" row is a distinct workflow and should be treated as its own unit.

Responsibilities:
- maintain a draft transaction input state
- validate minimum required fields
- normalize credit/debit into one signed `delta_value`
- save via typed mutation
- reset draft state after success
- restore focus to the correct field after save

### Placement rule
`NewTransactionRow` is not part of the authoritative transaction row model.
It is a separate input surface rendered consistently at the bottom of the table and is not affected by display filtering.

This should be separate from row-edit logic for existing transactions.

## Mutation and failure rules
This must be defined explicitly.

### Transaction updates
For create/update/delete/toggle-flag/update-note/category reassignment:
- use typed mutation helpers
- define whether the feature is optimistic or authoritative-reload based
- if optimistic behavior is used, rollback or reload must occur on failure
- renderer must not silently leave the row in a saved-looking state when persistence failed

### Recommended initial direction
Use 2 explicit strategies.

#### Inline field edits
For update, update-note, category reassignment, and toggle-flag:
- use safe local patching on success
- do not full-reload the entire register after every successful field save
- preserve row focus and editing continuity after successful save

#### Structural or batch changes
For create, delete, import, import rollback, and auto-categorisation apply:
- prefer authoritative reload after success
- rebuild the derived view model from the refreshed authoritative state

### Save strategy for inline edits
This must be explicit.

- while a field save is in flight, keep the current row/edit context stable
- on success, patch the authoritative local transaction list and keep focus continuity where appropriate
- restore focus by stable row identity + field identity if the row re-renders during save completion
- on failure:
  - restore the authoritative pre-edit row state
  - show a visible error message or toast
  - keep the user in a predictable editing or selection state

### Failure behavior
On failure:
- show a visible error message or toast
- restore authoritative row state
- keep the screen consistent with persisted data

### Navigation during save
If an inline save is in flight:
- define whether edits are blocked, queued, or cancellable
- recommended initial behavior: block conflicting edits until save completes

### Focus continuity
This must be defined so inline editing remains usable.

- successful inline field saves should not remount the whole table unnecessarily
- `Tab`, `Shift+Tab`, blur-save, and sequential field editing must preserve focus continuity
- full reloads should be avoided for per-field inline saves unless there is no safe patch strategy

## Rule workflows
The register integrates with categorisation rules in two ways.

### 1. Quick rule creation from a transaction
The user can create a rule seeded from a transaction's description, amount, and category.

### 2. Rule editing from a categorised transaction
If a transaction was categorised by a rule, the user can jump to edit that rule.

### Explicit manual override rule
This needs to be concrete in implementation.

When a user manually changes category on a transaction that was previously categorised by a rule:
- the transaction should be treated as manually overridden
- `categorised_by_rule_id` should be cleared if that matches the domain rule already enforced elsewhere
- the rule affordance state should update consistently after save

These workflows are part of the register feature surface, but should be treated as dedicated side workflows rather than route-level incidental state.

Suggested controller-owned state:
- quick rule dialog open/closed
- quick rule defaults
- quick rule edit target

## Import workflows
Import is part of the broader transaction feature but should be modeled as a distinct workflow.

### Import wizard responsibilities
- choose file
- choose input format
- transform and preview
- optionally auto-categorise on import
- import confirmed transactions
- report duplicates skipped

### Drag and drop responsibilities
- drag-over state belongs to the register screen shell
- dropped file should feed the same import workflow, not create a separate code path

### Import history responsibilities
- load previous imports for the account
- rollback a selected import
- refresh register data after rollback

These workflows should be controller-orchestrated but remain componentized and separate from the main ledger rendering logic.

## Auto-categorisation workflow
Auto-categorisation is a side workflow of the register.

Responsibilities:
- generate preview for selected scope
- display matched vs unmatched transactions
- apply rules to selected transactions
- refresh register data after apply

This should be modeled as a dedicated workflow surface, not inline state mixed with main row editing.

## Recommended renderer flow
1. Route reads account/year/month from URL.
2. Controller loads authoritative register data.
3. Controller owns UI state only.
4. Pure builders derive sorted, running-balance-correct, filtered rows.
5. Table renders the derived row model.
6. Side workflows such as import, import history, auto-categorise, and quick rule editing are opened from controller state.
7. Mutations use typed helpers.
8. Inline field saves patch authoritative local state on success.
9. Structural and batch operations reload authoritative data on success.
10. Derived row model is rebuilt from authoritative state.

## Component tree
The component tree should reflect the register model and side workflows.

Recommended component structure:
- `AccountRegisterPage`
  - route shell only
- `useRegisterController`
  - URL sync
  - data loading / refreshing
  - screen-level UI state
  - mutation orchestration
  - side workflow orchestration
- `buildRegisterViewModel(...)`
  - pure builder
- `RegisterToolbar`
- `RegisterSummary`
  - opening balance
  - closing balance
- `RegisterTable`
  - `RegisterHeader`
  - `RegisterRowRenderer`
    - `TransactionRow`
    - empty state row
  - `NewTransactionRow`
- side workflow dialogs
  - `ImportWizardDialog`
  - `ImportHistoryDialog`
  - `AutoCategoriseDialog`
  - `QuickRuleDialog`
  - `ConfirmDialog`
  - filter popovers/dropdowns

### Row/editor responsibilities
Avoid one row component that owns every possible state transition in isolation.

Preferred direction:
- `TransactionRow` remains the row boundary
- row editing logic should be extracted into a row-level editing abstraction when it improves clarity
- `TransactionRowEditor` is acceptable if it meaningfully simplifies the row, but should not be introduced as architecture ceremony
- field-specific editor primitives are acceptable where they reduce duplication
- `NewTransactionRow` remains distinct
- category picker remains a reusable primitive

A small amount of row-local draft state is acceptable, but persistence and workflow orchestration should remain predictable and controller-backed.

## View model
A register view model should be small and render-oriented.

Suggested top-level shape:
- `accountMeta`
- `periodMeta`
- `summary`
  - opening balance
  - closing balance
  - transaction count
  - filtered count
- `rows[]`
  - transaction row descriptors with resolved running balance
- `filtersMeta`
  - hasFilters
  - active filter badges if needed

The view model should not duplicate raw entities unnecessarily, but it should make rendering straightforward.

## Layout and interaction rules
- toolbar remains fixed above the scrollable table region
- summary cards remain above the scrollable table region
- table header remains sticky while vertically scrolling
- filter controls and popovers are part of the register shell, not embedded ad hoc into many places
- the new transaction row should remain visually distinct from existing rows
- row actions should not be hidden behind too much implicit hover-only behavior if important actions become undiscoverable

## Backend / shared contracts
The spec should result in explicit feature contracts.

Suggested shared types:
- `RegisterViewData`
- `RegisterTransactionRowModel`
- `RegisterFilterState`
- `RegisterSortOrder`
- `RegisterSummaryModel`
- `RegisterImportPreview`
- `RegisterAutoCategorisePreview`

Suggested separation:
- shared
  - IPC request/response contracts
  - transaction/register DTOs
- main
  - query/service/repository boundaries
- renderer
  - UI-only row models
  - controller state
  - components

## Worked examples
These should be added before implementation starts.

Required examples:
- month with no transactions
- month with multiple same-day transactions and stable ordering
- running balances with active filters still reflecting full ledger order
- editing category on a rule-categorised transaction
- editing note only
- toggling flag with failed persistence
- creating a new transaction from debit input
- creating a new transaction from negative credit input normalization
- applying description filter only
- filtering to uncategorised only
- import preview with duplicates skipped
- import rollback refreshing register correctly
- auto-categorisation preview in `uncategorised` mode vs `all` mode
- successful `Tab` navigation across inline saves without losing focus

## Migration approach
Recommended migration order:
1. Define shared register contracts.
2. Introduce backend register query/service layer.
3. Move renderer register into feature folder structure.
4. Build pure register row and running-balance builders.
5. Introduce `useRegisterController` and thin the route.
6. Separate row display from row editing logic where it clearly improves readability.
7. Integrate import, import history, auto-categorise, and quick rule workflows as explicit controller-managed workflows.
8. Add tests around running balance, sorting, filters, save behavior, and mutation behaviors before final cleanup.

## Open to suggestions
If there is a better way to split inline editing versus controller orchestration, or a better way to structure the register row model, alternatives should be suggested during implementation planning.
