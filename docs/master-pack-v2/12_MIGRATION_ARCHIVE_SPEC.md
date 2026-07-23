# Migracija, arhiva i brisanje

## 1. Migracija je V1 funkcija

Veliki broj postojećih predmeta mora da se uvede postepeno, bez promene originala.

## 2. Migration Center koraci

```text
1 Izvor
2 Scan
3 Mapiranje
4 Preview
5 Copy
6 Verify
7 Rezultat
```

## 3. Copy-first pravilo

- izvor je read-only;
- koristi se kopiranje, ne move;
- čuva se originalna struktura;
- migrirani sadržaj ide u `01 ULAZ/LEGACY_IMPORT/`;
- original se ne briše nakon uspeha bez posebne kasnije odluke.

## 4. Scan izveštaj

- broj foldera i fajlova;
- ukupna veličina;
- nedozvoljeni nazivi;
- duge putanje;
- greške pristupa;
- mogući duplikati;
- cloud-only/online-only upozorenja kada ih sistem može utvrditi.

## 5. Verifikacija

Obavezno:

- broj fajlova;
- broj bajtova;
- očuvanje relativne strukture;
- lista preskočenih fajlova;
- lista grešaka;
- migration manifest.

Hash verifikacija može biti opcionalna za posebno važne predmete.

## 6. Migracioni talasi

1. aktivni i hitni;
2. ostali aktivni;
3. referentni/precedent predmeti;
4. nedavno zatvoreni;
5. istorijska arhiva.

## 7. Arhiva

```text
05 ARHIVA/KLIJENT/PREDMET
```

Arhiviranje menja `Storage status: ARCHIVED`.

## 8. Recoverable Trash

```text
05 ARHIVA/_TRASH/YYYY-MM-DD_PREDMET
```

Moguć je Restore.

Trajno brisanje:

- samo iz `_TRASH`;
- puna putanja se prikazuje;
- korisnik upisuje naziv predmeta;
- path safety mora potvrditi destinaciju.
