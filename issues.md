# TS Prompt Issues

Generated from the repository-wide audit on 2026-09-13.

## Critical

- [x] ~~**SEC-001 — Exposed Firebase Admin credentials**~~ — User decision: No action needed. Admin panel is not exposed to public; no credential rotation required.

- [ ] **SEC-002 — Server-only Firebase credentials in the mobile app**
  - File: `apps/mobile/.env`
  - Risk: `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` must never be present in a client application.
  - Fix: Remove service-account credentials from mobile configuration.

- [x] ~~**SEC-003 — Admin API routes are unauthenticated**~~ — User decision: No action needed. Admin panel is not publicly exposed; API routes serve the admin panel only.

## High

- [x] ~~**BUILD-001 — Missing Firebase Storage rules**~~ — Fixed: `apps/mobile/storage.rules` created (deny-all placeholder).

- [x] ~~**BUILD-002 — Missing Firebase rules test config**~~ — Fixed: `apps/mobile/jest.rules.config.js` created.

- [ ] **BUILD-003 — TypeScript versions differ across the workspace**
  - Files: `packages/shared/package.json`, `apps/mobile/package.json`, `apps/web/package.json`
  - Problem: Shared/mobile use TypeScript 6 while web uses TypeScript 5.
  - Fix: Pin one compatible TypeScript version across all workspace packages.

- [x] ~~**WEB-001 — Cloudinary is missing from Next.js remote image patterns**~~ — Fixed: `res.cloudinary.com` added to `remotePatterns`.

- [x] ~~**PNPM-001 — Mobile workspace settings are ignored**~~ — Fixed: cleaned up `apps/mobile/pnpm-workspace.yaml`, settings handled by root + `.npmrc`.

- [x] ~~**SHARED-001 — Shared package build emits declarations only**~~ — Fixed: tsconfig emits JS+DTS via `module: "esnext"` + `moduleResolution: "bundler"`.

- [x] ~~**MOBILE-001 — Kotlin compiler classpath is incompatible with Google Ads**~~ — Fixed: config plugin `with-kotlin-version.js` uses `withDangerousMod` to patch classpath to Kotlin 2.3.21.

## Medium

- [x] ~~**DEP-001 — Node Cloudinary SDK is installed in mobile**~~ — Fixed: removed `cloudinary` dep from `apps/mobile/package.json`.

- [ ] **DEP-002 — React patch versions differ**
  - Files: `apps/web/package.json`, `apps/mobile/package.json`
  - Problem: Web uses React 19.2.4 while mobile uses 19.2.3.
  - Fix: Align both apps to one exact React and React DOM version supported by Expo SDK 57.

- [x] ~~**DEP-003 — Type-only package is a production dependency**~~ — Fixed: `@types/d3-shape` moved to `devDependencies`.

- [x] ~~**DEP-004 — Unused `date-fns` dependency**~~ — Fixed: removed from `apps/web/package.json`.

- [ ] **WEB-002 — Web duplicates shared Firebase initialization**
  - File: `apps/web/lib/firebase.ts`
  - Problem: Web maintains a separate initialization/config path.
  - Fix: Reuse shared lazy Firebase/config helpers with explicit environment validation.

- [x] ~~**WEB-003 — Next.js image config only permits placeholder images**~~ — Fixed: same as WEB-001.

- [ ] **WEB-004 — PostCSS/Tailwind configuration needs verification**
  - File: `apps/web/postcss.config.mjs`
  - Problem: Tailwind v4 plugin configuration may be incorrect.
  - Fix: Verify against the installed Tailwind/PostCSS versions and production build output.

- [ ] **WEB-005 — Next.js ESLint flat-config exports need verification**
  - File: `apps/web/eslint.config.mjs`
  - Problem: Installed `eslint-config-next` exports may not match the configured paths.
  - Fix: Run ESLint and update imports to supported v16 exports.

- [x] ~~**TS-001 — Unsafe `any` casts reduce type safety**~~ — Fixed: all `as any` casts replaced with proper types/guards across 5 files.

- [x] ~~**MOBILE-002 — Analytics side effects run in `useState` initializers**~~ — Fixed: moved to `useEffect` in Home and PromptDetail screens.

- [ ] **MOBILE-003 — Shared package is not independently consumable**
  - Files: `packages/shared/package.json`, app `tsconfig.json` files
  - Problem: Apps bypass package exports through path aliases.
  - Fix: Make the package build valid and verify apps consume its exported entry points.

- [x] ~~**DATA-001 — Backup/restore omits governed collections**~~ — Fixed: `BackupData` extended with optional fields; `backup.mjs` supports `--collection` and `--exclude` flags.

- [ ] **DATA-002 — Analytics and stats writes are unauthenticated**
  - File: `apps/mobile/firestore.rules`
  - Problem: Clients can write arbitrary analytics and daily stats.
  - Fix: Validate document shape and require authenticated requests.

## Low

- [x] ~~**CLEAN-001 — Conflicting npm and pnpm lockfiles**~~ — Fixed: `package-lock.json` deleted.

- [ ] **CLEAN-002 — Unused shared exports in web utilities**
  - File: `apps/web/lib/utils.ts`
  - Problem: Unused Firebase/theme re-exports increase coupling.
  - Fix: Remove unused exports after confirming no consumers.

- [ ] **CLEAN-003 — Placeholder seed images are unstable**
  - Files: `apps/web/scripts/seed.mjs`, `apps/mobile/scripts/seed.mjs`
  - Problem: `picsum.photos` URLs may change and are not production assets.
  - Fix: Use stable owned assets or upload seed images to Cloudinary.

- [ ] **CLEAN-004 — Dead analytics test file**
  - File: `apps/web/test-analytics.ts`
  - Problem: Scratch file is not part of a test suite.
  - Fix: Convert it into a real test or delete it.

- [ ] **CLEAN-005 — Agent artifacts should be ignored**
  - Files: `.agents/`, `skills-lock.json`
  - Problem: Tooling artifacts are repository noise.
  - Fix: Add ignore rules and remove tracked artifacts without deleting user configuration unexpectedly.

- [ ] **SEC-004 — Hardcoded secrets may remain in Git history**
  - Problem: Deleting current files does not remove prior commits.
  - Fix: Rotate exposed credentials and purge secret values from Git history using a reviewed history-rewrite process.

## Verification Plan

- [x] `git ls-files '*env*'` confirms no tracked environment files or secrets.
- [x] `pnpm install --frozen-lockfile` succeeds.
- [x] `pnpm --filter @repo/shared typecheck` succeeds.
- [x] `pnpm --filter web typecheck` succeeds.
- [x] `pnpm --filter mobile typecheck` succeeds.
- [x] `pnpm --filter web build` succeeds.
- [ ] `pnpm --filter mobile lint` and `pnpm --filter mobile typecheck` succeed.
- [ ] EAS Android production build succeeds.
- [ ] Privileged API routes reject missing, invalid, non-admin, and valid-admin tokens.
- [ ] Cloudinary image optimization/upload and Next.js image rendering work.
- [ ] Firebase emulator rules tests pass.
