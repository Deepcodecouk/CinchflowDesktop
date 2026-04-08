# Cashflow simplification

## Goal
Cashflow needs to become understandable to both humans and agents without requiring them to mentally reconstruct the feature from multiple layers at once.

The current problems are:
- unclear ownership of financial logic
- too much prop drilling and cross-component coordination
- feature state, derived values, and persistence concerns mixed together
- hard to locate editing behavior, display rules, and carry-forward logic
- weak separation between renderer concerns and cashflow-specific backend concerns

The goal of this refactor is to simplify the feature from back end to front end with better abstractions, clearer responsibilities, stronger typing, and easier-to-follow semantic code.

The database schema should remain unchanged unless a schema change is clearly justified by the architecture and meaningfully simplifies the implementation.

Rebuilding parts of the feature is acceptable if that produces a much cleaner result than trying to preserve poor structure.

## What the cashflow does
Cashflow is a yearly financial forecast for a single account.

For a selected account and year, it:
- starts with an opening balance for January
- projects month by month through the selected year
- uses actual values for historic months
- uses current month budget, actual, and hybrid values side by side
- projects future months from the selected carry-forward mode
- groups categories into 4 ordered sections
- allows budget editing on editable months
- supports category header collapse/expand
- supports comments on editable budget cells
- supports category linking across accounts
- supports drilldown into actual transactions

The high-level row structure is:
- Opening balance
- Income (start of month)
  - Category headers
    - Categories
  - Total income (start)
  - Available funds
- Fixed expenses
  - Category headers
    - Categories
  - Total fixed expenses
  - Available funds
- Variable expenses
  - Category headers
    - Categories
    - Uncategorised
  - Total variable expenses
  - Available funds
- Income (end of month)
  - Category headers
    - Categories
  - Total income (end)
  - Available funds / closing balance
- Summary / overview

## Key domain rules

### Transaction values vs budget values
Transaction values are always stored as account deltas.
- Credit to account = positive
- Debit from account = negative

Budget values are stored as they appear in cashflow.
- Expense budget of 100 is stored as 100
- Income budget of 100 is stored as 100

### Displayed actual values
Actual values are displayed according to section type.
- Income actuals are displayed without sign conversion.
- Expense actuals are displayed with sign inversion.

Examples:
- Income transaction `+100` displays as `100`
- Expense transaction `-100` displays as `100`
- Expense refund `+10` displays as `-10`

This means the user reads expense values in the context of the section rather than from the raw stored sign.

### Hybrid value
Hybrid is the greater absolute magnitude of budget vs actual for a category in the current month.
- if `abs(actual) > abs(budget)`, hybrid uses actual
- otherwise hybrid uses budget

### Carry-forward mode
The user can choose which current-month closing balance variant is used to seed future months.
- `budget`
- `actual`
- `hybrid`

Only future-month opening balances and future projections change when carry-forward mode changes.
Historic months do not change.

## Coding rules
- Group everything directly related to cashflow in a feature folder.
- Preferred renderer location: `src/renderer/features/cashflow`.
- If moving files is too disruptive initially, use a transitional folder plan, but the target should still be feature-based grouping.
- Cashflow-specific shared contracts should live in feature-specific shared modules rather than broad dumping-ground files.
- Do not build the feature around a single giant mutable screen model.

## Target architecture

### Backend
Cashflow should have a cashflow-specific query/service layer in the main process.

Target responsibilities:
- cashflow query/service
  - calculates opening balance for the selected account/year
  - retrieves actuals by category/month
  - retrieves budgets by category/month
  - retrieves category hierarchy for the account
  - retrieves cashflow comments for the account/year
  - retrieves linked category relationships relevant to the account
- repositories
  - persistence only
  - no renderer-oriented view shaping
- IPC handlers
  - thin wrappers over the cashflow service/query layer
- preload
  - strongly typed cashflow feature contract

### Renderer
Renderer cashflow should be separated into 4 layers:
- route shell
- controller / screen-state hook
- pure calculation / view-model builders
- components

## State model
The feature should not rely on one giant mutable hydrated view model.

Instead, it should be composed from 3 distinct layers.

### 1. Loaded data model
This is the authoritative feature data loaded from IPC.
It should be treated as read-only input.

Suggested shape:
- `account`
- `year`
- `openingBalance`
- `hierarchy`
- `budgetLookup`
- `actualLookup`
- `comments`
- `categoryLinks`

This is close to the persistence/query truth.

### 2. UI state model
This is renderer-only state.

Suggested shape:
- selected account id
- selected year
- show historic budgets flag
- carry-forward mode
- collapsed header ids
- selected cell
- editing cell
- edit text value
- drilldown state
- month context menu state
- cell context menu state
- comment dialog state
- category rename state
- loading / refreshing / error state

