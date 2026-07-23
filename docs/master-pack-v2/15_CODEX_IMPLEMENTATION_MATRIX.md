# Šta Codex može da implementira

## Može potpuno u lokalnom V1

- App shell i navigaciju;
- Settings/workspace verifikaciju;
- klijente i kontakte;
- predmete i kontrolne fajlove;
- Matter Cockpit;
- file metadata liste i otvaranje foldera/fajlova;
- zadatke i sledeći korak;
- Master task indeks;
- ručni sudski kalendar i 7/15/30 prikaz;
- Today logiku;
- prompt generator i AI work log;
- email draft workflow;
- Novi upiti sa ručnim importom;
- Smart Intake Lite sa ručnim JSON povratom;
- Conflict Check Lite;
- Migration Center copy-only;
- Archive/Trash/Restore;
- legal updates ručni/Monday Brief import;
- metadata pretragu;
- rebuild indeksa;
- lint/build/test.

## Može uz dodatne lokalne biblioteke i posebno testiranje

- `.eml` parser;
- `.msg` parser;
- searchable PDF text extraction;
- lokalni OCR pipeline;
- prepoznavanje poslovnih brojeva i izričitih datuma;
- preview PDF-a;
- Windows desktop packaging.

## Ne obećavati u Simple Core-u

- automatsko čitanje Outlook mailboxa;
- automatsko slanje emailova;
- automatsku AI obradu bez API-ja;
- automatsko uploadovanje dokumenata AI servisu;
- potpuno pouzdano OCR prepoznavanje bez korisničke potvrde;
- automatsko potvrđivanje konflikta;
- automatsko pravno zaključivanje;
- automatski monitoring svih propisa bez konektora;
- multitenant SaaS i naplatu.

## Pravilo rada sa Codexom

Za svaku fazu:

1. prvo inspect postojećeg koda;
2. plan bez menjanja koda;
3. implementacija samo odobrenog scopea;
4. lint/build/test;
5. browser QA;
6. opis izmenjenih fajlova;
7. ručna korisnička provera;
8. commit tek nakon potvrde.
