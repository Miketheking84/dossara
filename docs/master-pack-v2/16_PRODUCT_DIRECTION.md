# Product direction — od interne aplikacije do proizvoda

## 1. Prva svrha

Prva verzija se optimizuje za svakodnevni rad SDJ kancelarije. Ne projektuje se generički sistem za sve jurisdikcije pre nego što stvarni workflow bude dokazan.

## 2. Idealni prvi korisnik

- solo advokat ili kancelarija sa 2–15 ljudi;
- Windows, Word i Outlook;
- dokumenti u lokalnim ili OneDrive folderima;
- veliki broj postojećih predmeta;
- rokovi u kalendaru, tabelama ili rokovniku;
- povremena upotreba ChatGPT-a/Claude-a;
- potreba za kontrolom podataka i migracijom.

## 3. Diferencijacija

SDJ MIKE se ne pozicionira kao još jedna evidencija predmeta, već kao:

> File-first Legal Command Center koji organizuje postojeće foldere, kontroliše zadatke i sudske rokove i uvodi bezbedan AI workflow bez zaključavanja dokumenata u platformi.

Ključne razlike:

- dokumenti ostaju kod kancelarije;
- migracija je sastavni deo proizvoda;
- svaki AI rezultat ima status pregleda;
- svaki rok ima predmet i izvor;
- intake je kontrolisan, sa Conflict Check Lite;
- sistem radi i bez API-ja;
- svi važni podaci su portable.

## 4. Future product slojevi

### MIKE Local

- lokalni/OneDrive workspace;
- klijenti, predmeti, zadaci, rokovi;
- sudski kalendar;
- prompt workflowi;
- migracija i audit.

### MIKE Office

- timovi i zaduženja;
- prava pristupa;
- odobravanja;
- zajednički kalendar;
- backup i administracija.

### MIKE AI Control

- AI governance i workflow sloj za kancelarije koje već imaju drugi practice-management/DMS sistem.

## 5. Product-ready principi koji se uvode već sada

- stabilni ID-evi;
- `schemaVersion`;
- lokalizovani UI stringovi;
- storage adapter sloj;
- AI/integration adapteri;
- export svih metapodataka;
- jurisdiction konfiguracija;
- bez SDJ-specifičnih hardcoded pravila u domenskom kodu;
- odvojeni branding/tokeni;
- jasna audit pravila.

## 6. Šta se ne gradi pre internog pilota

- multitenant SaaS;
- naplata i licence;
- cloud korisnički nalozi;
- mobilna nativna aplikacija;
- client portal;
- automatski email i AI agenti;
- tarifa, fakturisanje i fiskalizacija;
- globalni jurisdiction engine.

## 7. Komercijalni gate

Pre prvog eksternog pilota potrebno je:

1. nekoliko meseci stabilne interne upotrebe;
2. dokumentovani incidenti i popravke;
3. pouzdana migracija;
4. backup/recovery plan;
5. neutralni branding i localization;
6. instalacioni paket i update mehanizam;
7. pilot sa 3–5 kancelarija;
8. merenje uštede vremena, propuštenih rokova i usvajanja workflowa.
