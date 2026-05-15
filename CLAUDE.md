# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Validate env vars, then Vite production build
npm run lint         # ESLint check
npm run preview      # Preview production build locally
node scripts/createAdmin.js   # Create/update an admin user in Firebase (requires serviceAccount.json)
```

There is no test runner configured — no unit or integration tests exist in this codebase.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your Firebase project credentials. All vars must be prefixed `VITE_`. The app will throw at startup and the build will abort if any are missing.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
```

## Architecture Overview

This is a **Firebase-only React admin panel** — there is no custom backend server. All data access goes directly to Firestore and Cloud Storage via the Firebase JS SDK. The `src/api/http.js` Axios instance exists for future backend integration but is not used by any current feature.

### Data Layer (`src/api/`)

All Firestore operations are in helper files, not components. There are two primary data domains:

- **`src/api/shared/carEntries.helper.js`** — Car database CRUD. Firestore path: `modules/carDatabase/cars/{carId}`. Every write also updates the parent module doc at `modules/carDatabase` via `ensureCarDatabaseModuleDoc()`. Search is implemented using a `searchTokens` string array field with `array-contains-any` queries — tokens are built by `buildSearchTokens()` at write time. Pagination uses Firestore cursor-based paging (`startAfter`). Uploaded files go to Cloud Storage at `carDatabase/cars/{carId}/{kind}/{timestamp_filename}` and the download URL + storage path are both saved to Firestore so the file can be deleted later.

- **`src/api/FeedbackReports/FeedbackReports.helper.js`** — Report review flow. Firestore path: `modules/feedbackReports/reports/{reportId}`. Approving a report can optionally clear the linked car's diagram.

- **`src/api/settings/settingsHelper.js`** — Team management (users collection) and platform singleton doc (`settings/platform`). Team list uses a real-time `onSnapshot` subscription.

- **`src/api/stats/`** — Dashboard counts and a real-time `onSnapshot` for the pending-reports badge.

- **`src/api/notifications/notificationsHelper.js`** — Fan-out: fetches all admin UIDs then writes one notification doc per admin.

### Auth Flow

Access is **admin-only**. The `{ admin: true }` Firebase custom claim is the gate. `signInAdmin()` in `src/api/auth/authHelper.js` signs in the user, reads the ID token result, and signs back out immediately if the `admin` claim is absent. The claim is set offline via `scripts/createAdmin.js` using the Firebase Admin SDK.

`AuthContext` (`src/context/AuthContext.jsx`) stores `{ user, token, claims, loading }` and exposes `isAuthenticated` and `isAdmin`. `ProtectedRoute` (`src/routes/ProtectedRoute.jsx`) blocks non-admins at the router level.

### Firestore Composite Indexes

`firestore.indexes.json` defines 14 composite indexes covering the combinations of `status`, `makeKey`, `yearFrom`, `searchTokens`, `createdAt`, and `updatedAt` used by the paginated car queries. If you add a new filter combination to `buildPagedConstraints()` or `buildListConstraints()`, you likely need a new index. Missing indexes surface as `failed-precondition` errors in the console.

### Diagram / Marker System

Each car entry has two overlapping concepts:
- **Diagram**: an uploaded image or a named template (e.g. `sedan_top_v1`). Status: `missing | template | pending | uploaded`.
- **Marker**: a `{ xPct, yPct }` coordinate (percentage-based) indicating the battery location on the diagram. Status: `not-assigned | pending | set`.

Template IDs are inferred from `bodyType` via `src/config/vehicleTemplates.ts` → `inferTemplateId()`. When a new diagram is uploaded, the marker is reset to `pending`. The `DiagramManagementPage` is currently commented out in `App.jsx`.

### UI Conventions

- All Tailwind styling, no CSS modules or styled-components.
- Shared UI primitives live in `src/components/ui/` (Button, Modal, DataTable, etc.).
- Toast notifications via `react-hot-toast` — import `toast` directly, not a wrapper.
- `useAsyncAction()` hook (`src/hooks/`) standardizes loading/error state for async button actions.
- Status fields in Firestore are lowercase strings; the UI normalizes them via `keyText()` (lowercase + trim) on read.
