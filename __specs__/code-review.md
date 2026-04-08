# Comprehensive code review
I'd like a complete and comprehensive review and refactor of this code base to make it as human readable as possible, formatted as per linting rules, and structured appropriately with components to break up large files whilst adhering to good engineering practices such as SOLID principles.

Be thorough - don't just deal with the observations I've made below, I want a full review of everything from the routes down to individual components.

Conduct a code review and document all findings in this file in the "Findings" section as a task list. After the review, commit this file (but do not push) and move onto implementing each finding in full, committing it with a meaningful message and marking the task as complete in this file.

## Some observations and rules
- We are missing a claude.md file to hold some of these rules which means we're making the same mistakes over and over again.
- Do not create event handlers or callbacks inline with markup, use named functions.
- Make sure to use good component decomposition as much as possible.
- Route and component files can become too long if you keep adding new components to the same files.
- Use one file per component, route, class or library - do not put multiple component definitions in one file! Wire this into claude.md as necessary.
- When we load a screen we usually display a loading message briefly. When things are then changed on that screen, we often make the mistake of reshowing that loading message, causing screen flicker. We shouldn't do that - we should prevent the screen from unmounting the component so that scroll positions are preserved and we don't flicker the screen.
- Keep code grouped by feature - for example, where we decompose cashflow.tsx into components, you should put any cashflow specific components into components/cashflow, and any generic, reusable components across different features into components/ui.

# Findings

## Project-level

- [x] **Create CLAUDE.md** — No CLAUDE.md exists. Create one at the project root with the coding rules and conventions: one file per component, no inline event handlers, padded-blocks linting rule, feature-grouped code organisation, no loading flicker pattern, and other project-specific conventions.

## One file per component violations

- [x] **MonthHeaderRow.tsx** — Defines `SubHeader` and `SubHeaderPlain` helper components alongside `MonthHeaderRow`. Extract them to their own files or inline their JSX if trivial enough.
- [x] **CashflowContextMenu.tsx** — Defines `useClampToViewport` hook in the same file. Extract to `src/renderer/hooks/use-clamp-to-viewport.ts`.
- [x] **RapidConfigDialog.tsx** — Defines `CollapsibleAccount` helper component inline. Extract to its own file.
- [x] **TransactionRow.tsx** — Exports `formatDateInput` utility function alongside the component. Move to a shared utility file.

## Inline event handlers in markup

The following files use inline arrow functions in JSX (`onClick={() => ...}`, `onChange={(e) => ...}`) rather than named functions. Each should be refactored to use named handler functions.

- [x] **cashflow.tsx (627 lines)** — Inline callbacks in `sectionBlockProps` object (lines 414-416), inline `getCurrentMonthBreakdown` functions passed to DerivedRow (lines 469-476, 499-510, 535-546), inline `onOpenMonthContextMenu` (line 447), inline `() => setLinkedCategoriesOpen(true)` (line 433).
- [x] **account-register.tsx (575 lines)** — Inline handlers throughout: filter dropdown toggles, dialog open/close, note edit/delete, transaction form onChange handlers, onSave with async logic.
- [x] **settings.tsx (375 lines)** — Inline onClick handlers for category header and rule management buttons (lines 145-225), inline onChange for currency select.
- [x] **Navbar.tsx (143 lines)** — Multi-statement inline handler in accounts dropdown item click (navigate + close), inline toggle for dropdown open state.
- [x] **SectionBlock.tsx (393 lines)** — Inline handlers for collapse toggle, category name editing (onChange, onKeyDown, onClick), linked categories icon click.
- [x] **NewTransactionRow.tsx (239 lines)** — Inline onChange for all form inputs, inline onFocus/onClick for category picker, inline onSelect with multi-statement logic.
- [x] **TransactionRow.tsx (365 lines)** — Inline onChange/onClick throughout editing state: date, description, category picker, amount fields, action buttons.
- [x] **RegisterToolbar.tsx (115 lines)** — Inline toggles for month picker and menu dropdown, inline onSelect with multi-statement logic.
- [x] **CategoryEditorDialog.tsx (298 lines)** — Inline onChange and onKeyDown for category name editing, inline drag event handler.
- [x] **ImportWizardDialog.tsx (304 lines)** — Inline onClick for format selection, inline onChange for checkbox.
- [x] **DerivedRow.tsx** — Currently clean but receives inline getCurrentMonthBreakdown callbacks from cashflow.tsx; fixing cashflow.tsx resolves this.

## Large files to decompose

- [x] **cashflow.tsx (627 lines)** — Has 12+ useState declarations and mixes toolbar, grid rendering, budget operations, comment handling, navigation, and keyboard handling. Extract budget operation handlers and comment handlers into a custom hook (e.g. `use-cashflow-operations.ts`). Extract the `getCurrentMonthBreakdown` callbacks into named functions within the calculations hook or as standalone helpers.
- [x] **account-register.tsx (575 lines)** — Mixes transaction display, filtering, pagination, note management, and multiple dialog states. Consider extracting filter state/logic into a custom hook and the toolbar/filter UI into a separate component if not already done.
