# Codex Step 1D — Tasks, Court Calendar and Today

## Cilj

Implementiraj strukturisane zadatke, sudske događaje, Master prikaze i dinamički Today.

## Implementirati

- task record CRUD;
- globalni Tasks ekran;
- Matter tasks tab;
- `Sledeći korak` inline update;
- task index;
- court event CRUD;
- Matter Sud tab;
- Master Sudski kalendar;
- filtere 7/15/30 dana;
- court-events index;
- deduplikaciju;
- Today objedinjenu agendu;
- dinamičku `Zadaci za danas / ove nedelje` logiku;
- predmete bez sledećeg koraka;
- workload osnovni pregled i objašnjiv skor.

## Strogo pravilo

Nema automatskog prepoznavanja zapisnika u ovoj fazi. Ručni unos i potvrda moraju biti potpuno funkcionalni.

## QA

- događaj ulazi u Matter i Master prikaz bez dupliranja;
- izmena termina;
- completed/rescheduled/cancelled;
- probijeni rok;
- prazno stanje;
- time zone Europe/Podgorica;
- lint/build/browser QA.
