# SDJ MIKE — Codex Project Rules

1. File-first: folderi i Markdown su izvor istine.
2. Nikada ne uvoditi bazu, API, OCR ili cloud servis bez eksplicitnog odobrenja faze.
3. Nikada ne slati dokumente eksternom servisu.
4. UI ne sme da direktno koristi Node `fs`; file operacije idu kroz server-side servisni sloj.
5. Svaka write/move/delete operacija mora imati path-safety proveru.
6. Koristiti atomsko pisanje i rollback gde je moguće.
7. Stabilni ID i schemaVersion su obavezni.
8. Indeksi moraju biti rebuildable.
9. Ne dodavati vidljivu funkciju koja nije implementirana.
10. Ne izmišljati podatke, metrike, rokove ili UI kartice.
11. Human confirmation je obavezna za konflikte, rokove, ročišta, finalne outpute i destruktivne radnje.
12. AI output je draft dok advokat ne odobri.
13. Pre izmene inspect repo i napiši plan.
14. Posle izmene pokreni lint/build/test i opiši sve izmene.
15. Ne commitovati bez korisničke provere.
