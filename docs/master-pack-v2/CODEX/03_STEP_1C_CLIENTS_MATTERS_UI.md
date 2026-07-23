# Codex Step 1C — Clients, Matters and Matter Cockpit

## Cilj

Implementiraj konačni App Shell, bazu klijenata, liste predmeta i Matter Cockpit, bez task/court/AI/intake funkcija.

## UI

Koristi `02_UI_INFORMATION_ARCHITECTURE.md` i `UI_REFERENCE/` kao referencu.

Sidebar:

- Danas;
- Novi upiti;
- Zadaci;
- Sudski kalendar;
- Klijenti;
- Predmeti;
- AI rad;
- Pravne promene;
- Migracija;
- Podešavanja.

Ne prikazuj nefunkcionalne kartice. Budući ekrani mogu imati jasno prazno `Još nije implementirano u ovoj fazi`, ali ne smeju izgledati funkcionalno.

## Implementirati

- `00 CLIENT/client-profile.md` i `contacts.md`;
- Clients list;
- Client Profile;
- Matters list;
- Matter Cockpit / Pregled;
- Dokumenti tab sa stvarnim file metadata;
- otvaranje foldera/fajla;
- clients-index i matters-index;
- rebuild indeksa;
- osnovnu globalnu metadata pretragu za klijente i predmete;
- prazna/error/loading stanja.

## Ne implementirati

- tasks;
- court events;
- AI workflow;
- communication;
- intake;
- migration wizard;
- legal updates.

## QA

- rad sa ručno dodatim klijentom/predmetom u Exploreru;
- rebuild indeksa;
- missing/broken Markdown;
- prazni folderi;
- desktop i manji laptop viewport;
- keyboard focus;
- lint/build.
