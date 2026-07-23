# File-first struktura i model podataka

## 1. Root struktura

```text
SDJ_LEGAL/
├── 00 INBOX/
├── 01 KLIJENTI/
├── 03 SABLONI/
├── 04 ADMIN_SDJ_MIKE/
└── 05 ARHIVA/
```

## 2. Administrativna struktura

```text
04 ADMIN_SDJ_MIKE/
├── workspace.json
├── INDEX/
├── MIGRATIONS/
├── LEGAL_UPDATES/
├── LOGS/
└── TEMP/
```

## 3. Klijent

```text
01 KLIJENTI/
└── KLIJENT/
    ├── 00 CLIENT/
    │   ├── client-profile.md
    │   └── contacts.md
    └── PREDMETI...
```

## 4. Predmet

```text
SDJ_YYYY-MM-DD_KLIJENT_NAZIV_PREDMETA/
├── 00 CONTROL/
│   ├── command-center.md
│   ├── chronology.md
│   ├── next-actions.md
│   ├── document-register.md
│   ├── ai-work-log.md
│   ├── court-calendar.md
│   ├── tasks/
│   └── court-events/
├── 01 ULAZ/
├── 02 RADNO/
├── 03 FINALNO/
└── 04 AI/
```

## 5. Stabilni identifikatori

- Workspace ID
- Client ID
- Contact ID
- Matter ID
- Task ID
- Court Event ID
- Intake ID
- AI Work ID
- Legal Update ID

Naziv foldera nije jedini identifikator.

## 6. Izvori istine

| Podatak | Izvor istine |
|---|---|
| Klijent | `client-profile.md` |
| Kontakti | `contacts.md` |
| Stanje predmeta | `command-center.md` |
| Hronologija | `chronology.md` |
| Zadaci | `00 CONTROL/tasks/` |
| Sudski događaji | `00 CONTROL/court-events/` |
| Dokumenti | stvarni fajlovi u predmetu |
| AI promptovi/rezultati | `04 AI/` + `ai-work-log.md` |
| Pravne promene | `04 ADMIN_SDJ_MIKE/LEGAL_UPDATES/` |

## 7. Izvedeni indeksi

```text
04 ADMIN_SDJ_MIKE/INDEX/
├── clients-index.json
├── matters-index.json
├── tasks-index.json
├── court-events-index.json
├── documents-index.json
├── ai-work-index.json
└── legal-updates-index.json
```

Indeksi:

- ne sadrže originalni sadržaj dokumenata;
- mogu se obrisati;
- mogu se ponovo izgraditi;
- ažuriraju se nakon radnje u aplikaciji;
- mogu se ručno osvežiti iz Settings ekrana.

## 8. Atomsko pisanje

Za kreiranje i važne izmene koristiti:

```text
write temp
→ validate
→ rename/replace
→ update index
```

Neuspešna operacija ne sme ostaviti polukreiran predmet ili korumpiran kontrolni fajl.

## 9. Path safety

Svaka write/move/delete operacija mora da proveri:

- verifikovan workspace;
- cilj unutar workspacea;
- dozvoljeni parent folder;
- zabranu traversal-a (`..`);
- zabranu Windows nedozvoljenih znakova;
- collision handling;
- konzervativnu dužinu putanje;
- zabranu brisanja root ili client foldera greškom.