This state should never duplicate all month/category financial values.

### 3. Derived table model
This is built from loaded data + UI state through pure functions.
It is not persisted directly and should be rebuilt when inputs change.

Suggested responsibilities:
- derive month metadata
- derive opening and closing balances for all months
- derive budget / actual / hybrid values for each row kind
- derive section totals
- derive header totals
- derive available funds rows
- derive row ordering
- derive visual column counts
- derive display formatting metadata needed for rendering

This is the model the table renders.

## Data loading contract
To correctly render the cashflow, we must load all data needed by the table and editing affordances.

Required data:
- cashflow opening balance for account/year
- category structure for account
- actual values grouped by category and month for the selected year
- budget values grouped by category and month for the selected year
- comments for editable cashflow cells for the selected account/year
- linked category relationships relevant to the selected account

### Proposed IPC shape
This can be done either as one aggregated cashflow query or multiple typed calls.

Preferred direction:
- one cashflow feature query for the main table data
- separate calls only for truly separate dialogs if that keeps contracts cleaner

For example:
- `cashflow.getTableData(accountId, year)`
  - opening balance
  - hierarchy
  - actuals
  - budgets
  - comments
  - links

This is preferable to many renderer-coordinated calls if it keeps the backend composition explicit and typed.

## Opening balance calculation
Opening balance must be handled by cashflow-specific backend logic.
This is not just an account or transactions concern.

### Current or historic year
For the current year or any past year:
- sum actual transactions for the account up to, but excluding, `1 Jan` of the selected year

### Future year
For future years:
1. sum actual transactions for the account up to the first day of the current month
2. calculate the selected current-month carry-forward variant
   - `budget`: use current-month budgets
   - `actual`: use current-month actuals
   - `hybrid`: use per-category higher-of-budget-vs-actual logic
3. continue projecting from the month after current month up to, but excluding, `1 Jan` of the selected future year using budget values

### Important note
The selected carry-forward mode only affects future-year opening balances and future-month projections. It does not rewrite historic truth.

## Comments
Comments are part of the core feature and must be modeled explicitly.

Comment rules:
- comments belong to editable budget cells
- they are keyed by account, year, month, and category (including uncategorised)
- a comment indicator is shown in the cell when present
- comments are editable from the cell context menu
- comment create/update/delete must refresh authoritative data or update a dedicated local comment state safely

Comments must be part of the feature contract from the start, not bolted on later.

## Linked categories
Linked categories are also part of the feature and must be represented explicitly.

Link rules:
- a category may be linked to an opposite-type category on another account
- link presence affects both display affordances and mutation behavior
- linked categories must show a visible indicator and tooltip
- budget mutations such as upsert/fill-right should continue to respect existing linked-category rules
- the links-management dialog remains a separate feature surface, but the main cashflow table must know enough to show link indicators and route to that dialog

The table model should include link display metadata for categories rather than making rows discover this ad hoc.

## Building the derived table model
The renderer should build a typed table model from loaded data + UI state.

Suggested top-level model:
- `tableMeta`
  - total visual columns
  - left label column width rule
- `months[]`
  - month number
  - month name
  - month type: historic/current/future
  - visible subcolumns: budget/actual/hybrid
  - visual column count
- `rows[]`
  - ordered list of row descriptors

Suggested row kinds:
- `opening-balance`
- `section-banner`
- `header-expanded`
- `header-collapsed`
- `category`
- `uncategorised`
- `section-total`
- `available-funds`
- `summary-banner`
- `summary-derived`
- `closing-balance`

This is preferable to nesting everything deeply in a single screen model because:
- rendering becomes a simple enumeration problem
- row ordering is explicit
- collapse behavior becomes a pure builder concern
- the table no longer needs to infer what exists from many props and branches

## Recommended renderer flow
1. Route reads account/year from URL.
2. Controller loads authoritative cashflow data.
3. Controller owns UI state only.
4. Pure builders derive month metadata and row model.
5. Table renders the row model.
6. Edit and context-menu actions call typed mutations.
7. On mutation success:
   - either patch the minimal authoritative local state safely
   - or reload the authoritative data
8. Rebuild derived table model from new authoritative state.

## Editing behavior
Only budget values are editable.

### Selection and entry
- click selects a budget cell
- typing while selected enters edit mode and replaces value
- `Enter` enters edit mode from selection state
- `F2` should enter edit mode while preserving the current value for inline editing

### Navigation when not editing
- `ArrowLeft` moves to previous editable month if present
- `ArrowRight` moves to next editable month if present
- `ArrowUp` moves to previous editable row if present
- `ArrowDown` moves to next editable row if present
- `Tab` moves right
- `Shift+Tab` moves left
- `Ctrl+R` fill right empty only
- `Ctrl+Shift+R` fill right overwrite

