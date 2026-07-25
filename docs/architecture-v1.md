# SDJ MIKE V1 — arhitektura

## 1. Naziv i svrha

**SDJ MIKE V1 — Legal Command Center** je lokalna, file-first i
matter-centric aplikacija za advokatsku kancelariju.

Aplikacija služi kao komandni sloj nad lokalnim `SDJ_LEGAL` workspaceom.
Folderi i Markdown fajlovi su izvor podataka i ostaju upotrebljivi direktno
iz Windows Explorera i tekstualnog editora, bez pokretanja aplikacije.

Ovaj dokument opisuje stvarno implementirani i prihvaćeni V1 Simple Core.
Starije specifikacije u `docs/master-pack-v2/` predstavljaju razvojne
reference i ne proširuju implementirani V1 scope.

## 2. Simple Core granice

V1 nema:

- OpenAI API ili Claude API;
- automatsko slanje ili upload dokumenata;
- RAG ili OCR;
- SQLite, Supabase ili drugu bazu podataka;
- cloud storage;
- Gmail ili Outlook integraciju;
- MCP;
- Word add-in;
- višekorisnički rad.

Linkovi za ChatGPT i Claude samo otvaraju njihove javne web stranice.
Aplikacija im automatski ne šalje prompt, dokument ili drugi sadržaj.

## 3. Tehnološka osnova

Prema aktuelnom `package.json` i implementaciji:

- Next.js `16.2.11`, App Router i Route Handlers;
- React i React DOM `19.2.4`;
- TypeScript `^5`;
- Tailwind CSS `^4` preko `@tailwindcss/postcss`;
- ESLint `^9` i `eslint-config-next` `16.2.11`;
- Node.js server runtime i `node:fs/promises` za lokalne filesystem operacije;
- standardni browser `fetch` za komunikaciju UI-ja sa lokalnim Route
  Handlerima.

Projekat nema produkcione dependency-je za bazu, cloud, AI API, OCR ili
eksternu integraciju.

## 4. SDJ_LEGAL struktura

Settings verifikacija održava pet glavnih foldera:

```text
SDJ_LEGAL/
├── 00 INBOX/
├── 01 KLIJENTI/
├── 03 SABLONI/
├── 04 ADMIN_SDJ_MIKE/
└── 05 ARHIVA/
```

Klijenti i aktivni predmeti nalaze se ispod `01 KLIJENTI`. Arhivirani
predmeti premještaju se pod `05 ARHIVA/OBRISANI_PREDMETI/`.

## 5. Klijent i matter struktura

Naziv aktivnog matter foldera prati konvenciju
`SDJ_YYYY-MM-DD_KLIJENT_NAZIV_PREDMETA`:

```text
01 KLIJENTI/
└── KLIJENT/
    └── SDJ_YYYY-MM-DD_KLIJENT_NAZIV_PREDMETA/
        ├── 00 CONTROL/
        ├── 01 ULAZ/
        ├── 02 RADNO/
        ├── 03 FINALNO/
        └── 04 AI/
```

Kreiranje predmeta prvo priprema zaseban staging folder, svih pet matter
foldera i CONTROL fajlove. Tek završeni staging folder se preimenuje u
konačni matter folder. Neuspjeli staging se uklanja, dok već postojeći
konačni matter nije rollback meta.

## 6. CONTROL fajlovi

Svaki novi matter dobija pet Markdown fajlova u `00 CONTROL`:

- `command-center.md` — sažetak predmeta i operativna polja: klijent,
  predmet, datum otvaranja, status, prioritet, oblast prava, sljedeći korak,
  čekanje, rok, opis, rizici i očekivani output;
- `chronology.md` — hronologija događaja i povezanih dokumenata;
- `next-actions.md` — hitne, sedmične i akcije koje čekaju klijenta, drugu
  stranu ili dodatnu provjeru;
- `document-register.md` — tabelarni registar dokumenata;
- `ai-work-log.md` — evidencija datuma, alata, tipa prompta, sačuvanog fajla
  i napomene o AI radu.

Matter Cockpit čita `command-center.md`. Nedostajući ili nečitljiv fajl se
obrađuje kao kontrolisano stanje, bez vraćanja raw filesystem greške.

## 7. UI ekrani

- **Today** — server-rendered operativni pregled aktivnog workspacea.
- **Inbox** — vidljivi placeholder; intake funkcionalnost nije
  implementirana u Simple Core V1.
