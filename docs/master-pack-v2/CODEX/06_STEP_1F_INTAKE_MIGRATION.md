# Codex Step 1F — Legal Intake and Migration

## Deo A — Novi upiti

Implementiraj:

- Intake Queue;
- paste email/text;
- priloge;
- Draft Intake;
- prepoznavanje klijenta prema lokalnim kontaktima;
- possible existing matter;
- Conflict Check Lite;
- prepopunjenu New Matter formu;
- Smart Intake Lite prompt + JSON schema + paste-back validaciju;
- povezivanje sa postojećim predmetom;
- zahtev za dodatne podatke kroz Email workflow.

Ništa se ne kreira bez potvrde.

## Deo B — Migration Center

Implementiraj:

- read-only source scan;
- source summary;
- mapiranje klijenta/predmeta;
- preview destinacije;
- copy-only migraciju;
- očuvanje strukture/timestamps kada je podržano;
- migration manifest i log;
- broj fajlova/bajtova/grešaka;
- cancel after current file;
- import kao active ili archived.

## Ne implementirati

- OCR;
- Outlook/Graph;
- automatski mailbox monitoring;
- automatsku punu klasifikaciju;
- brisanje izvora.

## QA

Koristi male, srednje i problematične test skupove, uključujući duge putanje i fajl koji se ne može pročitati.
