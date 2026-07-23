# Codex Step 1B — Completion and hardening

## Scope

Završi i stabilizuj postojeći Step 1B. Ne uvodi Step 1C funkcije.

## Prvo uradi

1. Inspect postojeći repo i trenutne commitove.
2. Prikaži mapu relevantnih fajlova.
3. Proveri New Client/New Matter tok i mapiranje svih polja.
4. Ne menjaj kod dok ne napišeš kratak plan.

## Implementirati

- stabilni Client ID i Matter ID;
- `schemaVersion`;
- buduće `tasks/` i `court-events/` foldere;
- `court-calendar.md` template;
- path-safety centralni helper;
- collision handling;
- atomsko kreiranje predmeta;
- Open Matter Folder;
- Archive Matter;
- Move to Recoverable Trash;
- Restore;
- trajno brisanje samo iz Trash-a uz strogu potvrdu;
- dopunjeni command-center template.

## Ne implementirati

- Matter Cockpit;
- task ekran;
- Master kalendar;
- Prompt Generator;
- Intake;
- OCR;
- email integraciju;
- pravne promene.

## QA

- testiraj normalan predmet;
- nedozvoljene znakove;
- duplikat naziva;
- predugu putanju;
- grešku usred kreiranja i rollback;
- archive/restore/trash;
- zabranu pisanja van root-a;
- lint i build.

Na kraju prikaži izmene i čekaj korisničku proveru pre commit-a.
