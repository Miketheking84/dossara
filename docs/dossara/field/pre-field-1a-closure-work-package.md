# PRE-FIELD-1A — Closure prije terenskog pilota

| Polje | Vrijednost |
|---|---|
| Work package | PRE-FIELD-1A — Closure prije terenskog pilota |
| Datum | 2026-08-20 |
| Osnov | konsolidovana odluka naručioca iz dostavljenog closure naloga |
| Prihvaćeni lanac | WAC-1 → ACA-1 → WAC-1A → WRITE-1V → FSE-1A → BASE-1 → WRITE-PROD-1A |
| Početni status | FIELD-1A — CONDITIONAL GO / PRE-FLIGHT CORRECTIONS REQUIRED |
| Završni status | **GO — START FIELD-1A na lokalnom NTFS test workspace-u sa sintetičkim predmetima** |
| Produkcijski workspace | **NIJE KORIŠĆEN / NIJE DOZVOLJEN** |
| OneDrive | **NIJE DIRAN / NOT QUALIFIED** |

Ovaj zapis zatvara samo tri nalaza iz PRE-FIELD-1A naloga. Mutation vocabulary,
OneDrive, Electron/installer, accepted WRITE/BASE/FSE/WAC/ACA logika i ostali
eksplicitno isključeni moduli nijesu proširivani.

## 1. Item 1 — Loopback-only binding

- `dev` i `start` eksplicitno koriste `-H 127.0.0.1`.
- `scripts/verify-loopback-binding.mjs` pokreće instalirani Next CLI, bira slobodan
  port, dokazuje uspješnu TCP konekciju na `127.0.0.1` i zatim pokušava konekciju
  na svaku stvarnu non-loopback LAN IPv4 adresu iste mašine.
- Skripta pada ako nema LAN IPv4 adresu, ako loopback nije dostupan, ako je bilo
  koja LAN konekcija prihvaćena ili ako pokrenuti Next proces nije uredno ugašen.
- `npm run field:preflight` uključuje ciljanu/regresionu bateriju, TypeScript,
  ESLint, build i produkcijski runtime probe.

Runtime evidence:

| Mod | Port | `127.0.0.1` | LAN adresa | LAN rezultat |
|---|---:|---|---|---|
| `next dev` | 59713 | connected | `192.168.1.20` | timeout / nije dostupno |
| `next start` — završni samostalni probe | 59724 | connected | `192.168.1.20` | timeout / nije dostupno |
| `next start` — puni preflight | 59755 | connected | `192.168.1.20` | timeout / nije dostupno |

Pokušaj sa fizički drugog uređaja na istoj mreži nije izvršen u ovoj Codex
sesiji. Automatizovani negativni probe koristio je stvarnu LAN adresu iste
Windows mašine, ne izmišljenu ili loopback adresu.

## 2. Item 2 — External baseline reconciliation

- Inicijalni baseline ostaje zasebna `POST` radnja.
- Nova `PUT` radnja prihvata eksterno izmijenjene, upravo pregledane bajtove samo
  kada `expectedReadToken` odgovara trenutnom exact-byte sadržaju i kada postoji
  prethodna accepted revizija.
- Nova immutable `MATTER_CONTROL` revizija koristi stanje
  `EXTERNAL_BASELINE_ACCEPTED` i referencu
  `PREVIOUS_MATTER_CONTROL_REVISION` na prethodnu accepted reviziju.
- Novi receipt koristi isti evidence model i jasno nosi prethodni i trenutni
  revision ID i read token.
- UI za `EXTERNAL_BASELINE_REVIEW_REQUIRED` prikazuje posebnu akciju
  „Prihvati eksterno izmijenjenu verziju“, odvojenu od prvog onboarding-a.

Automatizovani test zatvara puni ciklus:

`accepted V1 → manual V2 → stale PATCH / CONFLICT → bytes unchanged → reload →`
`EXTERNAL_BASELINE_ACCEPTED → naredni PATCH / CANONICAL_SUCCESS`.

Browser plugin nije mogao da inicijalizuje browser zbog interne trusted-code-path
greške prije navigacije. Repozitorijum nema Playwright i nijedna nova zavisnost
nije uvedena. Zato renderovani klik/screenshot nije dodat ovom evidence-u; UI
grana je provjerena kroz TypeScript, ESLint, produkcijski build i testiranu API /
adapter putanju bez ručne manipulacije evidence store-a.

## 3. Item 3 — Matter-local VLA evidence authority

WRITE-1V engine sada razlikuje:

- `workspaceRoot`: containment root za `PERMITTED_TEST_ROOT`, traversal,
  realpath i canonical target provjere;
- `evidenceStorageRoot`: root za evidence I/O, koji produkcijski adapter uvijek
  postavlja na `matter.matterPath`.

Zato `command-center.md` ostaje workspace-relative canonical target, dok se nova
evidencija piše isključivo pod:

`<matter>/00 CONTROL/vla/objects/...`

Kompatibilni default u spike contract-u ostavljen je samo za postojeće izolovane
WRITE-1V/FSE test harness-e; produkcijski adapter uvijek prosljeđuje eksplicitni
matter-local root. Test sa dva različita matter-a potvrđuje dva fizički odvojena
`00 CONTROL/vla/objects` stabla i odsustvo novog `<workspace>/00 CONTROL` foldera.

Migracija stare test-scratch evidencije nije rađena.

## 4. Završna regresija

Pokrenuto na Windows/NTFS okruženju sa `TEMP` i `TMP` usmjerenim u jedini
dozvoljeni test workspace `C:\SDJ_TEST\SDJ_LEGAL_TEST\`.

| Gate | Rezultat |
|---|---:|
| Targeted + WRITE-PROD-1A + WRITE-1V/BASE-1 + FSE-1A | **96/96 PASS**, 6/6 fajlova |
| TypeScript `tsc --noEmit` | **PASS** |
| ESLint | **PASS** |
| Next.js optimized build | **PASS** |
| Static generation | **19/19 PASS** |
| `next start` runtime loopback/LAN probe | **PASS** |

Build je zadržao ranije dokumentovano nepovezano Turbopack NFT upozorenje u
`sdj-prompts.ts` import trace-u. Kompilacija, TypeScript i static generation su
završeni uspješno.

## 5. Granice i odluka

- Stvarni SDJ i OneDrive workspace nijesu korišćeni.
- Nema AI API-ja niti spoljnih mrežnih poziva.
- Nema commit-a niti push-a.
- Nije mijenjan nijedan accepted kontrolni dokument izvan ovog novog closure
  evidence zapisa.

Sva tri PRE-FIELD-1A item-a i obavezna regresija su zatvoreni. Status je:

**GO — START FIELD-1A na lokalnom NTFS test workspace-u sa sintetičkim predmetima.**
