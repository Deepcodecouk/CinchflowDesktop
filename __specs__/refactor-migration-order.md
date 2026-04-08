# Refactor migration order

## Recommendation
Write both migration plans first, then implement cashflow before the transaction register.

That order is recommended because:
- cashflow is the higher-complexity table and has the worse readability problem today
- the cashflow refactor will force clearer patterns for controller scope, row-model builders, and purpose-specific cells
- the register can then reuse the same architectural discipline without copying cashflow-specific abstractions blindly
- the register is more editing-sensitive, so it benefits from having the shared groundwork already proven

## Shared groundwork to do before either feature rewrite
These tasks should be treated as reusable infrastructure, even if they land in one feature first.

### 1. Feature contract discipline
- typed shared request/response contracts
- feature-specific preload APIs
- thin IPC handlers
- services/queries separated from repositories

### 2. Derived-model discipline
- authoritative loaded data kept separate from UI state
- pure builders for render-oriented models
- direct tests for builders before heavy UI changes

### 3. Mutation discipline
- explicit patch-vs-reload rules
- visible failure handling
- no silent optimistic persistence assumptions

### 4. Renderer discipline
- thin route shells
- controller hooks for orchestration
- row-model-driven table rendering
- narrow row/cell components rather than render helpers or universal cells

## Recommended implementation order
### Stage 1: Shared groundwork
- introduce missing shared typing patterns and preload conventions
- align mutation/error helper patterns used by both features
- add test utilities and fixtures for table-model builders

### Stage 2: Cashflow
- implement phases from `cashflow-migration-plan.md`
- use this as the proving ground for:
  - feature foldering
  - controller boundaries
  - row-model builders
  - typed cashflow query service

### Stage 3: Transaction register
- implement phases from `transaction-register-migration-plan.md`
- reuse the same discipline, not the same names
- keep row editing pragmatic and avoid over-generalizing from cashflow

## What should stay shared vs feature-specific
### Shared ideas
- contract patterns
- mutation result/error handling patterns
- builder testing style
- controller responsibilities at a high level

### Not shared blindly
- row model shapes
- keyboard behavior details
- cell component types
- workflow dialogs
- backend query/service boundaries beyond the general pattern

## Key warning
Do not try to create one generic spreadsheet framework for both features.

They should converge on the same architectural standards, but remain separate domain features:
- cashflow is a projected yearly planning table with derived sections and carry-forward logic
- register is a monthly ledger with running balances, filtering, and inline transaction editing

Trying to unify them too aggressively would likely recreate the same abstraction problems these specs are trying to remove.
