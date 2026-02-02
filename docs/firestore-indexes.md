# Firestore indexes for Car Database module

Add these composite indexes in Firebase Console or deploy with `firebase deploy --only firestore:indexes` (uses `firestore.indexes.json` in repo root).

Collections are addressed via **collection group** `cars` (path: `modules/carDatabase/cars`) so `queryScope` must be `COLLECTION_GROUP`. Reports live in `modules/feedbackReports/reports` and rely on Firestore’s auto single-field indexes for current queries.

## Required composite indexes (defined in firestore.indexes.json)

1) **Cars – diagram uploads within time range**  
   - Fields: `diagramStatus ASC`, `createdAt ASC`, `__name__ ASC`  
   - Used by: dashboard counts where `diagramStatus == "uploaded"` and `createdAt >= cutoff` via collectionGroup query.

2) **Cars – status filter + recent first**  
   - Fields: `status ASC`, `createdAt DESC`, `__name__ DESC`  
   - Used by: status-filtered list reads and status + createdAt sorts.

3) **Cars – status filter + updatedAt sort**  
   - Fields: `status ASC`, `updatedAt DESC`, `__name__ DESC`  
   - Used by: car list when filtering by status and ordering by `updatedAt`.

4) **Cars – year range + updatedAt sort**  
   - Fields: `yearFrom ASC`, `updatedAt DESC`, `__name__ DESC`  
   - Used by: car list when both `yearFrom` and `yearTo` filters are applied (inequality on `yearFrom` + `orderBy yearFrom, updatedAt`).

5) **Cars – search token + updatedAt**  
   - Fields: `searchTokens ARRAY_CONTAINS`, `updatedAt DESC`, `__name__ DESC`  
   - Used by: search (`array-contains`) ordered by `updatedAt`.

6) **Cars – search token + status + updatedAt**  
   - Fields: `searchTokens ARRAY_CONTAINS`, `status ASC`, `updatedAt DESC`, `__name__ DESC`  
   - Used by: search combined with status filter.

> Single-field indexes are automatic; keep `firestore.indexes.json` in sync with query changes. If Firestore shows FAILED_PRECONDITION with a create-index URL, deploy indexes or create them in Console.
