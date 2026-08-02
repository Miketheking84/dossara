# DOSSARA Phase 0C — WP 0C-B0 Electron Forge + Webpack Desktop Foundation

## 1. Status i opseg dokaza

**Formalni status:** `GO UZ USLOVE — ČEKA RUČNI WINDOWS RESTART`

WP 0C-B0 je izolovani tehnički spike kojim je dokazana minimalna Electron Forge + Webpack desktop šasija. Ovo nije početak B1 niti produkcijska implementacija DOSSARA funkcija. Testovi nijesu pristupali stvarnom SDJ/OneDrive workspace-u ni dozvoljenom testnom workspace-u.

Audited branch i početni HEAD ovog spike-a:

- branch: `spike/phase-0c-electron-forge-webpack`;
- baseline HEAD: `b5a24c1a9bef15bc1c7d536ba48e8befea8b619a`;
- datum završnog acceptance prolaza: 2026-08-02.

Preostali uslovi su:

1. ručni Windows reboot acceptance;
2. automatizovani test sa posebno neprijateljskim Electron `WebContents` prije internog release-a;
3. remediation aktuelnih development/build i postojećih Next dependency audit nalaza prije internog release-a.

Windows reboot nije izvršen. Poseban neprijateljski Electron `WebContents` nije kreiran niti testiran.

## 2. Dokazana arhitektura

```text
Electron main process
  ├─ single-instance i lifecycle kontrola
  ├─ BrowserWindow security policy
  ├─ exact sender + frame + canonical URL validation
  └─ system:get-app-info IPC handler
       │
       ▼
Sandboxed preload
  └─ contextBridge: window.sdj.system.getAppInfo()
       │
       ▼
React renderer bundle
  └─ statični B0 ekran i šest AppInfo vrijednosti
```

Build i packaging model:

- Electron Forge CLI pokreće development i package tok;
- `@electron-forge/plugin-webpack` gradi main, preload i renderer bundle;
- development renderer služi Forge dev server na `127.0.0.1:3000`;
- Forge development `web-multi-logger` koristi port 9000 i nije dio pakovanog runtime-a;
- packaged renderer se učitava iz `app.asar` preko kanonskog `file:` URL-a;
- ne postoji pakovani Next/Node server, lokalni HTTP server ni workspace filesystem integracija;
- IPC API je fiksan i ne prihvata proizvoljan channel ili renderer-supplied URL.

## 3. Stvarne dependency verzije

Direktno dodate B0 `devDependencies`:

| Paket | Verzija |
|---|---:|
| `electron` | `43.2.0` |
| `@electron-forge/cli` | `7.11.2` |
| `@electron-forge/plugin-webpack` | `7.11.2` |
| `webpack` | `5.109.0` |
| `ts-loader` | `9.6.2` |
| `css-loader` | `7.1.3` |
| `style-loader` | `4.0.0` |

Relevantne razriješene tranzitivne verzije:

| Paket | Verzija | Uloga |
|---|---:|---|
| `@electron/rebuild` | `3.7.2` | Forge development/build |
| `@electron/node-gyp` | `10.2.0-electron.1` | tranzitivni build alat |
| `webpack-dev-server` | `4.15.2` | development-only renderer server |
| `@parcel/watcher` | `2.6.0` | tranzitivni development paket |
| `tar` | `6.2.1` | tranzitivni build alat; audit nalaz |

Nijesu direktno dodati `webpack-cli`, Vite, maker, Electron Fuses, updater, telemetry niti druga desktop/runtime integracija. Vite koji postoji tranzitivno kroz postojeći Vitest lanac nije B0 direktna dependency i nije dio pakovanog runtime-a.

## 4. Source i konfiguracione korekcije

Završni B0 obuhvata sljedeće korekcije:

1. uvedeni su minimalni main, preload, renderer, shared-contract i sender-validation moduli;
2. `BrowserWindow` koristi `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true` i `allowRunningInsecureContent: false`;
3. uvedeni su single-instance lock, fokusiranje postojećeg prozora i clean shutdown;
4. `setWindowOpenHandler` odbija nova okna, a navigation/redirect provjere zadržavaju exact URL equality;
5. preload izlaže samo `window.sdj.system.getAppInfo()` i fiksni `system:get-app-info` channel;
6. sender validator provjerava isti glavni `webContents`, isti ID, glavni frame i exact renderer URL;
7. `global.d.ts` je zadržan kao ambient declaration bez top-level import/export;
8. Forge Webpack `devContentSecurityPolicy` i `devServer` postavljeni su na pravilni plugin-config nivo;
9. `ts-loader` koristi apsolutni `tsconfig.desktop.json`, `transpileOnly: true` i jedini compiler override `noEmit: false`, dok dva zasebna `tsc --noEmit` gate-a rade punu provjeru tipova;
10. ESLint globalno ignoriše samo root `.webpack/**` i postojeći `out/**`, bez ignorisanja desktop source-a ili konfiguracije;
11. dva namjerna CommonJS importa u smoke skripti imaju ciljane line-level ESLint komentare;
12. packaged renderer URL kanonizuje se preko `new URL(MAIN_WINDOW_WEBPACK_ENTRY).href` prije `loadURL`, IPC registracije i navigation poređenja;
13. `.gitignore` obuhvata lokalne Forge/Webpack output direktorijume i desktop privremene artefakte;
14. package scripts su prošireni samo sa `desktop:start`, `desktop:package` i `desktop:smoke`.

### 4.1 B0-specifični native rebuild izuzetak

Forge koristi:

```ts
rebuildConfig: {
  onlyModules: [],
}
```

Ovo je strogo B0-specifična odluka. Lokalni `@electron/rebuild` kod potvrđuje da prazan `onlyModules` niz ne bira nijedan modul za rebuild. Debug dokaz je pokazao skeniranje dependency grafa bez pokušaja rebuilda `@parcel/watcher` i bez stvarnog `node-gyp` poziva. Native fingerprint instaliranih modula ostao je nepromijenjen.

Ova odluka nije opšta produkcijska politika. Mora se ponovo razmotriti čim naredna faza uvede bilo koji stvarni native runtime modul. B0 packaged content ima nula `.node` fajlova.

## 5. CSP i sigurnosne granice

Development CSP dozvoljava samo resurse potrebne za Forge development tok; renderer dev server ostaje na `127.0.0.1`. Packaged CSP je stvarno očitan iz novog `app.asar`:

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'none';
object-src 'none';
frame-src 'none';
base-uri 'none';
form-action 'none';
```

Packaged CSP ne sadrži `unsafe-inline` ni `unsafe-eval`. Packaged procesi nijesu otvorili TCP listener i nijesu pokrenuli Next, Node server ili drugi child server.

## 6. URL canonicalization nalaz

Forge development entry je apsolutni `http:` URL i već je kanonski. Packaged injected entry je apsolutni `file:` URL, ali je prije korekcije imao Windows oblik sa dva slash znaka poslije `file:`. Electron je stvarni učitani URL kanonizovao u oblik sa tri slash znaka, zbog čega je exact sender validation odbijala legitiman packaged IPC poziv.

Korekcija je:

```ts
const expectedRendererUrl = new URL(MAIN_WINDOW_WEBPACK_ENTRY).href;
```

Dokaz:

| Varijanta | Redigovani format | Slash poslije `file:` | Rezultat |
|---|---|---:|---|
| Development | `http://localhost:3000/.../index.html` | nije primjenjivo | kanonska jednakost, IPC `ready` |
| Packaged prije korekcije | `file://C:\\...\\index.html` | 2 | sirova vrijednost nije jednaka kanonskoj |
| Packaged poslije korekcije | `file:///C:/.../.webpack/renderer/main_window/index.html` | 3 | exact equality, IPC `ready` |

Uspješan packaged IPC je runtime dokaz jednakosti jer neizmijenjeni validator provjerava i `event.senderFrame.url === expectedRendererUrl` i `webContents.getURL() === expectedRendererUrl` prije vraćanja AppInfo rezultata. Nije dodato trajno logovanje apsolutne putanje.

## 7. Development acceptance

| Provjera | Rezultat |
|---|---|
| main, preload i renderer Webpack emit | PASS |
| glavni prozor | PASS, `SDJ MIKE Desktop — B0` |
| AppInfo IPC | PASS, status `ready` |
| šest AppInfo vrijednosti | PASS |
| renderer sandbox | PASS |
| single-instance | PASS; sekundarni proces exit 0, isti primarni prozor |
| clean shutdown | PASS; bez zaostalog Electron procesa/listenera |
| process restart | PASS |

