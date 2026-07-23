# Pravne promene

## 1. Svrha

Modul nije generički news feed. On pretvara relevantnu pravnu promenu u konkretnu akciju prema klijentu ili predmetu.

## 2. Naziv

UI naziv: `Pravne promene`.

## 3. Polja

- Legal Update ID;
- naziv;
- jurisdikcija;
- oblast prava;
- status;
- datum objave;
- datum stupanja na snagu;
- datum početka primene;
- zvanični izvor;
- kratak pregled;
- praktična posledica;
- relevantni klijenti;
- relevantni predmeti;
- potrebna radnja;
- status praćenja.

## 4. Statusi propisa

```text
DRAFT
PUBLIC_CONSULTATION
PROPOSAL
ADOPTED
PUBLISHED
IN_FORCE
APPLICABLE
ARCHIVED
```

UI mora jasno razlikovati nacrt od važećeg propisa.

## 5. V1 unos

- ručni unos;
- import strukturisanog Monday Brief Markdowna;
- dodavanje zvaničnog izvora;
- povezivanje sa klijentima;
- kreiranje zadatka ili client alert nacrta.

## 6. Today prikaz

Prikazuju se samo promene:

- visokog prioriteta;
- sa konkretnom akcijom;
- koje zahtevaju pregled.

## 7. V1.1/V2

- kontrolisano praćenje zvaničnih izvora;
- regulatorni konektori;
- automatski relevance predlog;
- client alert workflow;
- audit izvora.
