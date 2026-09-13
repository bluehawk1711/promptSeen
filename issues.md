# TS Prompt Issues

Generated from the repository-wide audit on 2026-09-13.

## Critical

- [ ] **SEC-001 — Exposed Firebase Admin credentials**
  - Files: `apps/mobile/.env`, `apps/web/.env`, `apps/web/.env.local`, root `.env.local`, `packages/shared/.env.local`
  - Risk: Firebase private keys and Cloudinary secrets are stored in environment files and may exist in Git history.
  - Fix: Remove tracked environment files, strengthen ignore rules, rotate exposed Firebase and Cloudinary credentials, and provision secrets through Vercel/EAS.

- [ ] **SEC-002 — Server-only Firebase credentials in the mobile app**
  - File: `apps/mobile/.env`
  - Risk: `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` must never be present in a client application.
  - Fix: Remove service-account credentials from mobile configuration.

- [ ] **SEC-003 — Admin API routes are unauthenticated**
  - Files:
    - `apps/web/app/api/cloudinary/delete/route.ts`
    - `apps/web/app/api/notifications/send/route.ts`
    - `apps/web/app/api/notifications/settings/route.ts`
    - `apps/web/app/api/notifications/analytics/route.ts`
    - `apps/web/app/api/notifications/tokens/route.ts`
    - `apps/web/app/api/analytics/route.ts`
  - Risk: Anonymous callers can delete Cloudinary assets, send notifications, change settings, or write analytics.
  - Fix: Verify Firebase ID tokens and enforce `users/{uid}.isAdmin === true` in every privileged route.

## High

- [ ] **BUILD-001 — Missing Firebase Storage rules**
  - File: `apps/mobile/firebase.json`
  - Problem: `storage.rules` is referenced but does not exist.
  - Fix: Add secure Storage rules or remove the Storage emulator/deploy configuration if unused.

- [ ] **BUILD-002 — Missing Firebase rules test config**
  - File: `apps/mobile/package.json`
  - Problem: `test:rules` references missing `jest.rules.config.js`.
  - Fix: Add the Jest/Firebase rules test configuration or remove rules-test scripts.

- [ ] **BUILD-003 — TypeScript versions differ across the workspace**
  - Files: `packages/shared/package.json`, `apps/mobile/package.json`, `apps/web/package.json`
  - Problem: Shared/mobile use TypeScript 6 while web uses TypeScript 5.
  - Fix: Pin one compatible TypeScript version across all workspace packages.

- [ ] **WEB-001 — Cloudinary is missing from Next.js remote image patterns**
  - File: `apps/web/next.config.ts`
  - Problem: `res.cloudinary.com` is not allowed for `next/image`.
  - Fix: Add the Cloudinary hostname and expected pathname pattern.

- [ ] **PNPM-001 — Mobile workspace settings are ignored**
  - Files: `apps/mobile/pnpm-workspace.yaml`, `apps/mobile/.npmrc`
  - Problem: pnpm only reads the root workspace file; nested `nodeLinker` and `allowBuilds` settings are ignored.
  - Fix: Move workspace-wide settings to root and place the hoisted linker setting in `.npmrc` where required.

- [ ] **SHARED-001 — Shared package build emits declarations only**
  - Files: `packages/shared/tsconfig.json`, `packages/shared/package.json`
  - Problem: `emitDeclarationOnly` prevents JavaScript output while package exports point to `.js` files.
  - Fix: Produce both JavaScript and declarations with a package-compatible compiler or bundler configuration.

- [ ] **MOBILE-001 — Kotlin compiler classpath is incompatible with Google Ads**
  - Files: `apps/mobile/app.json`, `apps/mobile/plugins/with-kotlin-version.js`
  - Problem: `play-services-ads:25.4.0` contains Kotlin 2.3 metadata while Expo SDK 57 uses Kotlin 2.1 by default.
  - Fix: Patch the generated Gradle classpath during prebuild and pin a compatible Kotlin version.
  - Status: Fix implemented in commit `1668870`; verify on the next EAS build.

## Medium

- [ ] **DEP-001 — Node Cloudinary SDK is installed in mobile**
  - File: `apps/mobile/package.json`
  - Problem: `cloudinary` is unused and unsuitable for the React Native client.
  - Fix: Remove it from mobile dependencies.

- [ ] **DEP-002 — React patch versions differ**
  - Files: `apps/web/package.json`, `apps/mobile/package.json`
  - Problem: Web uses React 19.2.4 while mobile uses 19.2.3.
  - Fix: Align both apps to one exact React and React DOM version supported by Expo SDK 57.

