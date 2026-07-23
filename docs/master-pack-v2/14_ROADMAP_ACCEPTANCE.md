# Roadmap i acceptance criteria

## Status

- Step 1A: završen i commitovan.
- Step 1B: implementiran; potreban završni QA i proširenje stabilnim ID/path/archive pravilima.

## Step 1B — završetak Core kreiranja

- New Client;
- New Matter;
- kontrolni fajlovi;
- Matter ID i schemaVersion;
- path safety;
- atomsko kreiranje;
- archive / Trash;
- budući `tasks/` i `court-events/` folderi.

## Step 1C — Klijenti, predmeti i UI shell

- konačna navigacija;
- Client Profile;
- Matter list;
- Matter Cockpit;
- dokument metadata;
- klijentski i matter indeksi;
- globalna metadata pretraga osnovnog nivoa.

## Step 1D — Zadaci, Sudski kalendar i Today

- task zapisi;
- Master task list;
- court event zapisi;
- Master sudski kalendar;
- 7/15/30 dana;
- dinamički Today;
- workload osnovni pregled.

## Step 1E — AI rad i komunikacija

- prompt workflows;
- Save/Copy/Open;
- AI work log;
- Review Queue;
- priprema emaila;
- komunikacioni log;
- Matter Activity.

## Step 1F — Intake i migracija

- Novi upiti;
- paste/email import;
- Draft Intake;
- Smart Intake Lite;
- Conflict Check Lite;
- povezivanje/novi predmet;
- Migration Center;
- manifests i verification.

## Step 1G — Pravne promene i finalni polish

- ručni legal update;
- Monday Brief import;
- klijent/predmet veze;
- client alert draft;
- accessibility i responsive QA;
- stabilizacija i pilot migracija.

## V1.1

- `.eml`/`.msg` stabilna obrada;
- searchable PDF extraction;
- lokalni OCR;
- prepoznavanje zapisnika;
- Outlook `Send to MIKE` koncept;
- calendar export/sync;
- checklist templates.

## V2

- kontrolisani API konektori;
- role/permission model;
- multi-user režim;
- Word/Outlook add-ins;
- agent workflows;
- jurisdiction packs;
- product licensing/updates.

## Globalni V1 acceptance criteria

Aplikacija je spremna za pilot kada korisnik može da:

1. verifikuje workspace;
2. kreira klijenta i kontakt;
3. kreira predmet sa stabilnim ID-em;
4. dobije kompletnu folder strukturu;
5. otvori klijentski i matter folder;
6. vidi i ažurira Matter Cockpit;
7. kreira i završi zadatak;
8. evidentira ročište/rok;
9. vidi 7/15/30 dana;
10. obradi novi upit uz potvrdu;
11. izvrši Conflict Check Lite;
12. pripremi email;
13. generiše i sačuva AI prompt;
14. evidentira pregled AI rezultata;
15. migrira predmet copy-only režimom;
16. arhivira i vrati predmet;
17. obnovi izvedene indekse;
18. koristi sistem i posle ručnih promena u Exploreru;
19. potvrdi da nema pisanja izvan workspacea;
20. uspešno završi pilot na reprezentativnim stvarnim predmetima.
