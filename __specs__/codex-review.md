# Codex Review

Date: 2026-03-09

Scope: full application review across `src/main`, `src/preload`, `src/renderer`, and `src/shared`, with extra attention paid to maintainability for both humans and agents.

## Summary

The app has a sensible high-level split between Electron main process, preload, renderer, and shared types/constants. There are also good early signs of feature extraction, especially around cashflow hooks and the category editor hook. The main problem is that the codebase still asks a reader to reconstruct too much logic from too many places at once.

The biggest maintainability risks are:

1. There is no automated safety net around financial logic.
2. Core feature rules are spread across routes, hooks, IPC handlers, and repositories.
3. Renderer mutations often ignore IPC failures, so the UI can drift away from the persisted state.
4. The IPC boundary is only weakly typed, which makes refactors harder than they need to be.
5. The lint baseline is too noisy to act as a reliable guardrail.

## Positive Observations

- The repository already uses a clear top-level separation of `main`, `preload`, `renderer`, and `shared`.
- Shared channel constants in `src/shared/channels.ts` are a good foundation for keeping the Electron boundary explicit.
- Some extractions are moving in the right direction, for example `use-cashflow-calculations`, `use-cashflow-operations`, `use-cashflow-cell-editing`, and `use-category-editor`.
- Reusable UI primitives such as `Dialog`, `Button`, `ConfirmDialog`, and `CategoryPicker` are starting to form a common vocabulary.

## Findings

### Critical

#### 1. No automated safety net around financial behavior

Observation: the project has no test script, no test dependencies, and no visible automated coverage for the most sensitive logic in the app. At the same time, the codebase contains substantial financial and data-transformation rules in cashflow calculation, budget projection, import de-duplication, and auto-categorisation.

Why this matters: without tests, every refactor remains a manual reasoning exercise. That is especially risky in a finance application where humans and agents will both need confidence that changes did not alter balances, carry-forward behavior, or import outcomes.

Recommendation: add unit tests around pure financial/domain logic first, then add contract tests around IPC handlers, and finally one or two end-to-end smoke flows for create account, import transactions, and cashflow editing.

Evidence:
- `package.json:8-14`
- `src/renderer/hooks/use-cashflow-calculations.ts:34-260`
- `src/main/repositories/budget-repository.ts:125-256`
- `src/main/services/import-service.ts:9-100`

### High

#### 2. Core feature logic is fragmented across too many layers

Observation: important business rules are split between renderer routes, renderer hooks, IPC handlers, and repositories. Cashflow is the clearest example: the page coordinates navigation, selection, breakdown formulas, keyboard behavior, and dialog state; the hook calculates balances; IPC handlers apply linked-category side effects; and the repository contains another forecasting engine.

Why this matters: a maintainer cannot understand one feature by reading one module or even one layer. They have to mentally merge UI behavior, persistence behavior, and accounting behavior from several files before making a safe change.

Recommendation: introduce explicit feature services or use-cases per domain area such as cashflow, transaction editing, import, and category maintenance. Keep routes/components focused on UI orchestration and move domain rules into typed modules that can be reused and tested.

Evidence:
- `src/renderer/routes/cashflow.tsx:23-437`
- `src/renderer/hooks/use-cashflow-calculations.ts:34-260`
- `src/main/ipc/cashflow-handlers.ts:12-234`
- `src/main/repositories/budget-repository.ts:125-256`
- `src/main/ipc/category-handlers.ts:112-154`

#### 3. Several renderer screens and components are still too large and responsibility-heavy

Observation: multiple files combine data loading, state machines, derived calculations, dialog orchestration, mutation handlers, and detailed JSX in a single module. The most obvious examples are `CashflowPage`, `AccountRegisterPage`, `SettingsPage`, `SectionBlock`, `TransactionRow`, `CategoryEditorDialog`, and `ImportWizardDialog`.

Why this matters: large multi-purpose files increase cognitive load, hide feature boundaries, and make it harder for agents or humans to change one concern without breaking another.

Recommendation: decompose each feature into a small page shell, a feature controller hook, and focused presentational sections. Within big table/grid components, extract row renderers and month/section view models so the JSX is mostly declarative.

