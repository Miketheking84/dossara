# Zadaci i To-Do

## 1. Dva nivoa rada

### Sledeći korak

Svaki aktivni predmet ima jednu glavnu sledeću radnju u `command-center.md`.

### Pojedinačni zadaci

Predmet može imati više task zapisa u `00 CONTROL/tasks/`.

## 2. Task polja

- Task ID;
- Matter ID;
- naziv;
- status;
- prioritet;
- rok i opciono vreme;
- odgovorna osoba;
- čeka se od;
- povezani dokument;
- povezani court event;
- napomena;
- datum završetka;
- AI work veza, opciono.

## 3. Statusi

```text
NEW
IN_PROGRESS
WAITING
COMPLETED
CANCELLED
```

## 4. Globalni ekran

Filteri:

- Moji;
- Danas;
- Ove nedelje;
- Probijeni;
- Čeka se;
- Delegirani;
- Završeni.

## 5. Today logika

Ako postoje zadaci danas: `Zadaci za danas`.

Ako nema zadataka danas, ali postoje otvoreni zadaci u narednih sedam dana: `Zadaci ove nedelje`.

Ako nema zadataka: kratko prazno stanje i `Novi zadatak`.

Probijeni zadaci uvek imaju prioritet.

## 6. Sudski događaj i zadaci

Potvrđeno ročište može da ponudi checklistu zadataka, ali korisnik bira koje zadatke dodaje.

## 7. Workload

V1 može prikazati transparentan workload iz:

- otvorenih i probijenih zadataka;
- zadataka u narednih sedam dana;
- ročišta u narednih 15/30 dana;
- aktivnih predmeta i prioriteta;
- ručno unete procene rada.

Sistem prikazuje razlog predloga zaduženja. Korisnik potvrđuje.
