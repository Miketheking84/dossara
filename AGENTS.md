<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## DOSSARA Project Rules

- Formalni kontrolni akt projekta je: `docs/dossara/decision-alignment-register-v1.2.md`
- Rad se nastavlja u postojećem repozitorijumu.
- Dozvoljeni testni workspace je isključivo: `C:\SDJ_TEST\SDJ_LEGAL_TEST\`
- Stvarni SDJ i OneDrive workspace su zabranjeni dok naručilac izričito ne odobri drugačije.
- Scope se ne proširuje bez izričite odluke naručioca.
- Codex prije izmjena navodi plan i tačan spisak dozvoljenih fajlova.
- Poslije izmjena prikazuje kompletan diff.
- Codex ne pravi commit niti push bez odluke naručioca.
- Codex ne uvodi AI API niti spoljne mrežne pozive.
- Node filesystem kod mora ostati server-only.
- Nijedan autoritativni podatak ne smije postojati samo u budućem SQLite indeksu.
- Ručne izmjene fajlova ne smiju biti tiho prepisane.
- Kada je zahtjev nejasan ili krši Registar, Codex se zaustavlja i postavlja pitanje.
- Produkcijska implementacija faza 1–6 ne počinje prije prihvatanja Faze 0.
- Do tada su dozvoljeni samo audit, dokumentacija i izolovani tehnički spike-ovi koji se ne spajaju automatski u produkcionu granu.