Evidence:
- `src/renderer/routes/cashflow.tsx:23-612`
- `src/renderer/routes/account-register.tsx:22-575`
- `src/renderer/routes/settings.tsx:20-468`
- `src/renderer/components/cashflow/SectionBlock.tsx`
- `src/renderer/components/accounts/TransactionRow.tsx`
- `src/renderer/components/settings/CategoryEditorDialog.tsx`
- `src/renderer/components/accounts/ImportWizardDialog.tsx`

#### 4. Renderer mutations often ignore IPC failures and can leave the UI in an untrustworthy state

Observation: many renderer handlers either mutate local state optimistically without rollback or call IPC methods and immediately continue without checking `success`. This happens in account editing flows, category editing flows, notes, settings, and stores. There is also an exception-model mismatch where `transactionRepository.update` throws a generic `Error`, but the handler only treats `NotFoundError` specially.

Why this matters: a failed write can still leave the screen looking correct until the next reload. That makes bugs much harder to detect and creates a poor maintenance story because the source of truth becomes ambiguous.

Recommendation: centralize mutation handling behind a small renderer-side helper that unwraps `IpcResponse<T>`, raises consistent user-visible errors, and either rolls back optimistic state or reloads authoritative data on failure. Standardize domain exceptions in the main process so handlers can map them consistently.

Evidence:
- `src/renderer/routes/account-register.tsx:233-257`
- `src/renderer/components/settings/category-editor/use-category-editor.ts:10-68`
- `src/renderer/routes/settings.tsx:50-147`
- `src/renderer/routes/notes.tsx:17-58`
- `src/renderer/stores/settings-store.ts:14-35`
- `src/main/repositories/transaction-repository.ts:63-90`
- `src/main/ipc/transaction-handlers.ts:42-55`

#### 5. The IPC boundary is only weakly typed and is too easy to misuse

Observation: `preload.ts` exports one large imperative `window.api` object with many `unknown`, raw `string`, and inline object types. IPC handlers often accept untyped `data` parameters, while `shared/types.ts` collects database entities, DTOs, and view models into one large shared file. The project already defines `IpcResponse<T>`, but that contract is not consistently enforced at the boundary.

Why this matters: feature refactors become brittle because the compiler cannot reliably guide changes across renderer, preload, and main process. It also makes it harder for agents to understand what is safe to call and what shape comes back.

Recommendation: define feature-level request/response contracts in `shared`, wrap `ipcRenderer.invoke` in typed helpers, and split shared types by feature or layer. Avoid `unknown` and ad hoc inline request shapes for anything beyond quick one-off experiments.

Evidence:
- `src/preload/preload.ts:16-180`
- `src/shared/types.ts:1-277`
- `src/renderer/routes/settings.tsx:31-31`
- `src/main/ipc/transaction-handlers.ts:28-35`
- `src/main/ipc/transaction-handlers.ts:42-49`

#### 6. The lint baseline is too noisy to function as a meaningful quality gate

Observation: running `npm run lint` on 2026-03-09 produced 2028 findings, including 8 actual errors. The warnings are dominated by formatting rules, which buries the few issues that really matter.

Why this matters: once lint output becomes wallpaper, the team stops trusting it. Humans stop checking it, and agents lose a dependable automated signal that could otherwise catch regressions early.

Recommendation: clear the real errors first, then reduce warning volume by feature area until lint is actionable again. After that, keep it green in CI so the baseline stays useful.

Representative evidence:
- `npm run lint`
- `src/renderer/routes/cashflow.tsx:393`
- `src/renderer/hooks/use-confirm.ts:32`
- `src/renderer/lib/utils.ts:8`

### Medium

#### 7. Domain vocabulary is inconsistent, duplicated, and spread across layers

Observation: key concepts are defined more than once or translated repeatedly. `CarryForwardMode` exists in both shared and cashflow-local types. The uncategorised concept moves between `null` and `__uncategorised__` in the renderer, IPC layer, repositories, and dashboard handler. `sectionBreakdown` also accepts a raw `string` instead of a domain type.

Why this matters: every extra translation rule increases the chance of subtle bugs and makes the code harder to search and reason about.

Recommendation: promote canonical domain types to shared feature modules, use those types end to end, and isolate any sentinel-to-database translation at the repository boundary only.

