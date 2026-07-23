# SDJ MIKE V1 — Master Pack v2.0

## Status paketa

Ovo je zaključana razvojna osnova za **SDJ MIKE V1 — Legal Command Center** na dan 23.07.2026.

Paket predstavlja:

- konačnu funkcionalnu arhitekturu V1;
- pravila file-first skladištenja;
- mapu ekrana i klik-flowova;
- strukturu klijenata, predmeta, zadataka, sudskih događaja i AI rada;
- plan migracije postojećih predmeta;
- precizno razdvajanje V1, V1.1 i V2;
- Codex promptove po malim fazama;
- UI referentni prototip.

Paket **nije gotova aplikacija**. UI prototip je funkcionalna i vizuelna referenca, bez stvarnih file-system operacija.

## Glavni princip

> Dokumenti i kontrolni podaci ostaju u SDJ_LEGAL folderima. Aplikacija je komandni sloj koji prikazuje stanje, sledeće korake, rokove, zadatke, intake i AI radni trag.

## Test okruženje

Sve razvojne i migracione operacije prvo testirati isključivo na:

```text
C:\SDJ_TEST\SDJ_LEGAL_TEST\
```

Pravi OneDrive root koristiti tek posle stabilnog testiranja, backup-a i kontrolisane pilot migracije.

## Preporučeni red čitanja

1. `01_MASTER_SPEC.md`
2. `02_UI_INFORMATION_ARCHITECTURE.md`
3. `03_CLICK_FLOWS.md`
4. `04_FILE_DATA_MODEL.md`
5. funkcionalne specifikacije `05`–`13`
6. `14_ROADMAP_ACCEPTANCE.md`
7. `15_CODEX_IMPLEMENTATION_MATRIX.md`
8. odgovarajući prompt iz `CODEX/`

## Važno pravilo za Codex

Ne davati Codexu ceo Master Pack kao jedan zadatak za implementaciju. Za svaku fazu koristiti samo odgovarajući prompt i relevantne specifikacije.