- **Matters / Clients** — učitavanje i kreiranje klijenata i predmeta,
  pregled aktivnih mattera i postojeća archive/delete akcija.
- **Matter Cockpit** — prikazuje podatke iz `command-center.md`, quick
  actions i akcije za otvaranje matter foldera i njegova četiri radna
  podfoldera.
- **Prompt Generator** — izbor predmeta i prompt tipa, generisanje,
  kopiranje i lokalno čuvanje prompta.
- **Settings** — unos dozvoljenog testnog root patha i kreiranje/verifikacija
  pet glavnih `SDJ_LEGAL` foldera.

## 8. Glavni server-side moduli

- `src/lib/sdj-workspace.ts` — čita lokalnu workspace konfiguraciju,
  poredi dozvoljeni i aktivni root, čuva aktivni root i daje putanju do
  `01 KLIJENTI`.
- `src/lib/sdj-files.ts` — definiše matter foldere i CONTROL fajlove,
  sanitizuje dijelove naziva, formira matter folder name i pruža osnovnu
  provjeru direktnog roditeljstva.
- `src/lib/sdj-matters.ts` — validira identifikatore, razrješava client i
  matter foldere, primjenjuje `realpath`/`lstat` zaštite za mutation tokove
  i parsira `command-center.md`.
- `src/lib/sdj-prompts.ts` — validira Prompt Generator input, gradi ChatGPT i
  Claude Review tekst, sanitizuje sadržaj, bira bezbjedno ime fajla, čuva
  prompt u `04 AI` i dopunjava `ai-work-log.md`.
- `src/lib/sdj-dashboard.ts` — učitava aktivne mattere i CONTROL metapodatke,
  računa Today agregacije i pronalazi posljednje sačuvane AI promptove.

## 9. API rute

| Ruta | Metoda | Svrha |
|---|---|---|
| `/api/settings/verify-structure` | `POST` | Validira dozvoljeni root, kreira/verifikuje pet glavnih foldera i postavlja aktivni workspace. |
| `/api/clients` | `GET` | Vraća bezbjedne nazive client foldera. |
| `/api/clients` | `POST` | Validira naziv i kreira novi client folder. |
| `/api/matters` | `GET` | Vraća listu aktivnih matter identifikatora i prikaznih naziva. |
| `/api/matters` | `POST` | Validira input i atomski kreira matter strukturu i CONTROL fajlove. |
| `/api/matters/open-folder` | `POST` | Server-side potvrđuje cilj i otvara matter ili izabrani podfolder u Windows Exploreru. |
| `/api/matters/delete` | `POST` | Bezbjedno premješta aktivni matter u arhivu; ne radi trajno brisanje. |
| `/api/prompts/generate` | `POST` | Generiše ChatGPT i Claude Review prompt tekst iz kontrolisanog matter konteksta. |
| `/api/prompts/save` | `POST` | Čuva prompt u `04 AI` i dopunjava `ai-work-log.md`. |

Ne postoje API rute za OCR, RAG, bazu podataka, email, cloud ili automatsko
slanje sadržaja AI servisima.

## 10. Browser/server granica

Browser dobija client i matter folder identifikatore, prikazne podatke,
relativno ime sačuvanog prompta i kontrolisane status/error odgovore.
Apsolutne client i matter putanje ostaju server-side.

Settings je poseban konfiguracioni ekran: vraća i prikazuje samo root koji
je korisnik unio i koji je potreban za verifikaciju te funkcije. Interne
izvedene client, matter, CONTROL i AI putanje ne vraćaju se drugim browser
ugovorima.

Route Handleri hvataju filesystem greške i browseru vraćaju generičke
poruke. Raw filesystem greške, stack trace i interne putanje nisu dio API
odgovora.

## 11. Filesystem security model

V1 primjenjuje aplikacione zaštite prilagođene lokalnom Simple Core radu:

- workspace je ograničen na lokalno konfigurisani testni root;
- client i matter folder identifikatori moraju biti obični Windows folder
  segmenti;
- raw client i matter nazivi sa path-attempt sadržajem, kao što su `..`,
  slash, backslash ili drive prefix, odbijaju se prije sanitizacije;
- kandidat mora biti direktni child očekivanog roditelja;
- `lstat` mutation provjere odbijaju symbolic link i Windows junction
  direktorijume, odnosno link reparse-point ciljeve;
- `realpath` potvrđuje stvarni workspace, clients, client i matter lanac;
- New Matter ne kreira staging niti piše fajlove dok client lanac nije
  potvrđen;
