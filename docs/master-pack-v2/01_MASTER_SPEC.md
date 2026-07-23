# SDJ MIKE V1 — Master Spec

## 1. Svrha

SDJ MIKE V1 je lokalna, file-first i matter-centric aplikacija za svakodnevni rad advokatske kancelarije.

Sistem mora da omogući da advokat brzo:

- vidi šta danas zahteva pažnju;
- pronađe klijenta i predmet;
- otvori odgovarajući folder i dokument;
- evidentira sledeći korak, zadatak, rok ili ročište;
- obradi novi legalni upit;
- pripremi email ili AI prompt;
- kontroliše AI rezultat;
- prati relevantne pravne promene;
- nastavi rad bez aplikacije jer su važni podaci sačuvani u folderima i Markdown fajlovima.

## 2. Šta V1 nije

V1 nije:

- autonomna AI platforma;
- RAG sistem;
- document management cloud;
- zamena za Word, Outlook ili Windows Explorer;
- sistem koji sam potvrđuje rokove ili konflikte;
- billing ili računovodstveni sistem;
- klijentski portal.

## 3. Tehnička ograničenja Simple Core-a

V1 ne koristi:

- OpenAI API;
- Claude API;
- Supabase;
- AnythingLLM;
- eksterni cloud storage;
- automatski upload dokumenata;
- OCR u osnovnoj verziji;
- Word add-in;
- Outlook/Graph integraciju;
- MCP implementaciju.

Dozvoljeni su samo budući placeholderi bez komunikacione logike:

```text
src/integrations/chatgpt.placeholder.ts
src/integrations/claude.placeholder.ts
src/integrations/future-mcp.placeholder.ts
```

## 4. Osnovna poslovna pravila

1. Svaki aktivni predmet mora imati jedan glavni `Sledeći korak`.
2. Predmet bez sledećeg koraka mora biti vidljiv na Today ekranu.
3. Sudski događaj pripada konkretnom predmetu; Master kalendar je izvedeni pregled.
4. AI rezultat nije finalni pravni output dok ga advokat ne pregleda.
5. Sistem može da predloži klijenta, predmet, konflikt, rok ili zaduženje, ali korisnik potvrđuje.
6. Ako dokument nema izričito buduće ročište ili rok, kalendarski događaj se ne kreira.
7. Migracija je copy-first; originalni izvor se ne menja.
8. Brisanje u aplikaciji prvo znači premeštanje u recoverable Trash.
9. Indeksi nisu izvor istine i mogu se ponovo izgraditi.
10. UI ne prikazuje prazne ili izmišljene kartice radi vizuelnog popunjavanja prostora.

## 5. Glavne funkcionalne celine

```text
RAD
- Danas
- Novi upiti
- Zadaci
- Sudski kalendar

BAZA
- Klijenti
- Predmeti

ALATI
- AI rad
- Pravne promene

SISTEM
- Migracija
- Podešavanja
```

## 6. Primarni korisnički tokovi

### Dnevni rad

```text
Danas
→ obaveza
→ Matter Cockpit
→ dokument / zadatak / email / AI rad
→ pregled rezultata
→ ažuriranje sledećeg koraka
```

### Novi legalni upit

```text
Email ili dokument
→ Draft Intake
→ prepoznavanje klijenta
→ Conflict Check Lite
→ postojeći ili novi predmet
→ korisnička potvrda
→ početni zadaci i odgovor
```

### Sudski dokument

```text
Zapisnik / poziv / rešenje
→ povezivanje sa predmetom
→ predlog događaja
→ korisnička potvrda
→ predmetni događaj
→ Master sudski kalendar
```

### Pravna promena

```text
Zvanični izvor / Monday Brief
→ strukturisana promena
→ relevantni klijenti
→ zadatak ili client alert
→ praćenje izvršenja
```

## 7. Merilo uspeha V1

V1 je uspešna kada korisnik za manje od 60 sekundi može da:

- otvori predmet;
- vidi sledeći korak i rok;
- otvori relevantan folder ili dokument;
- kreira zadatak;
- generiše i sačuva prompt;
- pripremi email nacrt;
- potvrdi ročište ili rok;
- obradi novi upit;
- nastavi rad i kroz Explorer bez gubitka podataka.