Evidence:
- `src/shared/types.ts:157-165`
- `src/renderer/components/cashflow/cashflow-types.ts:1-28`
- `src/renderer/hooks/use-cashflow-calculations.ts:13-13`
- `src/renderer/hooks/use-cashflow-calculations.ts:122-134`
- `src/main/ipc/cashflow-handlers.ts:48-57`
- `src/main/ipc/cashflow-handlers.ts:91-112`
- `src/main/ipc/dashboard-handlers.ts:65-77`

#### 8. Naming in the most complex logic relies too heavily on abbreviations

Observation: many of the hardest-to-follow modules use terse variable names such as `m`, `mt`, `h`, `b`, `a`, `ob`, `fix`, and `vari`. That is especially visible in cashflow calculations and breakdown formulas.

Why this matters: short names work in small scopes, but they become expensive when the code is already domain-heavy. Readers have to constantly decode whether a value is a month, month type, header, budget, actual, opening balance, or variation total.

Recommendation: use explicit financial names in the calculation-heavy parts of the app. In this codebase, readability gains from descriptive names will outweigh the extra line length.

Evidence:
- `src/renderer/routes/cashflow.tsx:285-355`
- `src/renderer/hooks/use-cashflow-calculations.ts:106-206`
- `src/main/repositories/budget-repository.ts:145-254`

#### 9. Some repositories and handlers are acting like ad hoc services and query builders at the same time

Observation: several data-access modules also implement large chunks of domain behavior or view-model assembly. `budgetRepository.getProjectedOpeningBalances` contains a full forecasting algorithm, `dashboard-handlers` perform multiple queries per account and shape UI data directly, `category-handlers` owns complex delete-and-reassign behavior, and `categoryHeaderRepository.findHierarchical` uses a headers-plus-filter loop rather than returning a purpose-built query result.

Why this matters: the repository layer becomes hard to test, hard to name, and hard to reuse because each module mixes persistence concerns with business rules and output shaping.

Recommendation: split repositories into smaller persistence-focused modules and move domain workflows/read-model composition into services or query objects. For heavier read paths, build explicit query modules with names that reflect the view being assembled.

Evidence:
- `src/main/repositories/budget-repository.ts:125-256`
- `src/main/ipc/dashboard-handlers.ts:42-86`
- `src/main/ipc/category-handlers.ts:112-154`
- `src/main/repositories/category-header-repository.ts:18-35`

#### 10. Source encoding and locale defaults are not normalized

Observation: multiple source files contain mojibake such as `£`, `€`, and corrupted emoji literals. The same issue appears in comment separators. Even if parts of this render acceptably at runtime, it is already harming readability in the source.

Why this matters: broken encoding makes diffs, search, grep, and code review harder. It also creates avoidable risk that incorrect currency or icon text leaks into the UI.

Recommendation: normalize the repository to UTF-8, replace corrupted literals with clean Unicode or ASCII-safe equivalents, and add an `.editorconfig` or repo convention that makes the expected encoding explicit.

Evidence:
- `src/renderer/stores/settings-store.ts:11-11`
- `src/renderer/lib/utils.ts:8-13`
- `src/shared/constants.ts:3-27`

#### 11. User feedback and loading behavior are inconsistent across the app

Observation: different screens handle async state in very different ways. Some use bare loading text, some silently log to the console, some use browser `alert`, and `App` returns `null` while the PIN state is being checked. The end result is an uneven user experience and duplicated async-state code.

Why this matters: inconsistent feedback patterns make the app feel less predictable and increase the amount of custom code every new feature has to carry.

Recommendation: introduce shared async-state and notification patterns for loading, refreshing, success, and failure states. A small toast system plus reusable `LoadingState`, `EmptyState`, and `ErrorState` components would remove a lot of per-screen repetition.

Evidence:
- `src/renderer/App.tsx:40-43`
- `src/renderer/routes/settings.tsx:83-147`
- `src/renderer/routes/notes.tsx:17-58`
- `src/renderer/stores/settings-store.ts:14-35`

## Recommended Order Of Work

1. Add tests around cashflow, budget projection, import, and auto-categorisation behavior.
2. Introduce typed feature contracts at the IPC boundary and stop passing `unknown` or raw objects around.
3. Extract feature services so routes and repositories stop sharing business logic responsibilities.
4. Standardize renderer mutation and error handling so failed writes cannot leave stale optimistic UI behind.
5. Restore the lint baseline and normalize file encoding so automated guardrails become trustworthy again.
6. Rename the densest financial code to use descriptive domain terminology and then decompose the largest screens and components.

