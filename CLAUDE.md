# Tally DEx Mobile

React Native 0.81.6 (new architecture, Hermes), React 19.1, React Navigation 7, TypeScript. Android app for the TallyDex v3 API. Draft 1 scope: login (plus forgot password and the forced first-login password), dashboard, and the Sales / Closing Stock reports.

Plan, decisions and screen rules: `TallyDex-Mobile-Plan.html`. Sources: functionality from `C:\Users\johna\Desktop\TallyDex-FE`, colours from `TallyDEx_/`, mobile skeleton from `C:\Users\johna\Desktop\DataLynkr-app`.

## Commands

```bash
npm install
npx tsc --noEmit                 # 0 errors
npx eslint App.tsx src __tests__ # 0 problems
npx jest --ci
cd android && ./gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a   # bundled JS, no Metro needed
npx react-native start --port 8082   # 8081 is often taken by the DataLynkr Metro
```

API base URL: `src/config/env.ts` (production `https://tallydex.itcatalystindia.com/api/v3/`).

## Layout

- `src/api/`: `client.ts` (axios; Bearer; `tenant: true` adds `x-organization-id`; one single-flight `/auth/refresh-token` on 401; `skipAuthRefresh` for login/change-password), `endpoints.ts`, `types.ts`, `session.ts` (in-memory tokens + org id, so the client never imports stores).
- `src/store/sessionStore.ts`: user, organizations, selected org, modules (`null` = not loaded = deny). Tokens in the keychain, the rest in AsyncStorage under `tdx.*` keys (never rename them).
- `src/constants/modules.ts`: `reportAccess()` is the only place report views are granted. `src/navigation/menu.ts` builds the sidebar from it.
- `src/navigation/RootNavigator.tsx`: splash → auth / first-login password / main (tabs Home · Sales · Stock, global `Sidebar`, `OrgPickerHost`). Android back handling lives here.
- `src/screens/reports/`: `ReportScaffold` (All / Mapped / Analytics segments, gating, `LocalDataGate`), `ReportList` (infinite list, 50 per page), `Filters`, `DetailSheet`, analytics (`aggregate.ts`), `salesWindow.tsx`.
- `src/screens/data/DataManagementScreen.tsx`: saved-data status, Update / Cancel, auto-update switch, sales period, per-dataset rows, new API fields, storage.

## Local database (offline-first)

- Dashboard and report screens read **only** from SQLite (`@op-engineering/op-sqlite`, file `tallydex.db`). The API is called only by `src/sync/syncEngine.ts`.
- `src/db/schema.ts` is the single source of truth: one `TableDef` per dataset. API fields with a typed column are listed in `columns`; any other field goes into the row's `json_data` and is logged in `schema_extra_key`. Columns starting with `_` are the app's own (`_org_id`, `_date`, `_rid`, …).
- **Promoting a json_data field to a column:** add it to the table's `columns` AND append `{ version: N, statements: promoteColumnSql(table, field, type) }` to `MIGRATIONS`. Never add columns automatically from API data.
- A download writes to `<table>__staging`, then one transaction swaps it into the main table for that organization. A failed or cancelled download changes nothing. Runs never overlap (`currentRun` in `syncStore`).
- When downloads happen (`src/store/syncStore.ts`): no data for the organization → in the background (sales: this month); data older than 24 h and auto-update on → in the background, same sales period (rolled forward to today if it ended on its download day); Update → asks the sales period, then a full re-download. Logout wipes the database.
- Every local query key starts with `'local'` and includes `useSync().version`, which is bumped after each successful download.
- Tests run the real SQL: `__mocks__/@op-engineering/op-sqlite.js` is backed by Node's built-in `node:sqlite` (needs Node 22.13+).

## Rules

- Colours, fonts, spacing only from `src/theme` (lint blocks hex/rgba literals in screens and components).
- `AppText` / `AppTextInput`, not RN `Text` / `TextInput`. `showDialog` (src/utils/dialog.ts), not `Alert.alert`. `log`, not `console`.
- Font families are per weight (`Inter-SemiBold`, `WixMadeforDisplay-Bold`); never set `fontWeight`.
- Every `Modal`: `statusBarTranslucent`, `navigationBarTranslucent`, bottom padding `insets.bottom`.
- The status bar is translucent everywhere; the header paints behind it and pads by `insets.top`.
- Web tables become card rows plus a detail sheet that lists every web column in order.
- Report request field names follow what TallyDex-FE sends (`cotablid`, `dealerIds`, `dealer_id`, …), not the Postman examples.
