# UI i informaciona arhitektura

## 1. Dizajn princip

Interfejs treba da bude:

- jednostavan;
- profesionalan;
- tih i nenametljiv;
- action-first, ne AI-first;
- prilagođen radu na laptopu;
- vizuelno dosledan Windows/Office okruženju;
- bez nepotrebnih grafikona i kartica.

## 2. Stalni App Shell

### Levi sidebar

Sidebar je stalno vidljiv i može da se smanji na ikone.

```text
RAD
Danas
Novi upiti
Zadaci
Sudski kalendar

BAZA
Klijenti
Predmeti

ALATI
AI rad
Pravne promene

SISTEM
Migracija
Podešavanja
```

### Gornja traka

Sadrži samo:

- naslov trenutnog ekrana;
- globalnu metadata pretragu;
- dugme `+ Novo`;
- diskretan status workspacea ili greške.

## 3. Pravilo površina

### Nova stranica

Koristi se za:

- Client Profile;
- Matter Cockpit;
- obradu konkretnog intake-a;
- kreiranje novog predmeta;
- AI workflow;
- detalj pravne promene;
- migracioni wizard.

### Desni panel

Koristi se za:

- detalj zadatka;
- detalj sudskog događaja;
- kontakt;
- metapodatke dokumenta;
- brzu promenu statusa;
- potvrdu prepoznatog ročišta.

### Modal

Koristi se samo za kratke radnje:

- novi zadatak;
- unos jednog roka;
- izbor klijenta/predmeta;
- potvrdu arhiviranja;
- izbor prompt tipa.

## 4. Today ekran

Today ne duplira cele module. Prikazuje samo ono što zahteva pažnju.

### Obavezne sekcije

1. `Pažnja danas` — objedinjena agenda.
2. `Brze akcije`.
3. `Nedavno korišćeni predmeti`.
4. `Novi upiti koji čekaju odluku` — samo kada postoje.

### Dinamička agenda

Prioritet prikaza:

1. probijeni rokovi;
2. ročišta danas;
3. rokovi danas;
4. zadaci danas;
5. predmeti bez sledećeg koraka;
6. AI/intake stavke koje čekaju potvrdu.

Ako nema zadataka danas, naslov postaje `Obaveze ove nedelje`.

Ako nema otvorenih obaveza, prikazuje se sledeća buduća obaveza i kratko prazno stanje.

### Brze akcije

```text
Novi predmet
Novi zadatak
Unesi rok / ročište
Obradi novi upit
Pripremi email
Pokreni AI rad
```

## 5. Klijenti

Lista klijenata koristi tabelu, ne kartice.

Kolone:

- klijent;
- glavni kontakt;
- broj aktivnih predmeta;
- sledeći rok;
- poslednja aktivnost.

Client Profile tabovi:

```text
Pregled
Kontakti
Predmeti
Dokumenti klijenta
Komunikacija
Aktivnost
```

## 6. Predmeti

Lista predmeta:

- predmet;
- klijent;
- status;
- sledeći korak;
- rok;
- sledeće ročište;
- čeka se od.

Matter Cockpit tabovi:

```text
Pregled
Dokumenti
Zadaci i rokovi
Sud
Komunikacija
AI rad
Aktivnost
```

Na `Pregled` tabu ne prikazivati detaljne liste koje pripadaju drugim tabovima.

## 7. Vizuelni sistem

- sidebar: tamnoplavi;
- glavna površina: bela ili vrlo svetlosiva;
- glavno dugme: tamnoplavo;
- zlatna: samo logo, aktivni indikator i diskretan akcenat;
- crvena: probijeno/kritično/destruktivno;
- narandžasta: upozorenje;
- zelena: potvrđen uspeh;
- tipografija: Segoe UI ili sistemski font;
- red tabele: približno 44–48 px;
- razmak: sistem od 8 px;
- jedna dominantna primarna akcija po ekranu.

## 8. Strogo zabranjeno u dizajnu

- popunjavanje ekrana lažnim metrikama;
- prikaz slučajnog predmeta kao „ključne informacije“;
- dupliranje iste liste na Today i glavnom modulu;
- kartica za svaku funkciju;
- veliki AI chat na početnom ekranu;
- nefunkcionalna dugmad za buduće integracije;
- prikaz stavke kada nema podatka ili jasne svrhe.
