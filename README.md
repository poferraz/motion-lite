# Motion Lite

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://remarkable-kheer-590733.netlify.app/) ![MIT License](https://img.shields.io/badge/license-MIT-green.svg)

Lightweight, offline-friendly workout planner and tracker. Import a CSV of your training plan, select sessions, and run through workouts with a clean, mobile-first UI optimized for iPhone PWAs.

---

## Table of Contents
- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Motion System](#motion-system)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [PWA / Offline](#pwa--offline)
- [CSV Import Format](#csv-import-format)
- [App Architecture](#app-architecture)
- [Running Tests](#running-tests)
- [Linting](#linting)
- [Building and Deployment](#building-and-deployment)
- [Development Tips](#development-tips)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Demo

**Live Demo:** [remarkable-kheer-590733.netlify.app](https://remarkable-kheer-590733.netlify.app/#landing)

> **Note:** This app works best on mobile devices and is intended to be installed as a web app (PWA). The desktop version is not fully optimized.

### Motion Lite

Lightweight, offline-friendly workout planner and tracker. Import a CSV of your training plan, select sessions, and run through workouts with a clean, mobile-first UI optimized for iPhone PWAs.

### Features

- **CSV import**: Robust parsing with auto delimiter detection, quoted cells, escaped quotes, and flexible header aliases
- **Session selection**: Pick one or more sessions to focus on
- **Workout mode**: Streamlined UI; keeps your place and selections
- **Local persistence**: State saved in `localStorage` with schema versioning
- **Timers**: Countdown and stopwatch state persisted in storage
- **PWA-ready**: Manifest + service worker; works offline after first load
- **Performance**: React 18 + Vite + code-splitting; Tailwind for fast UI
- **Testing**: Vitest + React Testing Library; coverage support

### Tech stack

- **Build**: Vite 5
- **UI**: React 18, Tailwind CSS 3
- **Language**: TypeScript strict mode
- **Testing**: Vitest, @testing-library/react, jsdom
- **Parsing**: Custom CSV parser (plus `papaparse` chunk for future/optional use)

### Requirements

- Node.js 18+
- npm 9+ (or compatible package manager)

### Getting started

```bash
npm install
npm run dev
```

Visit http://localhost:5173

### Motion system

Landing page uses GSAP with SplitType and Flip.

- Feature flag: `src/config/motion.ts` (`canEnableLandingMotion`).
- Reduced motion: `src/hooks/usePrefersReducedMotion.ts` feeds into `mountLandingAnimations`.
- Main entry: `src/animations/landing.ts`
  - `mountLandingAnimations(root, { reducedMotion })` and `unmountLandingAnimations()` control lifecycle.
  - `captureLandingFlipState(root)` and `animateLandingFlipFrom(state)` animate layout shifts on session count changes and CSV replacement.
- Data attributes in landing markup keep selectors stable:
  - `[data-landing-header]`, `[data-landing-logo]`, `[data-landing-title]`, `[data-landing-subtitle]`,
    `[data-landing-count]`, `[data-landing-count-num]`, `[data-landing-last-upload]`,
    `[data-landing-cta]`, `[data-landing-update]`, `[data-landing-replace]`, `[data-landing-reset]`.

See `docs/landing-motion-checklist.md` for testing and criteria.

### Scripts

- **dev**: Start Vite dev server
- **build**: Production build
- **build:netlify**: Production build for Netlify (same as build)
- **build:check**: Type-check (tsc) then build (tests are excluded from tsc build step)
- **preview**: Preview production build locally
- **lint**: Run ESLint on TypeScript/TSX
- **test**: Run unit tests with Vitest (node/jsdom)
- **test:ui**: Open Vitest UI
- **test:coverage**: Run tests with coverage
- **deploy**: Helper script for manual Netlify upload (`bash ./scripts/deploy.sh`)

### Project structure

```text
motion-lite/
├─ public/                  # Static assets served at root
│  ├─ _redirects            # SPA routing (/* -> /index.html)
│  ├─ manifest.webmanifest  # PWA manifest
│  └─ sw.js                 # Service worker (runtime cache)
├─ src/
│  ├─ components/           # UI components
│  ├─ styles/               # Tailwind and CSS variables
│  ├─ utils/                # CSV parsing, storage, analytics, etc
│  ├─ lazyComponents.ts     # Code-split component entry points
│  ├─ App.tsx               # Main app composition and hooks
│  └─ main.tsx              # App bootstrapping + SW registration
├─ docs/                    # Documentation
├─ scripts/                 # Deployment and maintenance scripts
├─ examples/                # Standalone HTML examples and experiments
├─ vite.config.ts           # Vite build config
├─ vitest.config.ts         # Vitest config
├─ tailwind.config.js       # Tailwind configuration
├─ postcss.config.js        # PostCSS configuration
├─ netlify.toml             # Netlify build config
└─ package.json
```

### Configuration

- **Vite** (`vite.config.ts`)
  - Output: `dist/` with `assets/`
  - Manual chunks for vendor and `papaparse`
  - `base: './'` for relative asset paths in static hosting
- **TypeScript** (`tsconfig.json`)
  - Strict mode, bundler module resolution, JSX: `react-jsx`
  - Build excludes tests to keep `build:check` clean
- **Vitest** (`vitest.config.ts`)
  - `environment: 'jsdom'`, global APIs enabled
  - `setupFiles: ['src/setupTests.ts']`
- **Tailwind** (`tailwind.config.js` + `src/styles/index.css`)
  - Content paths for index and all `src/**`
  - Forms + Container Queries plugins
  - CSS variables for dark theme and PWA-safe areas

### PWA / offline

- **Manifest** (`public/manifest.webmanifest`): app metadata, icons, theme colors
- **Service worker** (`public/sw.js`): caches app shell; registered only in production (`src/main.tsx`)
- **Routing**: SPA fallback via `public/_redirects` and `netlify.toml`

### CSV import format

- **Required headers**: `Day`, `Exercise`, `Sets`, `Reps or Time`, `Weight`
- **Optional headers**: `Notes`, `Form Guidance`, `Muscle Group`, `Main Muscle`, `Day Type`
- **Accepted header aliases** (case/spacing-insensitive):
  - **Day**: day, date
  - **Exercise**: exercise, workout, name
  - **Sets**: sets, set
  - **Reps or Time**: reps or time, reps/time, reps time, time, duration, reps
  - **Weight**: weight, load, kg, lbs
  - **Notes**: notes, note, comments
  - **Form Guidance**: form guidance, form, guidance, cues, form cues
  - **Muscle Group**: muscle group, muscle groups, group
  - **Main Muscle**: main muscle, primary muscle, target
  - **Day Type**: day type, type
- **Delimiter detection**: auto-detects comma or tab from header line
- **Quoted cells**: supports quotes and escaped quotes (e.g. `""` -> `"`)
- **Empty lines**: ignored
- **Errors**:
  - Missing required headers -> parsing aborts with a message including detected headers
  - Per-row missing fields -> recorded as warnings with 1-based row numbers; parsing continues
- **Session grouping**: session names are taken from the `Day` column

Example minimal CSV:

```csv
Day,Exercise,Sets,Reps or Time,Weight
Day 1,Push-ups,3,12,Bodyweight
Day 1,Plank,3,60s,
Day 2,Squats,4,10,40kg
```

### App architecture

- **`src/App.tsx`**
  - Custom hooks for concerns: state (`useAppState`), persistence (`useStorageSync`), initialization (`useInitialState`), URL/hash (`useHashNavigation`), accessibility (`useFocusManagement`)
  - Code-split panels via `src/lazyComponents.ts`: `LandingPanel`, `UploadPanel`, `SessionSelect`, `WorkoutMode`
  - Error boundary fallback UI for invalid states
- **Storage**
  - `src/utils/storage.ts` manages `localStorage` under the key `motion_lite_state`
  - Versioned via `SCHEMA_VERSION = 1` with safe defaults and clearing on mismatch
  - `src/utils/storageReducer.ts` exposes direct `storageActions` for UI flows
- **Parsing**
  - `src/utils/parseCsv.ts` implements robust parsing and validation as described above
- **Styling**
  - `src/styles/index.css` includes theme variables, iOS/PWA safe-area handling, and Tailwind layers
- **Analytics (lightweight hooks)**
  - `src/utils/analytics.ts` provides stubs for tracking events (extendable)

### Running tests

```bash
npm test           # run tests
npm run test:ui    # open interactive UI
npm run test:coverage
```

`src/setupTests.ts` loads `@testing-library/jest-dom/vitest` matchers. Tests use jsdom.

### Linting

```bash
npm run lint
```

### Building and deployment

```bash
npm run build          # production build to dist/
npm run build:zip      # build and produce site.zip for Netlify manual upload
npm run preview        # preview locally
npm run deploy         # helper script: build, verify, and create site.zip
```

- **Netlify**
  - `netlify.toml` sets `publish = "dist"` and SPA redirects to `/index.html`
  - SPA fallback also defined in `public/_redirects`
  - After `npm run build`, drag `dist/` into Netlify dashboard
  - Or run `npm run build:zip` and upload `site.zip` via Netlify → Deploys → Upload a deploy

### Development tips

- **Example HTML**: `examples/drag-test.html` to verify browser drag-and-drop behavior
- **Absolute imports**: Prefer relative imports in app code; tests may use aliases per `vitest.config.ts`
- **Mobile/PWA**: The UI is optimized for iPhone viewport behavior and safe-area insets

### Troubleshooting

- 404s on Netlify: ensure `public/_redirects` is copied to `dist/_redirects`
- Blank screen offline: open once online so the service worker can cache the app shell
- CSV not recognized: verify required headers and delimiters; see header alias list above

### Contributing

Contributions are welcome! Please fork the repository and submit a pull request. For detailed guidelines, see [CONTRIBUTING.md](docs/CONTRIBUTING.md).

### Code of Conduct

Please note that this project adheres to a [Code of Conduct](docs/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Author:** [poferraz](https://github.com/poferraz)

## Try It Yourself: Example CSV

> **Note:** Motion Lite requires a specific CSV format to work. You can download an example CSV to test the app:
>
> [Download example CSV](public/test-csv)
>
> - The CSV must include these required headers: `Day`, `Exercise`, `Sets`, `Reps or Time`, `Weight`
> - See the [CSV Import Format](#csv-import-format) section below for details and header aliases.


