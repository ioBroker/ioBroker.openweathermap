# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run npm            # install root + src-widgets deps (widgets need `npm i -f`)
npm run tsc            # compile the backend: src/main.ts -> main.js (tsconfig.build.json)
npm run build          # tsc + `node tasks` (full widget build incl. copy to widgets/)
npm run lint           # eslint (backend only; src-widgets has its own config)
npm test               # test:unit + test:package
npm run test:integration   # starts a real js-controller instance
npm run test-gui       # test/widgets.gui.js, needs a built widget (npm run build first)
```

Single test file / single case:

```bash
npx mocha test/unit --exit
npx mocha test/package --exit --grep "The version matches"
```

Partial widget builds (`tasks.js` steps, useful when only the widget changed):

```bash
node tasks --0-clean   # rm src-widgets/build + widgets/
node tasks --1-npm     # npm i in src-widgets
node tasks --2-build   # vite build
node tasks --3-copy    # copy src-widgets/build -> widgets/openweathermap/
```

Widget dev server: `cd src-widgets && npm start` (vite, port 4173).

## Architecture

Two independent builds live in this repo:

1. **Backend adapter** — `src/main.ts`, compiled by `npm run tsc` to `outDir` from `tsconfig.build.json`. Never edit the compiled JS: contributors regularly send PRs against it, and those changes have to be ported into `src/main.ts` and recompiled, not merged as-is. (The output location is mid-migration from the repo root to `build/`; `package.json` `main`/`files` still name `main.js` and need to follow.)
2. **vis-2 widget** — `src-widgets/` → `widgets/openweathermap/` (also committed, via `node tasks`).

### io-package.json drives the backend

`io-package.json` `instanceObjects` is not just object metadata, it is the extraction schema. Per state:

- `native.path` — dot path into the OpenWeatherMap JSON response (e.g. `main.feels_like`)
- `native.type` — `current` (from `/data/2.5/weather`) or `forecast` (from `/data/2.5/forecast`)
- `native.metric` / `native.imperial` — unit per unit system; `checkUnits()` rewrites `common.unit` at runtime

At startup `onReady()` calls `getStatesOf('forecast')` and splits the *existing* objects into `currentIds` / `forecastIds`, then `extractValues()` walks each `native.path`. **Adding a plain API value = adding an instanceObject; no code change.** Only derived values need code in `main.ts`: `precipitation` (rain+snow), the `icon` URL, `date`/`sunrise`/`sunset` (s → ms), `day`/`day_short` (localized weekday from `date`), `windDirectionText`.

Only `forecast.day0.*` objects exist in `io-package.json`. `forecast.day1..N` and `forecast.periodN` objects are **cloned at runtime** in `processTasks()` from the matching day0 object, rewriting the trailing `.0` in `common.role` to `.N`. A new forecast state therefore only has to be declared once, under `day0`.

### Forecast aggregation

The API returns 3-hour periods; `parseForecast()` groups them by calendar day and `calculateAverage()` reduces each group:

- averaged: clouds, humidity, pressure, visibility, windDirection
- extremes: `temperatureMin` (min), `temperatureMax` (max), `temperatureFeel` (min), `windSpeed` (max)
- **summed, deliberately not averaged**: `precipitationRain`, `precipitationSnow` (they `continue` past the division loop)
- taken from the first period after 12:00, with the last period as fallback: icon, state, title, date, day, day_short, windDirectionText

### Runtime model

Scheduled adapter (cron): one fetch, then `end()` terminates the instance. On first start a default schedule (`11 * * * *` / `*/15 * * * *`) is rewritten to a random minute and the instance restarts, plus a random 0-30 s delay — both spread API load across users, so don't "simplify" them away.

`config.location` starting with `file:` reads a local JSON instead of calling the API (fixtures in `test/lib/current.json`, `forecast.json`).

### Widget

Module federation build via `defineVisWidgetConfig` (`src-widgets/vite.config.ts`), exposing `./Weather` and `./translations`. `src-widgets/src/Weather.tsx` is the vis-2 wrapper class — `getWidgetInfo()` declares `visAttrs` (the widget's config UI) and the widget subscribes to `openweathermap.<instance>.forecast.*`. The rendering lives in `src-widgets/src/react-weather/` (`Weather.tsx` + `Dialog/WeatherDialog.tsx`, SCSS modules, inline SVG icon components).

## Translations

Four separate places, all eleven languages (`en de ru pt nl fr it es pl uk zh-cn`) must be kept in sync — Weblate translates them:

- `admin/i18n/*.json` — labels for `admin/jsonConfig.json` (which sets `"i18n": true`). **The key is the literal English string used in `jsonConfig.json`** — a label that does not match a key verbatim silently stays untranslated.
- `src-widgets/src/i18n/*.json` — widget labels, re-exported through `src-widgets/src/translations.ts`
- `io-package.json` — `common.news` (one entry per released version), `common.titleLang`, `common.desc`
- `README.md` changelog must carry the same version entry as `common.news`; `@alcalzone/release-script` keeps them aligned

`common.name` of `instanceObjects` is plain English by convention here (all 45 states), not a translation object.

`angleToDirectionString()` in `src/main.ts` holds per-language compass abbreviations (all eleven languages are covered; anything else falls back to the English list).
