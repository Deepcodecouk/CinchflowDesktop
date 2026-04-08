# Project Rules and Conventions

## Purpose

These rules exist to keep the codebase understandable for both humans and coding agents. Optimize for explicit structure, narrow responsibilities, readable domain language, and safe refactoring.

## Architecture

- Electron + React 18 + TypeScript + Vite + Electron Forge.
- Tailwind CSS v4, Radix UI, Zustand for shared client state.
- IPC flow is `channels.ts` -> `preload.ts` -> main-process handlers -> services -> repositories.
- SQLite via `better-sqlite3`.
- Repositories are for persistence only. Business logic, orchestration, forecasting, validation flow, and multi-step workflows belong in services or feature-specific use-case modules.

## File Organisation

- One file per component, route, hook, utility, service, or repository.
- Group code by feature. Cashflow code lives under cashflow folders, accounts code under accounts folders, settings code under settings folders, and generic reusable UI under `components/ui`.
- Split shared code by feature or layer when it starts to grow. Do not let `shared/types.ts` become a dumping ground for unrelated concepts.
- Route files should be thin. A route should mostly own URL syncing, top-level screen state, and composition of feature parts.
- If a route becomes responsible for data loading, mutation orchestration, keyboard handling, dialog state, and JSX layout all at once, extract a controller hook and smaller feature components.

## Recommended Screen Structure

For non-trivial screens, prefer this shape:

- `FeaturePage`: route shell only.
- `useFeatureController`: data loading, mutations, selection state, keyboard actions, dialog state, and screen-level orchestration.
- `FeatureView` or `FeatureTable`: top-level composition.
- `FeatureSection` or `FeaturePanel`: one logical section only.
- `FeatureRow`: one row only.
- `FeatureCell`: one cell only.

Do not skip from page directly to cell-level rendering when the screen is grid- or table-heavy.

## Component Boundaries

- Prefer explicit components over local `renderX()` helper functions when the helper returns JSX and closes over feature state.
- A helper like `renderCategoryCells()` is a smell if it depends on selection state, editing state, comments, links, context menus, or domain calculations from outer scope. In that case, make it a real component with explicit props or move the decision logic into a pure view-model helper.
- Avoid component-internal rendering APIs that require parents to construct child internals. Example smell: passing a prebuilt React node like `editInputElement` into a generic cell component.
- Prefer narrow components with explicit purpose over generic "god components". For example, separate editable budget cells from read-only actual or derived cells when their behavior differs materially.
- Generic layout wrappers are fine, but they should not own editing orchestration, context-menu behavior, drilldown behavior, and formatting all at once.

## Grid and Table Rules

- Build complex tables from typed row models or view models first, then render them.
- Enumeration logic should be explicit data, not scattered JSX branching.
- Each row component should render one row kind only.
- Each cell component should render one cell kind only.
- Header rows, aggregate rows, editable rows, and summary rows should be separate components.
- Section components should lay out sections, not act as mini rendering engines.

## Code Style

- No inline event handlers or callbacks in JSX. Always use named functions.
- Keep files small enough to understand in one pass. As a guideline, start decomposing before a file reaches roughly 250 to 300 lines.
- Do not hide complexity inside nested local functions if those functions contain substantial JSX or business logic.
- Use descriptive domain names in calculation-heavy code. Avoid abbreviations like `m`, `mt`, `h`, `b`, `a`, `ob`, `fix`, or `vari` when the scope is larger than a couple of lines.
- Prefer types and enums over raw strings for domain concepts.
- Keep code ASCII by default. If Unicode is needed, ensure files are stored as UTF-8 and verify no mojibake is introduced.
- Follow the lint rules, including `padded-blocks`. Do not leave the lint baseline to degrade.

## State Management

- Zustand is for genuinely shared app state such as accounts or settings.
- Feature-specific orchestration belongs in dedicated controller hooks.
- Presentational components should receive data and callbacks, not call IPC directly.
- Avoid drilling deeply coupled state through many layers when that state really belongs in a feature controller.

## Loading and Refreshing

- Only show a blocking loading state on first load.
- Subsequent refreshes should preserve scroll position and avoid flicker.
- Use explicit async states such as initial loading, refreshing, success, empty, and error instead of a single overloaded boolean.
- Never return `null` for an app-level loading state without a deliberate fallback UI.

## Mutations and Error Handling

- Every IPC mutation result must be checked.
- Do not optimistically mutate local state without either rollback logic or an authoritative reload on failure.
- Do not swallow failures with only `console.error` unless the action is genuinely non-critical.
- User-visible actions need consistent user-visible success or failure feedback. Prefer shared dialogs, toasts, or error states over `alert()`.
- Keep mutation handling in controller hooks or feature services, not spread across many leaf components.

## Backend and IPC

- All IPC channels must be defined in `src/shared/channels.ts`.
- `preload.ts` must expose typed feature APIs, not loose `unknown`-based contracts.
- Define shared request and response types for IPC calls. Do not pass loosely typed objects when a proper interface should exist.
- Translate UI-only sentinel values to database values at the boundary layer only. Do not scatter null or sentinel conversions across routes, hooks, handlers, and repositories.
- Main-process handlers should stay thin. Validation and business rules belong in services or domain modules.
- Repositories should not build UI view models.

## Cashflow-Specific Rules

- `CashflowPage` should remain a route shell plus controller hookup.
- Cashflow tables should be composed from explicit pieces such as toolbar, table, header row, section, category row, aggregate row, and focused cell components.
- Do not keep cashflow-specific forecasting, breakdown, and row-enumeration logic mixed into the route and section renderer.
- If a cashflow component needs many props, pause and check whether it actually represents multiple responsibilities.
- `GridCell` should not be the universal owner of every possible cashflow behavior. Prefer narrower cell components when editing and display behavior diverge.

## Testing

- Before refactoring financial logic, add tests.
- Prioritize tests for cashflow calculations, budget carry-forward behavior, import de-duplication, and auto-categorisation.
- Add tests for services and pure calculation modules before UI refactors.
- If a feature is hard to test, that is evidence the boundaries are probably wrong.

## Review Checklist

Before finishing any substantial change, check:

- Is the route still thin?
- Is each component responsible for one clear thing?
- Did any `renderX()` helper quietly become a hidden component?
- Did a parent start constructing a child React node instead of passing state and intent?
- Are IPC contracts typed end to end?
- Are mutation failures handled explicitly?
- Are domain names descriptive?
- Would a new human maintainer know where the rules for this feature live?
