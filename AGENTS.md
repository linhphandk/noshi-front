# AGENTS.md

Mirrors the conventions of the sibling repo `krafted-front` (same stack, deps, and tooling config).

## Behavior

- Always use caveman mode (bone intensity). No filler, no hedging, fragments OK.
- Always open a pull request instead of committing directly to main.
- Always check what needs to be done and give a summary before starting work. Never start coding immediately.

## Stack

- React 19 + TypeScript 5 + Vite 6
- `@radix-ui/themes` (UI library) — NOT shadcn, MUI, or Chakra
- React Router v7 (routing) + react-query 5 (server state) + react-hook-form 7 (forms)
- Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config.js`)
- Vitest + React Testing Library + MSW (unit/integration); Playwright (e2e)
- Prettier (formatting) + ESLint (linting)

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :5173; proxies `/api` and `/auth` to `VITE_API_URL` (default `http://localhost:3000`) |
| `npm run build` | `tsc -b && vite build` — also the **real** typecheck; `dist/` deploys to S3 + CloudFront on push to `main` (staging) |
| `npm run lint` | `eslint .` (flat config) |
| `npm run format` / `format:check` | Prettier write / check. NOT gated by pre-commit or CI |
| `npm test` | Vitest run (jsdom, globals on). Single file: `npx vitest run src/path.test.ts`. Watch: `npm run test:watch` |
| `npm run e2e` | Playwright (auto-starts `npm run dev` on :5173). Single test: `npx playwright test e2e/path.spec.ts` |
| `npm run api:generate` | Requires backend on `:3000`; downloads OpenAPI to `api/openapi.json` then orval → `src/api/generated.ts` |

## Critical gotchas

- **`npm run typecheck` is a no-op.** `tsconfig.json` has `files: []` + only project references; `tsc --noEmit` doesn't follow references. Use `npm run build` (or `npx tsc -b`) for real type checking.
- **Test files are excluded from `tsc -b`.** `tsconfig.app.json` excludes `*.test.ts(x)` and `__tests__`; test type errors surface via Vitest, not the build.
- **Pre-commit is heavy:** `.husky/pre-commit` runs `lint && test && build && e2e` (boots a dev server for Playwright). Expect slow commits.
- **CI runs only `npm run build`** — pre-commit is the comprehensive gate.
- **`verbatimModuleSyntax: true`** → `import type` for type-only imports.
- **`erasableSyntaxOnly: true`** → no enums, namespaces, or constructor parameter properties.
- **`noUnusedLocals` / `noUnusedParameters`** → prefix intentionally unused params with `_`.
- **Prettier differs from defaults:** `semi: false`, `singleQuote: false`, `trailingComma: "all"`, `printWidth: 100`. Match when writing code.

## Architecture

- SPA entrypoint: `src/main.tsx` → `index.html`. Path alias `@` → `src/` (vite, vitest, tsconfig).
- Tailwind via `@import "tailwindcss"` in `src/index.css`; `@tailwindcss/vite` plugin.
- Orval codegen: `src/api/generated.ts` (do not edit manually) using fetch wrapper `src/api/custom-fetch.ts`. Config key in `orval.config.ts` is `noshi`.
- Only runtime env var: `VITE_API_URL` (see `.env.example`). Node 22; npm is the package manager (lockfile committed).

## Import convention

- Use `@/` alias: `import { useAuth } from "@/context"` not relative `../../`.
- Barrel exports via `index.ts` in each module directory.
- Types imported from `@/types`.

## File naming

- Pages: `PascalCasePage.tsx` (e.g., `LoginPage.tsx`)
- Components: `PascalCase/index.tsx` (e.g., `Layout/index.tsx`)
- Hooks: `camelCase.ts` (e.g., `useAuth.ts`)
- API modules: `camelCase.ts` (e.g., `listings.ts`)
- Types: `camelCase.ts` (e.g., `listing.ts`)
- Tests: `PascalCase.test.tsx` co-located or `__tests__/PascalCase.test.tsx`

## Component style

- `const ComponentName = () => { ... }` + `export default ComponentName`
- Never `export default function ComponentName()`

## Styling

- Radix UI components (`<Button>`, `<Card>`, `<TextField.Root>`) as primary building blocks
- Tailwind utility classes for layout (`flex`, `gap-4`, `p-4`)
- Radix CSS variables for color (`var(--gray-a5)`, `var(--iris-11)`)
- Wrap app in Radix `<Theme>` with a fixed `accentColor`, `radius`, `scaling` (set in `src/main.tsx`)
- Do NOT add shadcn components

## Testing

- jsdom environment, globals on. Setup: `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`).
- Custom render `renderWithProviders` from `src/test/test-utils.tsx` (wraps Theme + Router), not raw `render`.
- Use `@testing-library/user-event` for interactions, NOT `fireEvent`.
- Use `msw` for API mocking in integration tests.
- All new features MUST include tests.

## Do NOT

- Install shadcn, MUI, Chakra, or any component library besides Radix Themes.
- Read or search `node_modules`.
- Add comments unless explicitly asked.
- Use `any` — prefer `unknown` or proper types.
- Access `localStorage` directly (route through `src/utils/token.ts`).
- Make raw `fetch` calls outside `src/api/custom-fetch.ts`.