Development Forge server je build alat, ne packaged runtime arhitektura.

## 8. Packaged acceptance

Novi package je izgrađen poslije URL korekcije; prethodni paket nije korišćen kao dokaz.

| Provjera | Rezultat |
|---|---|
| Forge package | PASS |
| packaged prozor | PASS |
| packaged AppInfo IPC | PASS, status `ready` |
| svih šest AppInfo vrijednosti | PASS |
| packaged renderer sandbox | PASS |
| Next/Node/child server | nijedan |
| HTTP/TCP listener | nijedan |
| packaged single-instance | PASS |
| clean shutdown | PASS |
| restart | PASS |
| prvi start do prozora | 1.974 ms |
| restart do prozora | 736 ms |

Prikazane AppInfo vrijednosti bile su:

- application: `sdj-mike-v1`;
- application version: `1.0.0`;
- Electron: `43.2.0`;
- Node.js: `24.18.0`;
- Chromium: `150.0.7871.129`;
- platform: `win32`.

## 9. Sender-validation i negativni dokaz

Postojeći validator je izvršen kao read-only funkcijski runtime test bez kreiranja test fajla:

```text
TRUSTED=PASS
DESTROYED=REJECTED
WRONGSENDER=REJECTED
WRONGFRAME=REJECTED
WRONGFRAMEURL=REJECTED
WRONGWEBCONTENTSURL=REJECTED
```

Smoke provjera dodatno potvrđuje da preload izlaže samo odobreni fixed-channel API i da nema proizvoljan `ipcRenderer.send`, `sendSync`, `postMessage` ili renderer-supplied invoke channel.

Ovo nije posebno neprijateljski Electron `WebContents` acceptance test. Takav automatizovani test ostaje obavezan prije internog release-a.

## 10. Network dokaz

Packaged procesno vezani TCP nadzor trajao je 309 sekundi. Tokom svih uzoraka bila su aktivna četiri packaged app procesa.

Rezultat:

```text
UNIQUE_CONNECTIONS=0
```

Nije zabilježen listen, established niti drugi TCP zapis vezan za packaged process tree.

## 11. Portable package i removal dokaz

Packaged folder je kopiran van repozitorijuma u kontrolisani `C:\tmp` direktorijum:

- source fajlovi: 75;
- kopirani fajlovi: 75;
- EXE SHA-256 jednak originalu;
- ASAR SHA-256 jednak originalu;
- portable prozor se pokrenuo;
- AppInfo IPC je prikazao `ready` i svih šest vrijednosti;
- portable proces je normalno zatvoren;
- zatvoreni folder je uspješno premješten na novu arhivsku putanju bez brisanja;
- originalni `out/` package ostao je netaknut;
- nije ostao packaged proces.

## 12. Package veličina i sadržaj

Završni package:

- broj fajlova: 75;
- ukupna veličina: 364.356.369 bajtova, približno 347,48 MiB;
- executable: 225.613.824 bajta;
- `app.asar`: 200.988 bajtova;
- `app.asar` SHA-256: `EB6F9F2B38211FA55B9E08A6718D6CAD474115680AFB7414A104551ADD17FC92`;
- `app.asar.unpacked`: ne postoji;
- packaged `.node` fajlovi: 0;
- packaged source-map fajlovi: 0.

`app.asar` sadrži samo očekivane compiled main, preload i renderer bundle-ove, renderer HTML/licence i package metadata. Ne sadrži stvarne runtime fajlove za:

- Next ili `next-intl`;
- Electron Forge CLI ili rebuild lanac;
- `tar`;
- `node-gyp`;
- `@parcel/watcher`;
- Webpack/TypeScript/loadere;
- drugi web/build toolchain;
- SDJ workspace kod ili podatke.

`.webpack/` putanja unutar ASAR-a je naziv očekivanog compiled application outputa, ne prisustvo Webpack build alata.

## 13. Test i quality gate rezultati

Završna regresija:

| Komanda | Rezultat |
|---|---|
| `npm.cmd run desktop:smoke` | PASS |
| `npm.cmd run test` | PASS; 20 test fajlova, 606 testova |
| `npm.cmd run lint` | PASS, uključujući dokaz sa generisanim `.webpack/` i `out/` artefaktima |
| `npx tsc --noEmit --incremental false` | PASS |
| `npx tsc --noEmit --project tsconfig.desktop.json` | PASS |
| `git diff --check` | PASS |

