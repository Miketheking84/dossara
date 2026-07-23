# Sudski kalendar

## 1. Izvor istine

Svaki događaj se čuva uz konkretan predmet u `00 CONTROL/court-events/`.

Master kalendar se automatski gradi iz svih potvrđenih događaja.

## 2. Vrste događaja

- ročište;
- pripremno ročište;
- glavni pretres;
- objava odluke;
- rok za podnesak;
- rok za žalbu;
- rok za odgovor;
- rok za predujam;
- rok za veštačenje;
- drugi sudski rok.

## 3. Polja

- Event ID;
- Matter ID;
- vrsta;
- datum;
- vreme;
- sud;
- poslovni broj;
- sudnica;
- status;
- izvorni dokument;
- stranica;
- način unosa;
- status potvrde.

## 4. Statusi

```text
PENDING_REVIEW
SCHEDULED
COMPLETED
RESCHEDULED
CANCELLED
DEADLINE_COMPLETED
OVERDUE
```

## 5. Globalni prikaz

- 7 dana;
- 15 dana;
- 30 dana;
- svi;
- ročišta;
- rokovi;
- probijeno;
- čeka potvrdu.

Preporučeno grupisanje:

```text
0–7 dana
8–15 dana
16–30 dana
```

## 6. Prepoznavanje zapisnika

V1 Core: ručni unos i potvrda.

V1.1:

- obrada searchable PDF-a;
- prepoznavanje zapisnika;
- predlog sledećeg ročišta;
- prikaz izvornog teksta;
- obavezna potvrda.

Lokalni OCR za image-only skenove je V1.1/V1+.

## 7. Strogo pravilo

Događaj se ne kreira kada:

- nema izričito navedenog budućeg datuma;
- datum će biti određen naknadno;
- stranke će biti naknadno obaveštene;
- pronađeni datum je samo datum dokumenta ili već održanog ročišta;
- značenje datuma nije dovoljno jasno.

Dokument se tada evidentira, ali kalendar ostaje nepromenjen.

## 8. Deduplikacija

Koristiti najmanje:

- Matter ID;
- poslovni broj;
- vrstu;
- datum;
- vreme;
- sud.
