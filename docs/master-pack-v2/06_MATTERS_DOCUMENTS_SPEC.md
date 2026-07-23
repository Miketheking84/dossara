# Predmeti i dokumenti

## Matter Cockpit

Matter Cockpit mora za nekoliko sekundi da odgovori:

- šta je predmet;
- šta je trenutno stanje;
- šta je sledeće;
- koji je rok;
- od koga se nešto čeka;
- koje je sledeće ročište;
- koji je očekivani output;
- koji je finalni dokument.

## command-center.md dodatna polja

```text
Matter ID:
Schema version:
Storage status:
Migration status:
Original source:
Poslednje ažuriranje:
```

## Dokumenti

Aplikacija prikazuje metapodatke i otvara originalne fajlove. Ne kopira dokumente u internu bazu.

Minimalni prikaz:

- naziv;
- folder;
- ekstenzija/tip;
- veličina;
- datum izmene;
- važan status kada je potreban.

## Statusi važnih dokumenata

```text
Novo
Pregledano
Radna verzija
Čeka odobrenje
Finalno
Poslato
Podneto
Arhivirano
```

Status nije obavezan za svaki tehnički ili pomoćni fajl.

## Finalni dokument

`Finalni dokument` u Command Center-u je eksplicitna putanja ili relativni link prema dokumentu u `03 FINALNO`.

## Otvaranje foldera

Aplikacija mora omogućiti:

- Open Matter Folder;
- Open 01 ULAZ;
- Open 02 RADNO;
- Open 03 FINALNO;
- Open 04 AI.
