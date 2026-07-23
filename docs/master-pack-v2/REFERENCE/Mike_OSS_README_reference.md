# Mike OSS README — Reference

Ovo je referentni README sadržaj koji je korisnik dostavio. Koristi se samo kao inspiracija za SDJ MIKE V1, ne kao obaveza da se Mike OSS klonira.

---

Open-source release containing the Mike frontend and backend.

## Contents

- `frontend/` - Next.js application
- `backend/` - Express API, Supabase access, document processing, and database schema
- `backend/schema.sql` - Supabase schema for fresh databases

## Setup

Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Run `backend/schema.sql` in the Supabase SQL editor for a fresh database.

Start the backend:

```bash
npm run dev --prefix backend
```

Start the frontend:

```bash
npm run dev --prefix frontend
```

Open `http://localhost:3000`.

## Required Services

- Supabase Auth and Postgres
- S3-compatible object storage, such as Cloudflare R2
- At least one supported model provider key, depending on which models you enable
- LibreOffice for DOC/DOCX to PDF conversion

## Checks

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
```

## License

AGPL-3.0-only. See `LICENSE`.

---

## SDJ interpretation

Za SDJ MIKE V1 ne preuzimati puni Mike stack. Koristiti samo koncept:

- workspace;
- matter/project view;
- workflow agents;
- document review concept;
- tabular review concept;
- future Word integration.

U V1 izbaciti:

- Supabase;
- S3/R2;
- AI provider API;
- automatsku document processing logiku;
- AnythingLLM;
- RAG;
- cloud storage mimo OneDrive-a.