## Closing Assessment

The codebase is not far from being maintainable, but it currently relies too much on implicit knowledge. A reader has to know where the rules live, how null and sentinel values flow through the system, which renderer updates are optimistic, and which modules secretly contain domain logic. Tightening those boundaries would make this application much easier for both humans and agents to change with confidence.

## Cashflow Addendum

The original review called out oversized cashflow modules, but your examples are right: there are some more specific component-boundary smells worth naming explicitly.

### Additional Recommendations

#### A. `renderCategoryCells` and friends are component-like functions with hidden dependencies

`renderCategoryCells`, `renderCollapsedCells`, and `renderTotalCells` in `src/renderer/components/cashflow/SectionBlock.tsx:73-278` are effectively private components, but because they are local functions they close over a very wide implicit context: editing state, selection state, comments, linked-category behavior, drilldown behavior, and calculation helpers.

Why this is a smell:
- They behave like components but do not have explicit prop contracts.
- They are hard to test in isolation.
- They encourage `SectionBlock` to become a mini rendering engine instead of a simple section component.
- They make it difficult to memoize or reason about re-render boundaries.

Recommendation:
- Replace these render helpers with explicit components such as `CashflowCategoryRow`, `CollapsedHeaderRow`, and `SectionTotalRow`.
- If shared decision logic remains, move it into a small pure view-model builder rather than embedding branching JSX inside helper functions.

#### B. `GridCell` is too generic and the `editInputElement` prop is backwards

`GridCell` currently accepts a prebuilt `editInputElement` from above (`src/renderer/components/cashflow/GridCell.tsx:13-18`, `69-75`), while the page builds that element in `CashflowPage` and threads it through `SectionBlock` (`src/renderer/routes/cashflow.tsx:210-227`, `417-437`).

Why this is a smell:
- The parent is constructing child internals.
- `GridCell` knows when it is editing, but it does not own the editor rendering contract.
- The API mixes unrelated concerns: formatting, selection, editing, comments, drilldown, and context menu behavior.

Recommendation:
- Split `GridCell` into narrower components, for example `EditableBudgetCell`, `ActualValueCell`, and `DerivedValueCell`.
- Let the editable cell render its own input from explicit editing props instead of receiving a ready-made React node.
- If a generic base remains, it should handle layout only, not editing orchestration.

#### C. `SectionBlock` is doing too much orchestration for a presentational unit

`SectionBlock` currently owns header rendering, category rename UI, linked-category affordances, cell branching by month mode, comment affordances, collapsed aggregates, uncategorised row rendering, and section totals (`src/renderer/components/cashflow/SectionBlock.tsx:42-393`).

Recommendation:
- Narrow `SectionBlock` so it only lays out a section.
- Move row enumeration into a dedicated table composer component.
- Move rename behavior out of the section renderer and into a dedicated row component.

#### D. The cashflow page needs one more decomposition pass

I agree with your expected structure. The current `CashflowPage` still reads like one large orchestration component rather than a screen composed from clear subparts (`src/renderer/routes/cashflow.tsx:417-605`).

A stronger target structure would be:
- `CashflowPage`: route shell, URL syncing, feature-level controller hook.
- `useCashflowController`: load/save orchestration, keyboard actions, dialogs, context menus, selection state, and mutation handlers.
- `CashflowTable`: top-level grid composition.
- `CashflowTableBody`: enumerates sections and summary rows from a typed row model.
- `CashflowSection`: renders one section only.
- `CashflowHeaderRow`: month headings and subheadings.
- `CashflowCategoryRow`: one editable category row.
- `CashflowAggregateRow`: collapsed header total or summary row.
- `EditableBudgetCell`, `ActualCell`, `HybridCell`, `DerivedCell`: focused cell components.

#### E. Prefer row models over ad hoc JSX branching

A large part of the complexity comes from deciding which rows and cells exist directly inside JSX. A cleaner approach would be to build a typed list of row descriptors first, then render that list.

Example row kinds:
- `opening-balance`
- `section-banner`
- `header-collapsed-total`
- `category`
- `uncategorised`
- `section-total`
- `derived-summary`

That would make enumeration explicit, reduce nested conditional rendering, and make the cashflow table much easier for both humans and agents to inspect.
