# Architecture Overview

- Frontend: React (CRA), Tailwind, Radix UI
- Backend: FastAPI
- Data: In-memory store (temporary, replaceable by DB later)

## API Compatibility

All endpoints under `/api` remain available. The in-memory store mirrors the previous MongoDB shapes so the frontend can continue to operate without changes.

## Temporary In-Memory Store

- Collections: `kunden`, `vertraege`, `vus`, `documents`
- Basic query ops: `find`, `find_one`, `insert_one`, `update_one`, `delete_one`, `count_documents`, minimal `aggregate`
- Supported filters: `$regex` with `$options: 'i'`, `$exists`, `$ne`, `$or`, nested fields via dot path

Replace later with real DB by swapping the `db` implementation in `backend/server.py`.