- archive/delete ne radi `rename` dok izvor i cijeli arhivski lanac nisu
  potvrđeni;
- write/move operacije ne smiju izaći iz dozvoljenog workspacea;
- delete akcija je recoverable arhiviranje, a ne trajno filesystem brisanje.

Ovo je aplikacioni sigurnosni model za lokalni single-user V1. Nije
enterprise sandbox niti zamjena za Windows dozvole, backup i operativne
kontrole računara.

## 12. Prompt Generator

Implementirano je šest prompt tipova:

1. Intake Agent;
2. Contract Agent;
3. Litigation Agent;
4. Client Email Agent;
5. Claude Review;
6. Tabular Review Lite.

Tok je:

1. izbor aktivnog predmeta;
2. izbor prompt tipa;
3. opcioni dodatni kontekst;
4. `Generate Prompt`;
5. pregled i `Copy for ChatGPT` ili `Copy for Claude Review`;
6. `Save Prompt to 04 AI`;
7. dopuna `ai-work-log.md`;
8. ručno otvaranje ChatGPT-a ili Claude-a.

Kolizije imena koriste numerički sufiks. Linkovi otvaraju
`https://chatgpt.com` i `https://claude.ai` u novom tabu. Kopiranje ostaje
lokalna clipboard akcija; nema automatskog slanja prompta ili dokumenta.

## 13. Today Dashboard

`src/lib/sdj-dashboard.ts` agregira:

- broj aktivnih predmeta;
- predmete koji čekaju klijenta;
- predmete koji čekaju drugu stranu;
- hitne predmete;
- aktivne predmete bez sljedećeg koraka;
- posljednjih pet AI promptova;
- posljednje mattere.

Today ekran prikazuje sažete kartice, liste i quick actions za otvaranje
mattera, Prompt Generatora i relevantnih radnih tokova.

## 14. Runtime konfiguracija

Lokalna konfiguracija se čuva u:

```text
.sdj-mike/settings.json
```

Sadrži `allowedTestRoot` i, nakon uspješne Settings verifikacije,
`activeRootPath`. Folder `.sdj-mike/` je naveden u `.gitignore` i lokalna
runtime konfiguracija nije predviđena za commit.

Dozvoljeni testni root u ovoj V1 fazi je:

```text
C:\SDJ_TEST\SDJ_LEGAL_TEST\
```

Pravi privatni OneDrive root se ne koristi dok testna verzija nije stabilna
i spremna za posebno odobren pilot. Njegova putanja nije dio dokumentacije.

## 15. Pokretanje i provjere

Na Windows računaru koriste se:

```powershell
npm.cmd run dev
npm.cmd run lint
.\node_modules\.bin\tsc.cmd --noEmit --incremental false
npm.cmd run build
npm.cmd run start
```

`npm.cmd` se koristi kada lokalna PowerShell execution policy ne dozvoljava
izvršavanje `npm.ps1`. To ne mijenja npm skriptu koja se izvršava.

`npm.cmd run start` pokreće prethodno napravljen production build.

## 16. V1 acceptance status

Kontrolisanim funkcionalnim testiranjem provjereno je svih 15 kanonskih V1
Simple Core kriterijuma i svi su prošli:

1. unos root folder patha;
2. kreiranje/verifikacija `SDJ_LEGAL` strukture;
3. New Client;
4. New Matter;
5. automatska matter folder struktura;
6. svih pet CONTROL fajlova;
7. Matter Cockpit;
8. Open Matter Folder i podfolderi;
9. generisanje prompta;
10. kopiranje za ChatGPT;
11. kopiranje za Claude Review;
12. čuvanje prompta u `04 AI` i AI log;
13. otvaranje ChatGPT-a;
14. otvaranje Claude-a;
15. nastavak file-first rada direktno kroz foldere i Markdown fajlove.

## 17. Poznata ograničenja i warningi

- Projekat nema automatizovan test suite.
- Acceptance je izvršen kontrolisanim funkcionalnim, regresionim i
  security testiranjem u testnom workspaceu.
- Production build prolazi, uz poznati non-blocking Turbopack/NFT output
  tracing warning vezan za import trace Prompt Save servisnog sloja.
- Aplikacija je lokalni single-user Simple Core.
- Inbox je placeholder, a ne implementiran intake modul.
- Šire funkcije opisane u starijem master-packu nisu dio prihvaćenog V1
  scopea i njihovo odsustvo nije V1 nedostatak.