- [ ] **DEP-003 — Type-only package is a production dependency**
  - File: `apps/web/package.json`
  - Problem: `@types/d3-shape` belongs in `devDependencies`.
  - Fix: Move it to development dependencies.

- [ ] **DEP-004 — Unused `date-fns` dependency**
  - File: `apps/web/package.json`
  - Problem: No web source imports `date-fns`.
  - Fix: Remove it after confirming no transitive local usage.

- [ ] **WEB-002 — Web duplicates shared Firebase initialization**
  - File: `apps/web/lib/firebase.ts`
  - Problem: Web maintains a separate initialization/config path and masks missing env vars with non-null assertions.
  - Fix: Reuse shared lazy Firebase/config helpers with explicit environment validation.

- [ ] **WEB-003 — Next.js image config only permits placeholder images**
  - File: `apps/web/next.config.ts`
  - Problem: Prompt images from Cloudinary cannot be rendered through `next/image`.
  - Fix: Allow `https://res.cloudinary.com/<cloud>/**`.

- [ ] **WEB-004 — PostCSS/Tailwind configuration needs verification**
  - File: `apps/web/postcss.config.mjs`
  - Problem: Tailwind v4 plugin configuration may be incorrect.
  - Fix: Verify against the installed Tailwind/PostCSS versions and production build output.

- [ ] **WEB-005 — Next.js ESLint flat-config exports need verification**
  - File: `apps/web/eslint.config.mjs`
  - Problem: Installed `eslint-config-next` exports may not match the configured paths.
  - Fix: Run ESLint and update imports to supported v16 exports.

- [ ] **TS-001 — Unsafe `any` casts reduce type safety**
  - Files:
    - `packages/shared/src/config.ts`
    - `packages/shared/src/backup.ts`
    - `apps/mobile/app/onboarding.tsx`
    - `apps/mobile/components/ui/skeleton.tsx`
    - `apps/mobile/components/ui/input.tsx`
  - Problem: Broad casts hide real type mismatches.
  - Fix: Add precise types, guards, and correctly typed refs/styles/children.

- [ ] **MOBILE-002 — Analytics side effects run in `useState` initializers**
  - Files:
    - `apps/mobile/app/(tabs)/index.tsx`
    - `apps/mobile/app/prompt/[id].tsx`
  - Problem: Render-time state initialization is used for analytics side effects.
  - Fix: Move tracking calls into `useEffect`.

- [ ] **MOBILE-003 — Shared package is not independently consumable**
  - Files: `packages/shared/package.json`, app `tsconfig.json` files
  - Problem: Apps bypass package exports through path aliases, masking the incomplete shared build.
  - Fix: Make the package build valid and verify apps consume its exported entry points.

- [ ] **DATA-001 — Backup/restore omits governed collections**
  - Files: `packages/shared/src/types.ts`, `packages/shared/src/backup.ts`, `apps/mobile/firestore.rules`
  - Problem: Analytics, stats, FCM tokens, notifications, and settings are not represented in backup data.
  - Fix: Define backup policy for each collection; include restorable operational data and deliberately exclude volatile/private data.

- [ ] **DATA-002 — Analytics and stats writes are unauthenticated**
  - File: `apps/mobile/firestore.rules`
  - Problem: Clients can write arbitrary analytics and daily stats.
  - Fix: Validate document shape and require authenticated requests or a verified app-attestation mechanism; add abuse controls where possible.

## Low

- [ ] **CLEAN-001 — Conflicting npm and pnpm lockfiles**
  - Files: `package-lock.json`, `pnpm-lock.yaml`
  - Problem: Multiple package-manager lockfiles create drift risk.
  - Fix: Remove `package-lock.json` and retain only `pnpm-lock.yaml`.

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

- [ ] `git ls-files '*env*'` confirms no tracked environment files or secrets.
- [ ] `pnpm install --frozen-lockfile` succeeds.
- [ ] `pnpm lint` succeeds.
- [ ] `pnpm typecheck` succeeds.
- [ ] `pnpm --filter web build` succeeds.
- [ ] `pnpm --filter mobile lint` and `pnpm --filter mobile typecheck` succeed.
- [ ] EAS Android production build succeeds.
- [ ] Privileged API routes reject missing, invalid, non-admin, and valid-admin tokens.
- [ ] Cloudinary image optimization/upload and Next.js image rendering work.
- [ ] Firebase emulator rules tests pass.
