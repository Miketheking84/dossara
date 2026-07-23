# Legal Intake i email upiti

## 1. Svrha

Legalni upit iz emaila ili dokumenta treba pretvoriti u kontrolisani Draft Intake, ne u automatski predmet.

## 2. V1 ulazi

- nalepiti tekst emaila;
- uvesti `.eml` kada parser bude stabilan;
- ručno izabrati priloge;
- sačuvati email/priloge u `00 INBOX`.

Outlook mailbox monitoring ne ulazi u V1.

## 3. Intake struktura

```text
00 INBOX/
└── INTAKE_YYYY_NNNNNN/
    ├── original-message.eml ili message.md
    ├── attachments/
    ├── intake-review.md
    └── extraction-result.json
```

## 4. Prepoznavanje klijenta

Redosled signala:

1. tačna email adresa kontakta;
2. Matter ID ili poslovni broj;
3. email domen;
4. naziv firme/PIB/matični broj;
5. naziv predmeta ili druge strane.

Kod nejasnog podudaranja korisnik bira klijenta.

## 5. Extraction polja

- pošiljalac/primaoci;
- mogući klijent;
- moguće povezivanje sa postojećim predmetom;
- kratak opis zahteva;
- oblast prava;
- očekivani output;
- druga strana;
- sud/organ i poslovni broj;
- izričiti rokovi;
- prilozi;
- nedostajući dokumenti;
- predloženi sledeći korak;
- prioritet;
- predloženo zaduženje.

## 6. Conflict Check Lite

Pretražuje lokalne metapodatke:

- sadašnje i bivše klijente;
- protivne strane;
- povezana društva/lica;
- kontakte;
- alternativne nazive.

Rezultat je signal za pregled, ne konačni pravni zaključak.

## 7. Smart Intake Lite

Bez API-ja:

```text
tekst emaila
→ generiši extraction prompt
→ ručni ChatGPT/Claude
→ nalepi strukturisani JSON
→ validacija
→ Draft Intake
→ korisnička potvrda
```

## 8. Rezultati

- Poveži sa postojećim predmetom;
- Pripremi novi predmet;
- Zatraži dodatne podatke;
- Odbaci/odloži.

Sistem ništa ne kreira automatski bez potvrde.
