# AI rad, priprema emaila i komunikacija

## 1. AI je vezan za posao

AI workflow počinje iz:

- predmeta;
- dokumenta;
- zadatka;
- sudskog događaja;
- intake-a;
- pravne promene.

Ne koristi se prazan generički chat kao centralni UI.

## 2. V1 workflowi

- Intake Agent;
- Contract Agent;
- Litigation Agent;
- Client Email Agent;
- Claude Review;
- Tabular Review Lite;
- priprema za ročište;
- analiza predmeta;
- priprema podneska.

Tehnički naziv: `Prompt Workflows`, ne autonomni agenti.

## 3. Koraci

1. izbor posla;
2. predmet i dokumenti;
3. dodatni kontekst i očekivani output;
4. pregled prompta;
5. copy/save/open ChatGPT ili Claude;
6. opcioni unos AI rezultata;
7. advokatski pregled;
8. finalni output.

## 4. Statusi

```text
PROMPT_PREPARED
COPIED_TO_TOOL
RESULT_ADDED
PENDING_REVIEW
REVIEWED
ACCEPTED
REJECTED
```

## 5. AI oznake

AI rezultat mora biti jasno označen:

```text
AI NACRT — NIJE ODOBRENO
```

Finalni dokument se ne čuva automatski u `03 FINALNO`.

## 6. Priprema emaila

Vrste:

- potvrda prijema;
- zahtev za dokumentaciju;
- update klijentu;
- podsetnik;
- odgovor drugoj strani;
- slanje nacrta;
- obaveštenje o ročištu;
- izveštaj nakon ročišta;
- interni email.

Rezultat sadrži:

- primalac;
- CC;
- naslov;
- telo;
- predložene priloge;
- napomenu pre slanja.

V1 akcije:

- Copy subject;
- Copy body;
- Copy all;
- Save draft;
- Open Outlook;
- Mark as sent.

`Mark as sent` je ručna evidencija, ne dokaz automatskog slanja.

## 7. Čuvanje

Promptovi i AI rezultati:

```text
04 AI/YYYY-MM-DD_AIWORK_TYPE.md
```

Odobreni email nacrti:

```text
02 RADNO/KORESPONDENCIJA/
```

Finalizovana komunikacija:

```text
03 FINALNO/KORESPONDENCIJA/
```