## 14. Dependency audit i klasifikacija

Read-only `npm audit --json` je 2026-08-02 vratio exit 1 i sljedeći zbir:

| Severity | Broj |
|---|---:|
| info | 0 |
| low | 3 |
| moderate | 3 |
| high | 22 |
| critical | 1 |
| ukupno | 29 |

Klasifikacija:

| Nalaz / lanac | Stanje | Klasifikacija |
|---|---|---|
| `tar@6.2.1`, tranzitivno kroz Forge/rebuild/node-gyp | audit ga klasifikuje critical; koristi se u development/build lancu; B0 ne obrađuje nepouzdane arhive; nije u paketu | `POTREBNO RIJEŠITI PRIJE INTERNOG RELEASE-A`; `NIJE PRIMJENJIVO NA PACKAGED RUNTIME` |
| Forge/rebuild/node-gyp, `cacache`, `make-fetch-happen`, `brace-expansion`, Inquirer/tmp i webpack-dev-server lanci | development/build alati; nijesu u paketu | `BUILD-TOOL RIZIK — PRATITI`; remediation prije internog release-a |
| direktni `next@16.2.11` lanac preko auditovanih `postcss@8.4.31` i `sharp@0.34.5` | relevantan postojećoj Next V1 aplikaciji; Next nije u B0 paketu | `POTREBNO RIJEŠITI PRIJE INTERNOG RELEASE-A`; nije B0 packaged-runtime blocker |

Audit nije pronašao dokaz da navedeni build/web lanci ulaze u B0 pakovani runtime. Zbog toga nijesu klasifikovani kao B0 blocker, ali se ne smiju ignorisati prije internog release-a. `npm audit fix`, `npm audit fix --force`, overrides i ručne dependency promjene nijesu korišćeni. Auditov predlog uključuje potencijalno breaking ili nelogične downgrade putanje i ne smije se automatski primijeniti.

## 15. Ručni Windows restart acceptance

Ova provjera nije izvršena. Korisnik treba da uradi:

1. potpuno zatvoriti sve B0 procese;
2. restartovati Windows;
3. otvoriti posljednji pakovani B0 folder;
4. dvokliknuti executable;
5. potvrditi da se prikazuje jedan prozor;
6. potvrditi `IPC status: ready`;
7. potvrditi svih šest AppInfo vrijednosti;
8. ponovo dvokliknuti executable i potvrditi da se ne otvara drugi prozor;
9. zatvoriti aplikaciju;
10. u Task Manageru potvrditi da nema zaostalog procesa.

Do korisničke potvrde status ostaje `GO UZ USLOVE — ČEKA RUČNI WINDOWS RESTART`.

## 16. Rollback

Ako B0 treba povući:

1. potpuno zatvoriti sve development i packaged Electron procese;
2. koristiti `git revert <WP-0C-B0-commit>` radi eksplicitnog i auditabilnog povratka; ne koristiti `git reset --hard`;
3. ponovo uskladiti instalirane dependencies sa vraćenim `package-lock.json` preko kontrolisanog `npm ci` postupka;
4. lokalne ignorisane `.webpack/` i `out/` artefakte tretirati kao regenerabilne build izlaze i uklanjati ili arhivirati samo uz zasebno odobrenje;
5. potvrditi `git status --short`, `npm.cmd run test`, lint i obje TypeScript provjere;
6. ne dirati SDJ/OneDrive workspace ili korisničke podatke tokom rollbacka.

Rollback B0 commita ne smije obuhvatiti druge Phase 0 ili V1 commitove.

## 17. Zaključak

Electron Forge + Webpack B0 šasija je tehnički dokazana za development, packaging, IPC, exact sender validation, single-instance, lifecycle, portable execution i odsustvo packaged server/network/build-tool sadržaja. Status nije bezuslovni GO zbog neizvršenog Windows reboot acceptance-a, neizvršenog hostile-`WebContents` testa i neriješenih dependency audit nalaza.

**Konačni status ovog dokumenta:** `GO UZ USLOVE — ČEKA RUČNI WINDOWS RESTART`.