### Navigation while editing
- `Enter` saves and moves to next editable row if present
- `Tab` saves and moves horizontally if supported
- `Escape` cancels edit
- blur saves if the value changed

### Editable cells
Editable cells are:
- current month budget
- future month budget
- historic month budget only when historic budgets are visible

Historic actual cells, current actual cells, hybrid cells, totals, and derived rows are never directly editable.

## Mutation and failure rules
This must be defined explicitly.

### Save behavior
- saving a budget cell should call a typed cashflow/budget mutation
- if the save succeeds, the source data must be refreshed or safely patched
- if the save fails:
  - keep the previous authoritative value intact
  - show a visible error state or toast
  - do not silently leave the edited display value on screen as if it saved

### Navigation during save
- if a save is in progress, the implementation must define whether navigation is blocked or queued
- recommended initial behavior: block conflicting edits until the save completes

### Account/year changes with active edit
- if there is an active unsaved edit, define a consistent behavior
- recommended initial behavior: attempt save first, and if save fails remain on the current view and surface the error

### Collapse while editing
- collapsing a header while an inner cell is being edited must have defined behavior
- recommended initial behavior: save/cancel edit before collapse is applied

## Component tree
The component tree should reflect the derived table model and should not rely on a universal god component.

Recommended component structure:
- `CashflowPage`
  - route shell only
- `useCashflowController`
  - URL sync
  - data loading / refreshing
  - screen-level UI state
  - mutation orchestration
  - keyboard integration
- `buildCashflowTableModel(...)`
  - pure table model builder
- `CashflowToolbar`
- `CashflowTable`
  - `CashflowTableHeader`
  - `CashflowRowRenderer`
    - `CashflowOpeningBalanceRow`
    - `CashflowSectionBannerRow`
    - `CashflowCategoryHeaderRow`
    - `CashflowCategoryRow`
    - `CashflowSectionTotalRow`
    - `CashflowAvailableFundsRow`
    - `CashflowSummaryBannerRow`
    - `CashflowSummaryRow`

### Cell components
Do not use a single all-purpose `CashflowCell` for every behavior.

Preferred cells:
- `BudgetCell`
  - selection
  - edit mode
  - comment affordance
  - context menu affordance
- `ActualCell`
  - drilldown
  - comparison colouring
- `HybridCell`
  - comparison colouring
- `AggregateValueCell`
  - totals / derived rows / summary rows

A very small internal layout primitive is acceptable, but behavior should remain purpose-specific.

## Visual/layout rules
- toolbar remains fixed above the scrollable table area
- month header remains sticky while vertically scrolling
- left label column remains sticky while horizontally scrolling
- the table fills available space
- cells impose a minimum width and table overflow is scrollable horizontally and vertically
- aggregate rows must reserve the same internal spacing structure as editable budget cells where needed so columns stay aligned

## Colour rules
### General sign colour
- negative values are red
- positive values are green

### Actual comparison colour
- income rows
  - actual >= budget => green
  - actual < budget => red
- expense rows
  - actual <= budget => green
  - actual > budget => red

Comparison logic must account for floating point precision.

### Hybrid comparison colour
Hybrid uses the same comparison rules but compares hybrid value vs budget.

## Backend / shared contracts
The spec should result in explicit feature contracts.

Suggested shared types:
- `CashflowTableData`
- `CashflowMonthMeta`
- `CashflowRowModel`
- `CashflowRowKind`
- `CashflowCommentModel`
- `CashflowCategoryLinkModel`
- `CashflowCarryForwardMode`

Suggested separation:
- shared
  - IPC request/response contracts
  - domain enums and DTOs
- main
  - services / queries / repositories
- renderer
  - UI-only table row models
  - controller state
  - components

## Worked examples
These should be added before implementation starts.

Required examples:
- current year with historic budgets hidden
- current year with historic budgets visible
- future year with carry-forward = budget
- future year with carry-forward = actual
- future year with carry-forward = hybrid
- expense refund producing negative displayed actual
- uncategorised spending in variable expenses
- linked category display and budget mutation behavior
- failed save while editing a budget cell

## Migration approach
Recommended migration order:
1. Define shared cashflow contracts.
2. Introduce backend cashflow query/service layer.
3. Move renderer cashflow into feature folder structure.
4. Build pure month and row-model builders.
5. Replace current table rendering with row-model-driven renderer.
6. Move editing behavior to focused budget-cell abstractions.
7. Integrate comments and linked categories into the model explicitly.
8. Add tests for calculation and row-building logic before final cleanup.

## Open to suggestions
If there is a better way to represent the table model or split the pure builders, alternatives should be suggested during implementation planning.
