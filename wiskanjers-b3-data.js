window.WIKA_B3 = {
  "3": {
    "number": 3,
    "title": "Optellen tot 100: tientallen erbij",
    "pages": "11–13",
    "goal": "Tientallen zijn staven van tien. Eenheden zijn losse blokjes. Kijk goed wat erbij komt of weggaat.",
    "memory": "Tientallen zijn staven van tien. Eenheden zijn losse blokjes. Kijk goed wat erbij komt of weggaat.",
    "map": [
      [
        "1–4",
        "Van kleine som naar tientallen; T + T, TE + T en de termen wisselen."
      ],
      [
        "5",
        "Vraagstuk: bewerking en antwoordzin."
      ],
      [
        "6–8 · extra hulp",
        "Tientallen en eenheden herkennen, gelijke voorstellingen verbinden en MAB gebruiken."
      ],
      [
        "9–10 · uitdaging",
        "Ontbrekende getallen en sommen vergelijken."
      ]
    ],
    "check": "Laat één nieuwe oefening zonder hulp oplossen. Kan het kind uitleggen wat het deed en de bewerking noteren? Geef zo nodig nog een oefening met materiaal.",
    "hint": "Leg het eerste getal. Kijk wat erbij of eraf moet. Schrijf je berekening op de lijnen.",
    "guide": "Laat kinderen eerst voorspellen: wordt het meer of minder? Handel met het MAB-materiaal en laat elke stap verwoorden. Noteer samen, vóór je het voorbeeldantwoord opent.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "6 + 2 = …",
        "type": "calc",
        "ref": "",
        "a": 6,
        "b": 2,
        "op": "+"
      },
      {
        "kind": "Tientallen",
        "prompt": "Hoeveel is 7 T? Hoeveel is 7 T en 3 E?",
        "type": "text",
        "ref": "",
        "answer": "7 T = 70. 7 T en 3 E = 73."
      },
      {
        "kind": "Sprongen van tien",
        "prompt": "Vul de ontbrekende tientallen aan.",
        "type": "sequence",
        "ref": "",
        "seq": [
          20,
          30,
          null,
          50,
          null,
          null
        ],
        "values": [
          20,
          30,
          40,
          50,
          60,
          70
        ],
        "answer": "20, 30, 40, 50, 60, 70. Tel telkens 10 erbij."
      }
    ],
    "models": [
      {
        "kind": "T + T",
        "prompt": "Leg en reken: 30 + 50. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 30,
        "b": 50,
        "op": "+"
      },
      {
        "kind": "TE + T",
        "prompt": "Leg en reken: 46 + 20. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 46,
        "b": 20,
        "op": "+"
      },
      {
        "kind": "Wisselen",
        "prompt": "Leg en reken: 20 + 46. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 20,
        "b": 46,
        "op": "+"
      }
    ],
    "practice": [
      {
        "kind": "T + T",
        "prompt": "20 + 60 = …",
        "type": "calc",
        "ref": "p. 11 · oef. 1–2",
        "a": 20,
        "b": 60,
        "op": "+"
      },
      {
        "kind": "TE + T",
        "prompt": "37 + 40 = …",
        "type": "calc",
        "ref": "p. 12 · oef. 3–4",
        "a": 37,
        "b": 40,
        "op": "+"
      },
      {
        "kind": "T + TE",
        "prompt": "30 + 45 = …",
        "type": "calc",
        "ref": "p. 12 · oef. 3",
        "a": 30,
        "b": 45,
        "op": "+"
      },
      {
        "kind": "Kleine som → tientallen",
        "prompt": "Reken uit. Wat verandert als we met tientallen rekenen?",
        "type": "text",
        "ref": "p. 11 · oef. 1",
        "lines": "4 + 2 = …\n4 T + 2 T = …\n40 + 20 = …",
        "answer": "4 + 2 = 6\n4 T + 2 T = 6 T\n40 + 20 = 60"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Vermeerder 46 met 30. Schrijf de bewerking.",
        "type": "words",
        "ref": "p. 12",
        "a": 46,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "46 + … = 76. Vul aan.",
        "type": "text",
        "ref": "p. 13 · uitdaging",
        "answer": "Het ontbrekende getal is 30."
      },
      {
        "kind": "Vergelijken",
        "prompt": "Schrijf <, > of =. Leg uit.",
        "type": "text",
        "ref": "p. 13 · uitdaging",
        "lines": "30 + 40 … 50 + 20",
        "answer": "30 + 40 = 50 + 20: beide zijn 70."
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Lees, schrijf de bewerking en een antwoordzin.",
        "type": "text",
        "ref": "p. 12 · oef. 5",
        "story": "In de zaal staan 43 stoelen. We zetten er 20 bij. Hoeveel stoelen staan er nu?",
        "answer": "43 + 20 = 63\nEr staan nu 63 stoelen."
      },
      {
        "kind": "Gelijke voorstellingen",
        "prompt": "Geef wat samen hoort dezelfde kleur.",
        "type": "match",
        "ref": "p. 13 · extra hulp",
        "cards": [
          "20 + 30",
          "40",
          "3 T + 3 T",
          "50",
          "10 + 30",
          "60",
          "2 T + 3 T",
          "1 T + 3 T",
          "30 + 30"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "De drie families hebben als uitkomst 50, 40 en 60."
      },
      {
        "kind": "T + T",
        "prompt": "40 + 50 = …",
        "type": "calc",
        "ref": "p. 11 · oef. 1–2",
        "a": 40,
        "b": 50,
        "op": "+"
      },
      {
        "kind": "TE + T",
        "prompt": "54 + 30 = …",
        "type": "calc",
        "ref": "p. 12 · oef. 3–4",
        "a": 54,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "T + TE",
        "prompt": "20 + 67 = …",
        "type": "calc",
        "ref": "p. 12 · oef. 3",
        "a": 20,
        "b": 67,
        "op": "+"
      },
      {
        "kind": "Kleine som → tientallen",
        "prompt": "Reken uit. Wat verandert als we met tientallen rekenen?",
        "type": "text",
        "ref": "p. 11 · oef. 1",
        "lines": "4 + 2 = …\n4 T + 2 T = …\n40 + 20 = …",
        "answer": "4 + 2 = 6\n4 T + 2 T = 6 T\n40 + 20 = 60"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Vermeerder 46 met 30. Schrijf de bewerking.",
        "type": "words",
        "ref": "p. 12",
        "a": 46,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "46 + … = 76. Vul aan.",
        "type": "text",
        "ref": "p. 13 · uitdaging",
        "answer": "Het ontbrekende getal is 30."
      },
      {
        "kind": "Vergelijken",
        "prompt": "Schrijf <, > of =. Leg uit.",
        "type": "text",
        "ref": "p. 13 · uitdaging",
        "lines": "30 + 40 … 50 + 20",
        "answer": "30 + 40 = 50 + 20: beide zijn 70."
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Lees, schrijf de bewerking en een antwoordzin.",
        "type": "text",
        "ref": "p. 12 · oef. 5",
        "story": "In de zaal staan 43 stoelen. We zetten er 20 bij. Hoeveel stoelen staan er nu?",
        "answer": "43 + 20 = 63\nEr staan nu 63 stoelen."
      },
      {
        "kind": "Gelijke voorstellingen",
        "prompt": "Geef wat samen hoort dezelfde kleur.",
        "type": "match",
        "ref": "p. 13 · extra hulp",
        "cards": [
          "20 + 30",
          "40",
          "3 T + 3 T",
          "50",
          "10 + 30",
          "60",
          "2 T + 3 T",
          "1 T + 3 T",
          "30 + 30"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "De drie families hebben als uitkomst 50, 40 en 60."
      },
      {
        "kind": "T + T",
        "prompt": "30 + 30 = …",
        "type": "calc",
        "ref": "p. 11 · oef. 1–2",
        "a": 30,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "TE + T",
        "prompt": "26 + 60 = …",
        "type": "calc",
        "ref": "p. 12 · oef. 3–4",
        "a": 26,
        "b": 60,
        "op": "+"
      },
      {
        "kind": "T + TE",
        "prompt": "50 + 28 = …",
        "type": "calc",
        "ref": "p. 12 · oef. 3",
        "a": 50,
        "b": 28,
        "op": "+"
      },
      {
        "kind": "Kleine som → tientallen",
        "prompt": "Reken uit. Wat verandert als we met tientallen rekenen?",
        "type": "text",
        "ref": "p. 11 · oef. 1",
        "lines": "4 + 2 = …\n4 T + 2 T = …\n40 + 20 = …",
        "answer": "4 + 2 = 6\n4 T + 2 T = 6 T\n40 + 20 = 60"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Vermeerder 46 met 30. Schrijf de bewerking.",
        "type": "words",
        "ref": "p. 12",
        "a": 46,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "46 + … = 76. Vul aan.",
        "type": "text",
        "ref": "p. 13 · uitdaging",
        "answer": "Het ontbrekende getal is 30."
      },
      {
        "kind": "Vergelijken",
        "prompt": "Schrijf <, > of =. Leg uit.",
        "type": "text",
        "ref": "p. 13 · uitdaging",
        "lines": "30 + 40 … 50 + 20",
        "answer": "30 + 40 = 50 + 20: beide zijn 70."
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Lees, schrijf de bewerking en een antwoordzin.",
        "type": "text",
        "ref": "p. 12 · oef. 5",
        "story": "In de zaal staan 43 stoelen. We zetten er 20 bij. Hoeveel stoelen staan er nu?",
        "answer": "43 + 20 = 63\nEr staan nu 63 stoelen."
      },
      {
        "kind": "Gelijke voorstellingen",
        "prompt": "Geef wat samen hoort dezelfde kleur.",
        "type": "match",
        "ref": "p. 13 · extra hulp",
        "cards": [
          "20 + 30",
          "40",
          "3 T + 3 T",
          "50",
          "10 + 30",
          "60",
          "2 T + 3 T",
          "1 T + 3 T",
          "30 + 30"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "De drie families hebben als uitkomst 50, 40 en 60."
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "46 + 20 = …",
        "type": "calc",
        "ref": "",
        "a": 46,
        "b": 20,
        "op": "+"
      },
      {
        "kind": "Zelf proberen",
        "prompt": "20 + 46 = …",
        "type": "calc",
        "ref": "",
        "a": 20,
        "b": 46,
        "op": "+"
      }
    ]
  },
  "4": {
    "number": 4,
    "title": "Aftrekken tot 100: tientallen eraf",
    "pages": "14–16",
    "goal": "Tientallen zijn staven van tien. Eenheden zijn losse blokjes. Kijk goed wat erbij komt of weggaat.",
    "memory": "Tientallen zijn staven van tien. Eenheden zijn losse blokjes. Kijk goed wat erbij komt of weggaat.",
    "map": [
      [
        "1–4",
        "Van kleine aftrekking naar tientallen; T − T en TE − T."
      ],
      [
        "5",
        "Rekentaal omzetten naar een aftrekking."
      ],
      [
        "6–7 · extra hulp",
        "Gelijke voorstellingen verbinden en MAB gebruiken."
      ],
      [
        "8–9 · uitdaging",
        "Ontbrekende getallen en verschillen vergelijken."
      ]
    ],
    "check": "Laat één nieuwe oefening zonder hulp oplossen. Kan het kind uitleggen wat het deed en de bewerking noteren? Geef zo nodig nog een oefening met materiaal.",
    "hint": "Leg het eerste getal. Kijk wat erbij of eraf moet. Schrijf je berekening op de lijnen.",
    "guide": "Laat kinderen eerst voorspellen: wordt het meer of minder? Handel met het MAB-materiaal en laat elke stap verwoorden. Noteer samen, vóór je het voorbeeldantwoord opent.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "6 − 2 = …",
        "type": "calc",
        "ref": "",
        "a": 6,
        "b": 2,
        "op": "-"
      },
      {
        "kind": "Tientallen",
        "prompt": "Hoeveel is 7 T? Hoeveel is 7 T en 3 E?",
        "type": "text",
        "ref": "",
        "answer": "7 T = 70. 7 T en 3 E = 73."
      }
    ],
    "models": [
      {
        "kind": "T − T",
        "prompt": "Leg en reken: 90 − 30. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 90,
        "b": 30,
        "op": "-"
      },
      {
        "kind": "TE − T",
        "prompt": "Leg en reken: 78 − 40. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 78,
        "b": 40,
        "op": "-"
      }
    ],
    "practice": [
      {
        "kind": "T − T",
        "prompt": "80 − 30 = …",
        "type": "calc",
        "ref": "p. 14 · oef. 1–2",
        "a": 80,
        "b": 30,
        "op": "-"
      },
      {
        "kind": "TE − T",
        "prompt": "87 − 50 = …",
        "type": "calc",
        "ref": "p. 15 · oef. 3–4",
        "a": 87,
        "b": 50,
        "op": "-"
      },
      {
        "kind": "Kleine som → tientallen",
        "prompt": "Reken uit. Wat verandert als we met tientallen rekenen?",
        "type": "text",
        "ref": "p. 14 · oef. 1",
        "lines": "8 − 3 = …\n8 T − 3 T = …\n80 − 30 = …",
        "answer": "8 − 3 = 5\n8 T − 3 T = 5 T\n80 − 30 = 50"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Trek 30 af van 86. Schrijf de bewerking.",
        "type": "words",
        "ref": "p. 15",
        "a": 86,
        "b": 30,
        "op": "-"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "86 − … = 56. Vul aan.",
        "type": "text",
        "ref": "p. 16 · uitdaging",
        "answer": "Het ontbrekende getal is 30."
      },
      {
        "kind": "Vergelijken",
        "prompt": "Schrijf <, > of =. Leg uit.",
        "type": "text",
        "ref": "p. 16 · uitdaging",
        "lines": "90 − 40 … 80 − 20",
        "answer": "90 − 40 < 80 − 20: 50 < 60."
      },
      {
        "kind": "Gelijke voorstellingen",
        "prompt": "Geef wat samen hoort dezelfde kleur.",
        "type": "match",
        "ref": "p. 15 · extra hulp",
        "cards": [
          "80 − 30",
          "40",
          "9 T − 3 T",
          "50",
          "70 − 30",
          "60",
          "8 T − 3 T",
          "7 T − 3 T",
          "90 − 30"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "De drie families hebben als uitkomst 50, 40 en 60."
      },
      {
        "kind": "T − T",
        "prompt": "70 − 40 = …",
        "type": "calc",
        "ref": "p. 14 · oef. 1–2",
        "a": 70,
        "b": 40,
        "op": "-"
      },
      {
        "kind": "TE − T",
        "prompt": "69 − 20 = …",
        "type": "calc",
        "ref": "p. 15 · oef. 3–4",
        "a": 69,
        "b": 20,
        "op": "-"
      },
      {
        "kind": "Kleine som → tientallen",
        "prompt": "Reken uit. Wat verandert als we met tientallen rekenen?",
        "type": "text",
        "ref": "p. 14 · oef. 1",
        "lines": "8 − 3 = …\n8 T − 3 T = …\n80 − 30 = …",
        "answer": "8 − 3 = 5\n8 T − 3 T = 5 T\n80 − 30 = 50"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Trek 30 af van 86. Schrijf de bewerking.",
        "type": "words",
        "ref": "p. 15",
        "a": 86,
        "b": 30,
        "op": "-"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "86 − … = 56. Vul aan.",
        "type": "text",
        "ref": "p. 16 · uitdaging",
        "answer": "Het ontbrekende getal is 30."
      },
      {
        "kind": "Vergelijken",
        "prompt": "Schrijf <, > of =. Leg uit.",
        "type": "text",
        "ref": "p. 16 · uitdaging",
        "lines": "90 − 40 … 80 − 20",
        "answer": "90 − 40 < 80 − 20: 50 < 60."
      },
      {
        "kind": "Gelijke voorstellingen",
        "prompt": "Geef wat samen hoort dezelfde kleur.",
        "type": "match",
        "ref": "p. 15 · extra hulp",
        "cards": [
          "80 − 30",
          "40",
          "9 T − 3 T",
          "50",
          "70 − 30",
          "60",
          "8 T − 3 T",
          "7 T − 3 T",
          "90 − 30"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "De drie families hebben als uitkomst 50, 40 en 60."
      },
      {
        "kind": "T − T",
        "prompt": "100 − 60 = …",
        "type": "calc",
        "ref": "p. 14 · oef. 1–2",
        "a": 100,
        "b": 60,
        "op": "-"
      },
      {
        "kind": "TE − T",
        "prompt": "96 − 70 = …",
        "type": "calc",
        "ref": "p. 15 · oef. 3–4",
        "a": 96,
        "b": 70,
        "op": "-"
      },
      {
        "kind": "Kleine som → tientallen",
        "prompt": "Reken uit. Wat verandert als we met tientallen rekenen?",
        "type": "text",
        "ref": "p. 14 · oef. 1",
        "lines": "8 − 3 = …\n8 T − 3 T = …\n80 − 30 = …",
        "answer": "8 − 3 = 5\n8 T − 3 T = 5 T\n80 − 30 = 50"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Trek 30 af van 86. Schrijf de bewerking.",
        "type": "words",
        "ref": "p. 15",
        "a": 86,
        "b": 30,
        "op": "-"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "86 − … = 56. Vul aan.",
        "type": "text",
        "ref": "p. 16 · uitdaging",
        "answer": "Het ontbrekende getal is 30."
      },
      {
        "kind": "Vergelijken",
        "prompt": "Schrijf <, > of =. Leg uit.",
        "type": "text",
        "ref": "p. 16 · uitdaging",
        "lines": "90 − 40 … 80 − 20",
        "answer": "90 − 40 < 80 − 20: 50 < 60."
      },
      {
        "kind": "Gelijke voorstellingen",
        "prompt": "Geef wat samen hoort dezelfde kleur.",
        "type": "match",
        "ref": "p. 15 · extra hulp",
        "cards": [
          "80 − 30",
          "40",
          "9 T − 3 T",
          "50",
          "70 − 30",
          "60",
          "8 T − 3 T",
          "7 T − 3 T",
          "90 − 30"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "De drie families hebben als uitkomst 50, 40 en 60."
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "90 − 30 = …",
        "type": "calc",
        "ref": "",
        "a": 90,
        "b": 30,
        "op": "-"
      },
      {
        "kind": "Zelf proberen",
        "prompt": "78 − 40 = …",
        "type": "calc",
        "ref": "",
        "a": 78,
        "b": 40,
        "op": "-"
      }
    ]
  },
  "5": {
    "number": 5,
    "title": "Optellen en aftrekken met eenheden",
    "pages": "17–19",
    "goal": "Tientallen zijn staven van tien. Eenheden zijn losse blokjes. Kijk goed wat erbij komt of weggaat. Bij een vol tiental min eenheden wissel je eerst één tiental voor tien eenheden.",
    "memory": "Tientallen zijn staven van tien. Eenheden zijn losse blokjes. Kijk goed wat erbij komt of weggaat. Bij een vol tiental min eenheden wissel je eerst één tiental voor tien eenheden.",
    "map": [
      [
        "1–5",
        "De vier soorten door elkaar, ook aftrekken van een vol tiental."
      ],
      [
        "6",
        "Rekentaal: plus, verschil, verminderen en minder dan."
      ],
      [
        "7–8 · extra hulp",
        "Leg met MAB; wissel bij T − E één staaf voor tien blokjes."
      ],
      [
        "9 · uitdaging",
        "Ontbrekend startgetal of ontbrekende eenheden."
      ]
    ],
    "check": "Laat één nieuwe oefening zonder hulp oplossen. Kan het kind uitleggen wat het deed en de bewerking noteren? Geef zo nodig nog een oefening met materiaal.",
    "hint": "Leg het eerste getal. Kijk wat erbij of eraf moet. Schrijf je berekening op de lijnen.",
    "guide": "Laat kinderen eerst voorspellen: wordt het meer of minder? Handel met het MAB-materiaal en laat elke stap verwoorden. Noteer samen, vóór je het voorbeeldantwoord opent.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "6 + 2 = …",
        "type": "calc",
        "ref": "",
        "a": 6,
        "b": 2,
        "op": "+"
      },
      {
        "kind": "Tientallen",
        "prompt": "Hoeveel is 7 T? Hoeveel is 7 T en 3 E?",
        "type": "text",
        "ref": "",
        "answer": "7 T = 70. 7 T en 3 E = 73."
      },
      {
        "kind": "Van een tiental aftrekken",
        "prompt": "20 − 4 = …",
        "type": "calc",
        "ref": "",
        "a": 20,
        "b": 4,
        "op": "-",
        "answer": "20 − 4 = 16"
      }
    ],
    "models": [
      {
        "kind": "T + E",
        "prompt": "Leg en reken: 50 + 6. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 50,
        "b": 6,
        "op": "+"
      },
      {
        "kind": "TE + E",
        "prompt": "Leg en reken: 42 + 5. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 42,
        "b": 5,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "Leg en reken: 68 − 4. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 68,
        "b": 4,
        "op": "-"
      },
      {
        "kind": "T − E",
        "prompt": "Leg en reken: 70 − 3. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 70,
        "b": 3,
        "op": "-"
      }
    ],
    "practice": [
      {
        "kind": "T + E",
        "prompt": "30 + 8 = …",
        "type": "calc",
        "ref": "p. 17 · oef. 1",
        "a": 30,
        "b": 8,
        "op": "+"
      },
      {
        "kind": "TE + E",
        "prompt": "53 + 4 = …",
        "type": "calc",
        "ref": "p. 17 · oef. 2",
        "a": 53,
        "b": 4,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "89 − 6 = …",
        "type": "calc",
        "ref": "p. 18 · oef. 3",
        "a": 89,
        "b": 6,
        "op": "-"
      },
      {
        "kind": "T − E",
        "prompt": "60 − 4 = …",
        "type": "calc",
        "ref": "p. 18 · oef. 4–5",
        "a": 60,
        "b": 4,
        "op": "-"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Schrijf de bewerking: 4 minder dan 80.",
        "type": "text",
        "ref": "p. 18 · oef. 6",
        "answer": "80 − 4 = 76"
      },
      {
        "kind": "Wisselen bij optellen",
        "prompt": "Wat is een handige volgorde? Reken uit.",
        "type": "text",
        "ref": "p. 17 · oef. 1–2",
        "lines": "6 + 50 = …\n3 + 64 = …",
        "answer": "50 + 6 = 56\n64 + 3 = 67"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul de ontbrekende getallen in.",
        "type": "text",
        "ref": "p. 19 · oef. 9",
        "lines": "… − 5 = 65\n42 + … = 49",
        "answer": "70 − 5 = 65\n42 + 7 = 49"
      },
      {
        "kind": "T + E",
        "prompt": "60 + 7 = …",
        "type": "calc",
        "ref": "p. 17 · oef. 1",
        "a": 60,
        "b": 7,
        "op": "+"
      },
      {
        "kind": "TE + E",
        "prompt": "71 + 6 = …",
        "type": "calc",
        "ref": "p. 17 · oef. 2",
        "a": 71,
        "b": 6,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "57 − 4 = …",
        "type": "calc",
        "ref": "p. 18 · oef. 3",
        "a": 57,
        "b": 4,
        "op": "-"
      },
      {
        "kind": "T − E",
        "prompt": "90 − 7 = …",
        "type": "calc",
        "ref": "p. 18 · oef. 4–5",
        "a": 90,
        "b": 7,
        "op": "-"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Schrijf de bewerking: 4 minder dan 80.",
        "type": "text",
        "ref": "p. 18 · oef. 6",
        "answer": "80 − 4 = 76"
      },
      {
        "kind": "Wisselen bij optellen",
        "prompt": "Wat is een handige volgorde? Reken uit.",
        "type": "text",
        "ref": "p. 17 · oef. 1–2",
        "lines": "6 + 50 = …\n3 + 64 = …",
        "answer": "50 + 6 = 56\n64 + 3 = 67"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul de ontbrekende getallen in.",
        "type": "text",
        "ref": "p. 19 · oef. 9",
        "lines": "… − 5 = 65\n42 + … = 49",
        "answer": "70 − 5 = 65\n42 + 7 = 49"
      },
      {
        "kind": "T + E",
        "prompt": "80 + 5 = …",
        "type": "calc",
        "ref": "p. 17 · oef. 1",
        "a": 80,
        "b": 5,
        "op": "+"
      },
      {
        "kind": "TE + E",
        "prompt": "42 + 5 = …",
        "type": "calc",
        "ref": "p. 17 · oef. 2",
        "a": 42,
        "b": 5,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "76 − 5 = …",
        "type": "calc",
        "ref": "p. 18 · oef. 3",
        "a": 76,
        "b": 5,
        "op": "-"
      },
      {
        "kind": "T − E",
        "prompt": "100 − 2 = …",
        "type": "calc",
        "ref": "p. 18 · oef. 4–5",
        "a": 100,
        "b": 2,
        "op": "-"
      },
      {
        "kind": "Rekentaal",
        "prompt": "Schrijf de bewerking: 4 minder dan 80.",
        "type": "text",
        "ref": "p. 18 · oef. 6",
        "answer": "80 − 4 = 76"
      },
      {
        "kind": "Wisselen bij optellen",
        "prompt": "Wat is een handige volgorde? Reken uit.",
        "type": "text",
        "ref": "p. 17 · oef. 1–2",
        "lines": "6 + 50 = …\n3 + 64 = …",
        "answer": "50 + 6 = 56\n64 + 3 = 67"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul de ontbrekende getallen in.",
        "type": "text",
        "ref": "p. 19 · oef. 9",
        "lines": "… − 5 = 65\n42 + … = 49",
        "answer": "70 − 5 = 65\n42 + 7 = 49"
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "68 − 4 = …",
        "type": "calc",
        "ref": "",
        "a": 68,
        "b": 4,
        "op": "-"
      },
      {
        "kind": "Zelf proberen",
        "prompt": "70 − 3 = …",
        "type": "calc",
        "ref": "",
        "a": 70,
        "b": 3,
        "op": "-"
      }
    ]
  },
  "12": {
    "number": 12,
    "title": "Optellen zonder brug: TE + TE",
    "pages": "50–52",
    "goal": "Laat het eerste getal heel. Splits alleen het tweede getal in tientallen en eenheden. Reken eerst met de tientallen en dan met de eenheden.",
    "memory": "Laat het eerste getal heel. Splits alleen het tweede getal in tientallen en eenheden. Reken eerst met de tientallen en dan met de eenheden.",
    "map": [
      [
        "1",
        "MAB lezen en tussenstappen schrijven."
      ],
      [
        "2",
        "De optelling bij de getallenas schrijven."
      ],
      [
        "3–4",
        "Tussenstappen en som zelfstandig schrijven."
      ],
      [
        "5–6 · extra hulp",
        "MAB gebruiken en de juiste optelling bij de sprongen kiezen."
      ],
      [
        "7 · uitdaging",
        "Ontbrekende getallen zoeken."
      ]
    ],
    "check": "Laat één nieuwe oefening zonder hulp oplossen. Kan het kind uitleggen wat het deed en de bewerking noteren? Geef zo nodig nog een oefening met materiaal.",
    "hint": "Leg het eerste getal. Kijk wat erbij of eraf moet. Schrijf je berekening op de lijnen.",
    "guide": "Laat kinderen eerst voorspellen: wordt het meer of minder? Handel met het MAB-materiaal en laat elke stap verwoorden. Noteer samen, vóór je het voorbeeldantwoord opent.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "6 + 2 = …",
        "type": "calc",
        "ref": "",
        "a": 6,
        "b": 2,
        "op": "+"
      },
      {
        "kind": "Tientallen",
        "prompt": "Hoeveel is 7 T? Hoeveel is 7 T en 3 E?",
        "type": "text",
        "ref": "",
        "answer": "7 T = 70. 7 T en 3 E = 73."
      }
    ],
    "models": [
      {
        "kind": "Eerst tientallen",
        "prompt": "Leg en reken: 35 + 23. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 35,
        "b": 23,
        "op": "+"
      },
      {
        "kind": "Op de getallenas",
        "prompt": "Eerst de tientallen, dan de eenheden. Noteer samen de tussenstappen.",
        "type": "line",
        "ref": "",
        "a": 35,
        "b": 23,
        "op": "+"
      },
      {
        "kind": "Nog een voorbeeld",
        "prompt": "Leg en reken: 62 + 16. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 62,
        "b": 16,
        "op": "+"
      }
    ],
    "practice": [
      {
        "kind": "Tussenstappen",
        "prompt": "43 + 25 = …",
        "type": "steps",
        "ref": "p. 51 · oef. 3",
        "a": 43,
        "b": 25,
        "op": "+"
      },
      {
        "kind": "Zonder hulp",
        "prompt": "52 + 36 = …",
        "type": "steps",
        "ref": "p. 52 · oef. 4",
        "a": 52,
        "b": 36,
        "op": "+"
      },
      {
        "kind": "MAB lezen",
        "prompt": "Lees het MAB-materiaal. Schrijf de tussenstappen.",
        "type": "mabPair",
        "ref": "p. 50 · oef. 1",
        "a": 32,
        "b": 45,
        "op": "+",
        "answer": "32 + 45 = (32 + 40) + 5\n= 72 + 5\n= 77"
      },
      {
        "kind": "Getallenas lezen",
        "prompt": "Welke bewerking zie je? Schrijf ook de tussenstappen.",
        "type": "line",
        "ref": "p. 51 · oef. 2",
        "a": 32,
        "b": 45,
        "op": "+"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Zoek het ontbrekende getal.",
        "type": "text",
        "ref": "p. 52 · uitdaging",
        "lines": "35 + … = 68",
        "answer": "35 + 33 = 68"
      },
      {
        "kind": "Kies bij de sprongen",
        "prompt": "Welke bewerking hoort bij deze sprongen?",
        "type": "line",
        "ref": "p. 52 · oef. 6",
        "a": 35,
        "b": 23,
        "op": "+",
        "choices": [
          "35 + 23",
          "35 + 33",
          "35 + 13"
        ]
      },
      {
        "kind": "Tussenstappen",
        "prompt": "24 + 53 = …",
        "type": "steps",
        "ref": "p. 51 · oef. 3",
        "a": 24,
        "b": 53,
        "op": "+"
      },
      {
        "kind": "Zonder hulp",
        "prompt": "34 + 45 = …",
        "type": "steps",
        "ref": "p. 52 · oef. 4",
        "a": 34,
        "b": 45,
        "op": "+"
      },
      {
        "kind": "MAB lezen",
        "prompt": "Lees het MAB-materiaal. Schrijf de tussenstappen.",
        "type": "mabPair",
        "ref": "p. 50 · oef. 1",
        "a": 32,
        "b": 45,
        "op": "+",
        "answer": "32 + 45 = (32 + 40) + 5\n= 72 + 5\n= 77"
      },
      {
        "kind": "Getallenas lezen",
        "prompt": "Welke bewerking zie je? Schrijf ook de tussenstappen.",
        "type": "line",
        "ref": "p. 51 · oef. 2",
        "a": 32,
        "b": 45,
        "op": "+"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Zoek het ontbrekende getal.",
        "type": "text",
        "ref": "p. 52 · uitdaging",
        "lines": "35 + … = 68",
        "answer": "35 + 33 = 68"
      },
      {
        "kind": "Kies bij de sprongen",
        "prompt": "Welke bewerking hoort bij deze sprongen?",
        "type": "line",
        "ref": "p. 52 · oef. 6",
        "a": 35,
        "b": 23,
        "op": "+",
        "choices": [
          "35 + 23",
          "35 + 33",
          "35 + 13"
        ]
      },
      {
        "kind": "Tussenstappen",
        "prompt": "61 + 27 = …",
        "type": "steps",
        "ref": "p. 51 · oef. 3",
        "a": 61,
        "b": 27,
        "op": "+"
      },
      {
        "kind": "Zonder hulp",
        "prompt": "26 + 62 = …",
        "type": "steps",
        "ref": "p. 52 · oef. 4",
        "a": 26,
        "b": 62,
        "op": "+"
      },
      {
        "kind": "MAB lezen",
        "prompt": "Lees het MAB-materiaal. Schrijf de tussenstappen.",
        "type": "mabPair",
        "ref": "p. 50 · oef. 1",
        "a": 32,
        "b": 45,
        "op": "+",
        "answer": "32 + 45 = (32 + 40) + 5\n= 72 + 5\n= 77"
      },
      {
        "kind": "Getallenas lezen",
        "prompt": "Welke bewerking zie je? Schrijf ook de tussenstappen.",
        "type": "line",
        "ref": "p. 51 · oef. 2",
        "a": 32,
        "b": 45,
        "op": "+"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Zoek het ontbrekende getal.",
        "type": "text",
        "ref": "p. 52 · uitdaging",
        "lines": "35 + … = 68",
        "answer": "35 + 33 = 68"
      },
      {
        "kind": "Kies bij de sprongen",
        "prompt": "Welke bewerking hoort bij deze sprongen?",
        "type": "line",
        "ref": "p. 52 · oef. 6",
        "a": 35,
        "b": 23,
        "op": "+",
        "choices": [
          "35 + 23",
          "35 + 33",
          "35 + 13"
        ]
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "35 + 23 = …",
        "type": "steps",
        "ref": "",
        "a": 35,
        "b": 23,
        "op": "+"
      },
      {
        "kind": "Zelf proberen",
        "prompt": "62 + 16 = …",
        "type": "steps",
        "ref": "",
        "a": 62,
        "b": 16,
        "op": "+"
      }
    ]
  },
  "13": {
    "number": 13,
    "title": "Aftrekken zonder brug: TE − TE",
    "pages": "53–55",
    "goal": "Laat het eerste getal heel. Splits alleen het tweede getal in tientallen en eenheden. Reken eerst met de tientallen en dan met de eenheden.",
    "memory": "Laat het eerste getal heel. Splits alleen het tweede getal in tientallen en eenheden. Reken eerst met de tientallen en dan met de eenheden.",
    "map": [
      [
        "1",
        "MAB lezen en tientallen en eenheden wegnemen."
      ],
      [
        "2",
        "De aftrekking bij de getallenas schrijven."
      ],
      [
        "3–4",
        "Tussenstappen en verschil zelfstandig schrijven."
      ],
      [
        "5–6 · extra hulp",
        "MAB gebruiken en de aftrekking bij de sprongen kiezen."
      ],
      [
        "7 · uitdaging",
        "Meerdere aftrekkingen na elkaar uitvoeren."
      ]
    ],
    "check": "Laat één nieuwe oefening zonder hulp oplossen. Kan het kind uitleggen wat het deed en de bewerking noteren? Geef zo nodig nog een oefening met materiaal.",
    "hint": "Leg het eerste getal. Kijk wat erbij of eraf moet. Schrijf je berekening op de lijnen.",
    "guide": "Laat kinderen eerst voorspellen: wordt het meer of minder? Handel met het MAB-materiaal en laat elke stap verwoorden. Noteer samen, vóór je het voorbeeldantwoord opent.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "6 − 2 = …",
        "type": "calc",
        "ref": "",
        "a": 6,
        "b": 2,
        "op": "-"
      },
      {
        "kind": "Tientallen",
        "prompt": "Hoeveel is 7 T? Hoeveel is 7 T en 3 E?",
        "type": "text",
        "ref": "",
        "answer": "7 T = 70. 7 T en 3 E = 73."
      }
    ],
    "models": [
      {
        "kind": "Eerst tientallen",
        "prompt": "Leg en reken: 78 − 35. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 78,
        "b": 35,
        "op": "-"
      },
      {
        "kind": "Op de getallenas",
        "prompt": "Eerst de tientallen, dan de eenheden. Noteer samen de tussenstappen.",
        "type": "line",
        "ref": "",
        "a": 78,
        "b": 35,
        "op": "-"
      },
      {
        "kind": "Nog een voorbeeld",
        "prompt": "Leg en reken: 96 − 24. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 96,
        "b": 24,
        "op": "-"
      }
    ],
    "practice": [
      {
        "kind": "Tussenstappen",
        "prompt": "89 − 46 = …",
        "type": "steps",
        "ref": "p. 54 · oef. 3",
        "a": 89,
        "b": 46,
        "op": "-"
      },
      {
        "kind": "Zonder hulp",
        "prompt": "76 − 42 = …",
        "type": "steps",
        "ref": "p. 54 · oef. 4",
        "a": 76,
        "b": 42,
        "op": "-"
      },
      {
        "kind": "MAB lezen",
        "prompt": "Lees het MAB-materiaal. Schrijf de tussenstappen.",
        "type": "mab",
        "ref": "p. 53 · oef. 1",
        "a": 87,
        "b": 43,
        "op": "-",
        "answer": "87 - 43 = (87 - 40) - 3\n= 47 - 3\n= 44"
      },
      {
        "kind": "Getallenas lezen",
        "prompt": "Welke bewerking zie je? Schrijf ook de tussenstappen.",
        "type": "line",
        "ref": "p. 54 · oef. 2",
        "a": 87,
        "b": 43,
        "op": "-"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Zoek het ontbrekende getal.",
        "type": "text",
        "ref": "p. 55 · uitdaging",
        "lines": "… − 24 = 53",
        "answer": "77 − 24 = 53"
      },
      {
        "kind": "Kies bij de sprongen",
        "prompt": "Welke bewerking hoort bij deze sprongen?",
        "type": "line",
        "ref": "p. 55 · oef. 6",
        "a": 78,
        "b": 35,
        "op": "-",
        "choices": [
          "78 - 35",
          "78 - 45",
          "78 - 25"
        ]
      },
      {
        "kind": "Tussenstappen",
        "prompt": "67 − 25 = …",
        "type": "steps",
        "ref": "p. 54 · oef. 3",
        "a": 67,
        "b": 25,
        "op": "-"
      },
      {
        "kind": "Zonder hulp",
        "prompt": "59 − 36 = …",
        "type": "steps",
        "ref": "p. 54 · oef. 4",
        "a": 59,
        "b": 36,
        "op": "-"
      },
      {
        "kind": "MAB lezen",
        "prompt": "Lees het MAB-materiaal. Schrijf de tussenstappen.",
        "type": "mab",
        "ref": "p. 53 · oef. 1",
        "a": 87,
        "b": 43,
        "op": "-",
        "answer": "87 - 43 = (87 - 40) - 3\n= 47 - 3\n= 44"
      },
      {
        "kind": "Getallenas lezen",
        "prompt": "Welke bewerking zie je? Schrijf ook de tussenstappen.",
        "type": "line",
        "ref": "p. 54 · oef. 2",
        "a": 87,
        "b": 43,
        "op": "-"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Zoek het ontbrekende getal.",
        "type": "text",
        "ref": "p. 55 · uitdaging",
        "lines": "… − 24 = 53",
        "answer": "77 − 24 = 53"
      },
      {
        "kind": "Kies bij de sprongen",
        "prompt": "Welke bewerking hoort bij deze sprongen?",
        "type": "line",
        "ref": "p. 55 · oef. 6",
        "a": 78,
        "b": 35,
        "op": "-",
        "choices": [
          "78 - 35",
          "78 - 45",
          "78 - 25"
        ]
      },
      {
        "kind": "Tussenstappen",
        "prompt": "98 − 63 = …",
        "type": "steps",
        "ref": "p. 54 · oef. 3",
        "a": 98,
        "b": 63,
        "op": "-"
      },
      {
        "kind": "Zonder hulp",
        "prompt": "85 − 54 = …",
        "type": "steps",
        "ref": "p. 54 · oef. 4",
        "a": 85,
        "b": 54,
        "op": "-"
      },
      {
        "kind": "MAB lezen",
        "prompt": "Lees het MAB-materiaal. Schrijf de tussenstappen.",
        "type": "mab",
        "ref": "p. 53 · oef. 1",
        "a": 87,
        "b": 43,
        "op": "-",
        "answer": "87 - 43 = (87 - 40) - 3\n= 47 - 3\n= 44"
      },
      {
        "kind": "Getallenas lezen",
        "prompt": "Welke bewerking zie je? Schrijf ook de tussenstappen.",
        "type": "line",
        "ref": "p. 54 · oef. 2",
        "a": 87,
        "b": 43,
        "op": "-"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Zoek het ontbrekende getal.",
        "type": "text",
        "ref": "p. 55 · uitdaging",
        "lines": "… − 24 = 53",
        "answer": "77 − 24 = 53"
      },
      {
        "kind": "Kies bij de sprongen",
        "prompt": "Welke bewerking hoort bij deze sprongen?",
        "type": "line",
        "ref": "p. 55 · oef. 6",
        "a": 78,
        "b": 35,
        "op": "-",
        "choices": [
          "78 - 35",
          "78 - 45",
          "78 - 25"
        ]
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "78 − 35 = …",
        "type": "steps",
        "ref": "",
        "a": 78,
        "b": 35,
        "op": "-"
      },
      {
        "kind": "Zelf proberen",
        "prompt": "96 − 24 = …",
        "type": "steps",
        "ref": "",
        "a": 96,
        "b": 24,
        "op": "-"
      }
    ]
  },
  "14": {
    "number": 14,
    "title": "Optellen, aftrekken en omgekeerde bewerkingen",
    "pages": "56–59",
    "goal": "Laat het eerste getal heel. Splits alleen het tweede getal in tientallen en eenheden. Reken eerst met de tientallen en dan met de eenheden.",
    "memory": "Laat het eerste getal heel. Splits alleen het tweede getal in tientallen en eenheden. Reken eerst met de tientallen en dan met de eenheden.",
    "map": [
      [
        "1–5",
        "Alle tien rekentypes afwisselend; tussenstappen bij TE ± TE."
      ],
      [
        "6",
        "Twee optellingen en twee aftrekkingen bij drie getallen."
      ],
      [
        "7",
        "De omgekeerde bewerking schrijven."
      ],
      [
        "8–9 · extra hulp",
        "Rekenen tot 20 en families met kleine getallen."
      ],
      [
        "10 · uitdaging",
        "Ontbrekende getallen zoeken."
      ]
    ],
    "check": "Laat één nieuwe oefening zonder hulp oplossen. Kan het kind uitleggen wat het deed en de bewerking noteren? Geef zo nodig nog een oefening met materiaal.",
    "hint": "Leg het eerste getal. Kijk wat erbij of eraf moet. Schrijf je berekening op de lijnen.",
    "guide": "Laat kinderen eerst voorspellen: wordt het meer of minder? Handel met het MAB-materiaal en laat elke stap verwoorden. Noteer samen, vóór je het voorbeeldantwoord opent.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "6 + 2 = …",
        "type": "calc",
        "ref": "",
        "a": 6,
        "b": 2,
        "op": "+"
      },
      {
        "kind": "Tientallen",
        "prompt": "Hoeveel is 7 T? Hoeveel is 7 T en 3 E?",
        "type": "text",
        "ref": "",
        "answer": "7 T = 70. 7 T en 3 E = 73."
      }
    ],
    "models": [
      {
        "kind": "T + T",
        "prompt": "Leg en reken: 30 + 40. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 30,
        "b": 40,
        "op": "+"
      },
      {
        "kind": "T − T",
        "prompt": "Leg en reken: 80 − 50. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 80,
        "b": 50,
        "op": "-"
      },
      {
        "kind": "T + E",
        "prompt": "Leg en reken: 40 + 7. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 40,
        "b": 7,
        "op": "+"
      },
      {
        "kind": "T − E",
        "prompt": "Leg en reken: 60 − 3. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 60,
        "b": 3,
        "op": "-"
      },
      {
        "kind": "TE + T",
        "prompt": "Leg en reken: 26 + 30. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 26,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "TE − T",
        "prompt": "Leg en reken: 87 − 40. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 87,
        "b": 40,
        "op": "-"
      },
      {
        "kind": "TE + E",
        "prompt": "Leg en reken: 52 + 6. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 52,
        "b": 6,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "Leg en reken: 78 − 5. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 78,
        "b": 5,
        "op": "-"
      },
      {
        "kind": "TE + TE",
        "prompt": "Leg en reken: 34 + 25. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 34,
        "b": 25,
        "op": "+"
      },
      {
        "kind": "TE − TE",
        "prompt": "Leg en reken: 89 − 36. Schrijf samen.",
        "type": "mabModel",
        "ref": "",
        "a": 89,
        "b": 36,
        "op": "-"
      }
    ],
    "practice": [
      {
        "kind": "T + T",
        "prompt": "30 + 40 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 30,
        "b": 40,
        "op": "+"
      },
      {
        "kind": "T − T",
        "prompt": "80 − 50 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 80,
        "b": 50,
        "op": "-"
      },
      {
        "kind": "T + E",
        "prompt": "40 + 7 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 40,
        "b": 7,
        "op": "+"
      },
      {
        "kind": "T − E",
        "prompt": "60 − 3 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 60,
        "b": 3,
        "op": "-"
      },
      {
        "kind": "TE + T",
        "prompt": "26 + 30 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 26,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "TE − T",
        "prompt": "87 − 40 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 87,
        "b": 40,
        "op": "-"
      },
      {
        "kind": "TE + E",
        "prompt": "52 + 6 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 52,
        "b": 6,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "78 − 5 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 78,
        "b": 5,
        "op": "-"
      },
      {
        "kind": "TE + TE",
        "prompt": "34 + 25 = …",
        "type": "steps",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 34,
        "b": 25,
        "op": "+"
      },
      {
        "kind": "TE − TE",
        "prompt": "89 − 36 = …",
        "type": "steps",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 89,
        "b": 36,
        "op": "-"
      },
      {
        "kind": "Drie getallen",
        "prompt": "Schrijf twee optellingen en twee aftrekkingen.",
        "type": "family",
        "ref": "p. 58 · oef. 6",
        "a": 23,
        "b": 45,
        "answer": "23 + 45 = 68\n45 + 23 = 68\n68 − 45 = 23\n68 − 23 = 45"
      },
      {
        "kind": "Omgekeerd",
        "prompt": "Schrijf de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 59 · oef. 7",
        "lines": "47 + 32 = 79\n86 − 24 = 62",
        "answer": "79 − 32 = 47\n62 + 24 = 86"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 59 · oef. 10",
        "lines": "… + 23 = 67\n78 − … = 45",
        "answer": "44 + 23 = 67\n78 − 33 = 45"
      },
      {
        "kind": "T + T",
        "prompt": "40 + 40 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 40,
        "b": 40,
        "op": "+"
      },
      {
        "kind": "T − T",
        "prompt": "70 − 50 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 70,
        "b": 50,
        "op": "-"
      },
      {
        "kind": "T + E",
        "prompt": "50 + 7 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 50,
        "b": 7,
        "op": "+"
      },
      {
        "kind": "T − E",
        "prompt": "50 − 3 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 50,
        "b": 3,
        "op": "-"
      },
      {
        "kind": "TE + T",
        "prompt": "36 + 30 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 36,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "TE − T",
        "prompt": "77 − 40 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 77,
        "b": 40,
        "op": "-"
      },
      {
        "kind": "TE + E",
        "prompt": "62 + 6 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 62,
        "b": 6,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "68 − 5 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 68,
        "b": 5,
        "op": "-"
      },
      {
        "kind": "TE + TE",
        "prompt": "44 + 25 = …",
        "type": "steps",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 44,
        "b": 25,
        "op": "+"
      },
      {
        "kind": "TE − TE",
        "prompt": "79 − 36 = …",
        "type": "steps",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 79,
        "b": 36,
        "op": "-"
      },
      {
        "kind": "Drie getallen",
        "prompt": "Schrijf twee optellingen en twee aftrekkingen.",
        "type": "family",
        "ref": "p. 58 · oef. 6",
        "a": 23,
        "b": 45,
        "answer": "23 + 45 = 68\n45 + 23 = 68\n68 − 45 = 23\n68 − 23 = 45"
      },
      {
        "kind": "Omgekeerd",
        "prompt": "Schrijf de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 59 · oef. 7",
        "lines": "47 + 32 = 79\n86 − 24 = 62",
        "answer": "79 − 32 = 47\n62 + 24 = 86"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 59 · oef. 10",
        "lines": "… + 23 = 67\n78 − … = 45",
        "answer": "44 + 23 = 67\n78 − 33 = 45"
      },
      {
        "kind": "T + T",
        "prompt": "50 + 40 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 50,
        "b": 40,
        "op": "+"
      },
      {
        "kind": "T − T",
        "prompt": "60 − 50 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 60,
        "b": 50,
        "op": "-"
      },
      {
        "kind": "T + E",
        "prompt": "60 + 7 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 60,
        "b": 7,
        "op": "+"
      },
      {
        "kind": "T − E",
        "prompt": "40 − 3 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 40,
        "b": 3,
        "op": "-"
      },
      {
        "kind": "TE + T",
        "prompt": "46 + 30 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 46,
        "b": 30,
        "op": "+"
      },
      {
        "kind": "TE − T",
        "prompt": "67 − 40 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 67,
        "b": 40,
        "op": "-"
      },
      {
        "kind": "TE + E",
        "prompt": "72 + 6 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 72,
        "b": 6,
        "op": "+"
      },
      {
        "kind": "TE − E",
        "prompt": "58 − 5 = …",
        "type": "calc",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 58,
        "b": 5,
        "op": "-"
      },
      {
        "kind": "TE + TE",
        "prompt": "54 + 25 = …",
        "type": "steps",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 54,
        "b": 25,
        "op": "+"
      },
      {
        "kind": "TE − TE",
        "prompt": "69 − 36 = …",
        "type": "steps",
        "ref": "p. 57–58 · oef. 1–5",
        "a": 69,
        "b": 36,
        "op": "-"
      },
      {
        "kind": "Drie getallen",
        "prompt": "Schrijf twee optellingen en twee aftrekkingen.",
        "type": "family",
        "ref": "p. 58 · oef. 6",
        "a": 23,
        "b": 45,
        "answer": "23 + 45 = 68\n45 + 23 = 68\n68 − 45 = 23\n68 − 23 = 45"
      },
      {
        "kind": "Omgekeerd",
        "prompt": "Schrijf de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 59 · oef. 7",
        "lines": "47 + 32 = 79\n86 − 24 = 62",
        "answer": "79 − 32 = 47\n62 + 24 = 86"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 59 · oef. 10",
        "lines": "… + 23 = 67\n78 − … = 45",
        "answer": "44 + 23 = 67\n78 − 33 = 45"
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "34 + 25 = …",
        "type": "calc",
        "ref": "",
        "a": 34,
        "b": 25,
        "op": "+"
      },
      {
        "kind": "Zelf proberen",
        "prompt": "89 − 36 = …",
        "type": "calc",
        "ref": "",
        "a": 89,
        "b": 36,
        "op": "-"
      }
    ]
  },
  "6": {
    "number": 6,
    "title": "De maaltafel van 10 en de wisseleigenschap",
    "pages": "26–30",
    "goal": "Het eerste getal zegt hoeveel groepen er zijn. Het tweede zegt hoeveel in elke groep zit. Bij vermenigvuldigen mogen de factoren wisselen: de groepen veranderen, het product blijft gelijk.",
    "memory": "Het eerste getal zegt hoeveel groepen er zijn. Het tweede zegt hoeveel in elke groep zit. Bij vermenigvuldigen mogen de factoren wisselen: de groepen veranderen, het product blijft gelijk. De twee getallen die je vermenigvuldigt, zijn de factoren. De uitkomst is het product.",
    "hint": "Tel de gelijke groepen. Hoeveel zit in één groep? Schrijf eerst in woorden wat je doet.",
    "guide": "Werk eerst met de sinaasappels. Noteer samen de lange bewerking en de korte bewerking. Bij delen tel je de weggegeven groepen, niet de overgebleven vruchten.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "4 × 2 = …",
        "type": "calc",
        "ref": "",
        "a": 4,
        "b": 2,
        "op": "*",
        "answer": "4 × 2 = 8"
      },
      {
        "kind": "Groepen herkennen",
        "prompt": "Wat vertelt elk getal in 3 × 10?",
        "type": "text",
        "ref": "",
        "answer": "3 groepen, met 10 in elke groep. Samen 30."
      }
    ],
    "models": [
      {
        "kind": "Sinaasappels",
        "prompt": "Neem telkens een groep van tien. Schrijf samen de bewerking.",
        "type": "orangesModel",
        "ref": "",
        "groups": 1
      },
      {
        "kind": "Sprongen",
        "prompt": "Teken en tel sprongen van tien.",
        "type": "jumpModel",
        "ref": "",
        "op": "+",
        "a": 100
      },
      {
        "kind": "Wisselen",
        "prompt": "Wissel de rijen en kolommen. Wat blijft gelijk?",
        "type": "swapModel",
        "ref": "",
        "a": 2,
        "b": 10,
        "answer": "2 × 10 = 20 en 10 × 2 = 20. De groepen zijn anders, het totaal blijft 20."
      },
      {
        "kind": "Onze tafel",
        "prompt": "Vul samen de tafel aan. Schrijf naast elke bewerking.",
        "type": "table",
        "ref": "",
        "op": "*",
        "answer": "0 × 10 = 0\n1 × 10 = 10\n2 × 10 = 20\n3 × 10 = 30\n4 × 10 = 40\n5 × 10 = 50\n6 × 10 = 60\n7 × 10 = 70\n8 × 10 = 80\n9 × 10 = 90\n10 × 10 = 100"
      }
    ],
    "practice": [
      {
        "kind": "Beeld → bewerkingen",
        "prompt": "Schrijf de herhaalde optelling en de vermenigvuldiging.",
        "type": "oranges",
        "ref": "p. 27 · oef. 2",
        "groups": 3,
        "answer": "10 + 10 + 10 = 30\n3 × 10 = 30"
      },
      {
        "kind": "Optelling → maal",
        "prompt": "Schrijf korter als een vermenigvuldiging.",
        "type": "text",
        "ref": "p. 28 · oef. 3",
        "lines": "10 + 10 + 10 = …",
        "answer": "3 × 10 = 30"
      },
      {
        "kind": "Boogjes",
        "prompt": "Teken de boogjes van +10. Vul de getallen aan.",
        "type": "tableLine",
        "ref": "p. 27 · oef. 1",
        "n": 3,
        "op": "+",
        "answer": "3 sprongen van 10: 3 × 10 = 30."
      },
      {
        "kind": "Wisselen",
        "prompt": "Schrijf beide vermenigvuldigingen.",
        "type": "swapModel",
        "ref": "onthoudkader en lesdoel",
        "a": 3,
        "b": 10,
        "answer": "3 × 10 = 30\n10 × 3 = 30"
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Schrijf de bewerking en de antwoordzin.",
        "type": "text",
        "ref": "p. 29 · oef. 5",
        "story": "Er zijn 3 dozen. In elke doos zitten 10 potloden. Hoeveel potloden zijn er samen?",
        "answer": "3 × 10 = 30\nEr zijn samen 30 potloden."
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 28 · oef. 4",
        "lines": "0 × 10 = …\n1 × 10 = …",
        "answer": "0\n10"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 30 · uitdaging",
        "lines": "… × 10 = 30",
        "answer": "3"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 29 · oef. 6",
        "cards": [
          "3 × 10",
          "50",
          "7 groepen van 10",
          "30",
          "5 × 10",
          "70",
          "10 + 10 + 10",
          "10 + 10 + 10 + 10 + 10",
          "7 × 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Beeld → bewerkingen",
        "prompt": "Schrijf de herhaalde optelling en de vermenigvuldiging.",
        "type": "oranges",
        "ref": "p. 27 · oef. 2",
        "groups": 6,
        "answer": "10 + 10 + 10 + 10 + 10 + 10 = 60\n6 × 10 = 60"
      },
      {
        "kind": "Optelling → maal",
        "prompt": "Schrijf korter als een vermenigvuldiging.",
        "type": "text",
        "ref": "p. 28 · oef. 3",
        "lines": "10 + 10 + 10 + 10 + 10 + 10 = …",
        "answer": "6 × 10 = 60"
      },
      {
        "kind": "Boogjes",
        "prompt": "Teken de boogjes van +10. Vul de getallen aan.",
        "type": "tableLine",
        "ref": "p. 27 · oef. 1",
        "n": 6,
        "op": "+",
        "answer": "6 sprongen van 10: 6 × 10 = 60."
      },
      {
        "kind": "Wisselen",
        "prompt": "Schrijf beide vermenigvuldigingen.",
        "type": "swapModel",
        "ref": "onthoudkader en lesdoel",
        "a": 6,
        "b": 10,
        "answer": "6 × 10 = 60\n10 × 6 = 60"
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Schrijf de bewerking en de antwoordzin.",
        "type": "text",
        "ref": "p. 29 · oef. 5",
        "story": "Er zijn 6 dozen. In elke doos zitten 10 potloden. Hoeveel potloden zijn er samen?",
        "answer": "6 × 10 = 60\nEr zijn samen 60 potloden."
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 28 · oef. 4",
        "lines": "4 × 10 = …\n5 × 10 = …",
        "answer": "40\n50"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 30 · uitdaging",
        "lines": "… × 10 = 60",
        "answer": "6"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 29 · oef. 6",
        "cards": [
          "3 × 10",
          "50",
          "7 groepen van 10",
          "30",
          "5 × 10",
          "70",
          "10 + 10 + 10",
          "10 + 10 + 10 + 10 + 10",
          "7 × 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Beeld → bewerkingen",
        "prompt": "Schrijf de herhaalde optelling en de vermenigvuldiging.",
        "type": "oranges",
        "ref": "p. 27 · oef. 2",
        "groups": 8,
        "answer": "10 + 10 + 10 + 10 + 10 + 10 + 10 + 10 = 80\n8 × 10 = 80"
      },
      {
        "kind": "Optelling → maal",
        "prompt": "Schrijf korter als een vermenigvuldiging.",
        "type": "text",
        "ref": "p. 28 · oef. 3",
        "lines": "10 + 10 + 10 + 10 + 10 + 10 + 10 + 10 = …",
        "answer": "8 × 10 = 80"
      },
      {
        "kind": "Boogjes",
        "prompt": "Teken de boogjes van +10. Vul de getallen aan.",
        "type": "tableLine",
        "ref": "p. 27 · oef. 1",
        "n": 8,
        "op": "+",
        "answer": "8 sprongen van 10: 8 × 10 = 80."
      },
      {
        "kind": "Wisselen",
        "prompt": "Schrijf beide vermenigvuldigingen.",
        "type": "swapModel",
        "ref": "onthoudkader en lesdoel",
        "a": 8,
        "b": 10,
        "answer": "8 × 10 = 80\n10 × 8 = 80"
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Schrijf de bewerking en de antwoordzin.",
        "type": "text",
        "ref": "p. 29 · oef. 5",
        "story": "Er zijn 8 dozen. In elke doos zitten 10 potloden. Hoeveel potloden zijn er samen?",
        "answer": "8 × 10 = 80\nEr zijn samen 80 potloden."
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 28 · oef. 4",
        "lines": "7 × 10 = …\n10 × 10 = …",
        "answer": "70\n100"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 30 · uitdaging",
        "lines": "… × 10 = 80",
        "answer": "8"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 29 · oef. 6",
        "cards": [
          "3 × 10",
          "50",
          "7 groepen van 10",
          "30",
          "5 × 10",
          "70",
          "10 + 10 + 10",
          "10 + 10 + 10 + 10 + 10",
          "7 × 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "9 × 10 = …",
        "type": "calc",
        "ref": "",
        "a": 9,
        "b": 10,
        "op": "*",
        "answer": "9 × 10 = 90"
      },
      {
        "kind": "Zelf uitleggen",
        "prompt": "Teken zelf een voorbeeld en schrijf de bijpassende bewerking.",
        "type": "text",
        "ref": "",
        "answer": "Meerdere voorbeelden mogelijk. Controleer gelijke groepen van tien en de juiste bewerking."
      }
    ],
    "map": [
      [
        "1–2",
        "Boogjes tekenen; beelden vertalen naar optelling en vermenigvuldiging."
      ],
      [
        "3–4",
        "Herhaalde optelling verkorten en de tafel uitrekenen."
      ],
      [
        "5–6",
        "Verhaaltjes en gelijke voorstellingen verbinden."
      ],
      [
        "7–8 · differentiatie",
        "In woorden schrijven en ontbrekende factoren."
      ]
    ],
    "check": "Laat een nieuw beeld, een bewerking en een verhaaltje oplossen. Kan het kind uitleggen wat het antwoord telt: voorwerpen of groepen?"
  },
  "7": {
    "number": 7,
    "title": "De deeltafel van 10",
    "pages": "31–34",
    "goal": "Verdelen in groepen van 10: tel hoeveel groepen je kunt maken. De herhaalde aftrekking eindigt op 0; de uitkomst van de deling is het aantal groepen. Bij 0 : 10 zijn er geen groepen.",
    "memory": "Verdelen in groepen van 10: tel hoeveel groepen je kunt maken. De herhaalde aftrekking eindigt op 0; de uitkomst van de deling is het aantal groepen. Bij 0 : 10 zijn er geen groepen. Het totaal is het deeltal, de groepsgrootte is de deler en de uitkomst is het quotiënt.",
    "hint": "Tel de gelijke groepen. Hoeveel zit in één groep? Schrijf eerst in woorden wat je doet.",
    "guide": "Werk eerst met de sinaasappels. Noteer samen de lange bewerking en de korte bewerking. Bij delen tel je de weggegeven groepen, niet de overgebleven vruchten.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "8 : 2 = …",
        "type": "calc",
        "ref": "",
        "a": 8,
        "b": 2,
        "op": "/",
        "answer": "8 : 2 = 4"
      },
      {
        "kind": "Groepen herkennen",
        "prompt": "Wat vertelt elk getal in 3 × 10?",
        "type": "text",
        "ref": "",
        "answer": "3 groepen, met 10 in elke groep. Samen 30."
      }
    ],
    "models": [
      {
        "kind": "Sinaasappels",
        "prompt": "Geef telkens tien sinaasappels weg. Hoeveel groepen kun je maken?",
        "type": "orangesModel",
        "ref": "",
        "groups": 3
      },
      {
        "kind": "Sprongen",
        "prompt": "Teken en tel sprongen van tien.",
        "type": "jumpModel",
        "ref": "",
        "op": "-",
        "a": 100
      },
      {
        "kind": "Omgekeerd",
        "prompt": "Schrijf de deling en de omgekeerde vermenigvuldiging.",
        "type": "arrows",
        "ref": "",
        "a": 40,
        "b": 4,
        "top": ": 10",
        "bottom": "× 10",
        "answer": "40 : 10 = 4\n4 × 10 = 40"
      },
      {
        "kind": "Onze tafel",
        "prompt": "Vul samen de tafel aan. Schrijf naast elke bewerking.",
        "type": "table",
        "ref": "",
        "op": "/",
        "answer": "0 : 10 = 0\n10 : 10 = 1\n20 : 10 = 2\n30 : 10 = 3\n40 : 10 = 4\n50 : 10 = 5\n60 : 10 = 6\n70 : 10 = 7\n80 : 10 = 8\n90 : 10 = 9\n100 : 10 = 10"
      }
    ],
    "practice": [
      {
        "kind": "Groepen omkringen",
        "prompt": "Omkring groepen van 10. Schrijf de deling.",
        "type": "oranges",
        "ref": "p. 32 · oef. 2",
        "groups": 3,
        "grouped": false,
        "answer": "30 verdelen in groepen van 10 geeft 3 groepen.\n30 : 10 = 3"
      },
      {
        "kind": "Aftrekking → deling",
        "prompt": "Schrijf de herhaalde aftrekking en de deling.",
        "type": "text",
        "ref": "p. 34 · oef. 6",
        "lines": "30 − 10 − 10 − 10 = …",
        "answer": "30 − 10 − 10 − 10 = 0\n30 : 10 = 3"
      },
      {
        "kind": "Boogjes",
        "prompt": "Teken sprongen van −10 tot je op nul komt.",
        "type": "tableLine",
        "ref": "p. 32 · oef. 1",
        "op": "-",
        "n": 3,
        "answer": "3 sprongen: 30 : 10 = 3."
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Schrijf de bewerking en de antwoordzin.",
        "type": "text",
        "ref": "p. 33 · oef. 4",
        "story": "We hebben 30 kralen. Voor elke armband gebruiken we 10 kralen. Hoeveel armbanden kunnen we maken?",
        "answer": "30 : 10 = 3\nWe kunnen 3 armbanden maken."
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 33 · oef. 3",
        "lines": "0 : 10 = …\n10 : 10 = …",
        "answer": "0\n1"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 34 · uitdaging",
        "lines": "… : 10 = 3",
        "answer": "30"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 33 · oef. 5",
        "cards": [
          "30 : 10",
          "5",
          "70 verdelen in groepen van 10",
          "3",
          "50 : 10",
          "7",
          "30 − 10 − 10 − 10",
          "50 verdelen in groepen van 10",
          "70 : 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Groepen omkringen",
        "prompt": "Omkring groepen van 10. Schrijf de deling.",
        "type": "oranges",
        "ref": "p. 32 · oef. 2",
        "groups": 6,
        "grouped": false,
        "answer": "60 verdelen in groepen van 10 geeft 6 groepen.\n60 : 10 = 6"
      },
      {
        "kind": "Aftrekking → deling",
        "prompt": "Schrijf de herhaalde aftrekking en de deling.",
        "type": "text",
        "ref": "p. 34 · oef. 6",
        "lines": "60 − 10 − 10 − 10 − 10 − 10 − 10 = …",
        "answer": "60 − 10 − 10 − 10 − 10 − 10 − 10 = 0\n60 : 10 = 6"
      },
      {
        "kind": "Boogjes",
        "prompt": "Teken sprongen van −10 tot je op nul komt.",
        "type": "tableLine",
        "ref": "p. 32 · oef. 1",
        "op": "-",
        "n": 6,
        "answer": "6 sprongen: 60 : 10 = 6."
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Schrijf de bewerking en de antwoordzin.",
        "type": "text",
        "ref": "p. 33 · oef. 4",
        "story": "We hebben 60 kralen. Voor elke armband gebruiken we 10 kralen. Hoeveel armbanden kunnen we maken?",
        "answer": "60 : 10 = 6\nWe kunnen 6 armbanden maken."
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 33 · oef. 3",
        "lines": "40 : 10 = …\n50 : 10 = …",
        "answer": "4\n5"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 34 · uitdaging",
        "lines": "… : 10 = 6",
        "answer": "60"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 33 · oef. 5",
        "cards": [
          "30 : 10",
          "5",
          "70 verdelen in groepen van 10",
          "3",
          "50 : 10",
          "7",
          "30 − 10 − 10 − 10",
          "50 verdelen in groepen van 10",
          "70 : 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Groepen omkringen",
        "prompt": "Omkring groepen van 10. Schrijf de deling.",
        "type": "oranges",
        "ref": "p. 32 · oef. 2",
        "groups": 8,
        "grouped": false,
        "answer": "80 verdelen in groepen van 10 geeft 8 groepen.\n80 : 10 = 8"
      },
      {
        "kind": "Aftrekking → deling",
        "prompt": "Schrijf de herhaalde aftrekking en de deling.",
        "type": "text",
        "ref": "p. 34 · oef. 6",
        "lines": "80 − 10 − 10 − 10 − 10 − 10 − 10 − 10 − 10 = …",
        "answer": "80 − 10 − 10 − 10 − 10 − 10 − 10 − 10 − 10 = 0\n80 : 10 = 8"
      },
      {
        "kind": "Boogjes",
        "prompt": "Teken sprongen van −10 tot je op nul komt.",
        "type": "tableLine",
        "ref": "p. 32 · oef. 1",
        "op": "-",
        "n": 8,
        "answer": "8 sprongen: 80 : 10 = 8."
      },
      {
        "kind": "Vraagstuk",
        "prompt": "Schrijf de bewerking en de antwoordzin.",
        "type": "text",
        "ref": "p. 33 · oef. 4",
        "story": "We hebben 80 kralen. Voor elke armband gebruiken we 10 kralen. Hoeveel armbanden kunnen we maken?",
        "answer": "80 : 10 = 8\nWe kunnen 8 armbanden maken."
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 33 · oef. 3",
        "lines": "70 : 10 = …\n100 : 10 = …",
        "answer": "7\n10"
      },
      {
        "kind": "Ontbrekend getal",
        "prompt": "Vul aan.",
        "type": "text",
        "ref": "p. 34 · uitdaging",
        "lines": "… : 10 = 8",
        "answer": "80"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 33 · oef. 5",
        "cards": [
          "30 : 10",
          "5",
          "70 verdelen in groepen van 10",
          "3",
          "50 : 10",
          "7",
          "30 − 10 − 10 − 10",
          "50 verdelen in groepen van 10",
          "70 : 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "90 : 10 = …",
        "type": "calc",
        "ref": "",
        "a": 90,
        "b": 10,
        "op": "/",
        "answer": "90 : 10 = 9"
      },
      {
        "kind": "Zelf uitleggen",
        "prompt": "Teken zelf een voorbeeld en schrijf de bijpassende bewerking.",
        "type": "text",
        "ref": "",
        "answer": "Meerdere voorbeelden mogelijk. Controleer gelijke groepen van tien en de juiste bewerking."
      }
    ],
    "map": [
      [
        "1–2",
        "Terugspringen en groepen van tien omkringen."
      ],
      [
        "3–5",
        "Delingen oplossen, verhaaltjes en voorstellingen verbinden."
      ],
      [
        "6–7 · differentiatie",
        "Herhaald aftrekken en ontbrekende deeltallen."
      ]
    ],
    "check": "Laat een nieuw beeld, een bewerking en een verhaaltje oplossen. Kan het kind uitleggen wat het antwoord telt: voorwerpen of groepen?"
  },
  "8": {
    "number": 8,
    "title": "De maal- en deeltafel van 10",
    "pages": "35–37",
    "goal": "Delen en vermenigvuldigen zijn omgekeerde bewerkingen. Met het aantal groepen en de groepsgrootte vind je het totaal terug. Bijvoorbeeld: 40 : 10 = 4 en 4 × 10 = 40.",
    "memory": "Delen en vermenigvuldigen zijn omgekeerde bewerkingen. Met het aantal groepen en de groepsgrootte vind je het totaal terug. Bijvoorbeeld: 40 : 10 = 4 en 4 × 10 = 40.",
    "hint": "Tel de gelijke groepen. Hoeveel zit in één groep? Schrijf eerst in woorden wat je doet.",
    "guide": "Werk eerst met de sinaasappels. Noteer samen de lange bewerking en de korte bewerking. Bij delen tel je de weggegeven groepen, niet de overgebleven vruchten.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "8 : 2 = …",
        "type": "calc",
        "ref": "",
        "a": 8,
        "b": 2,
        "op": "/",
        "answer": "8 : 2 = 4"
      },
      {
        "kind": "Groepen herkennen",
        "prompt": "Wat vertelt elk getal in 3 × 10?",
        "type": "text",
        "ref": "",
        "answer": "3 groepen, met 10 in elke groep. Samen 30."
      }
    ],
    "models": [
      {
        "kind": "Sinaasappels",
        "prompt": "Geef telkens tien sinaasappels weg. Hoeveel groepen kun je maken?",
        "type": "orangesModel",
        "ref": "",
        "groups": 3
      },
      {
        "kind": "Sprongen",
        "prompt": "Teken en tel sprongen van tien.",
        "type": "jumpModel",
        "ref": "",
        "op": "+",
        "a": 100
      },
      {
        "kind": "Omgekeerd",
        "prompt": "Schrijf de deling en de omgekeerde vermenigvuldiging.",
        "type": "arrows",
        "ref": "",
        "a": 40,
        "b": 4,
        "top": ": 10",
        "bottom": "× 10",
        "answer": "40 : 10 = 4\n4 × 10 = 40"
      }
    ],
    "practice": [
      {
        "kind": "Pijlenvoorstelling",
        "prompt": "Vul aan. Schrijf de deling én de vermenigvuldiging.",
        "type": "arrows",
        "ref": "p. 35–36 · oef. 1",
        "a": 30,
        "b": 3,
        "top": ": 10",
        "bottom": "× 10",
        "answer": "30 : 10 = 3\n3 × 10 = 30"
      },
      {
        "kind": "Groepen → omgekeerd",
        "prompt": "Omkring groepen van tien. Schrijf de twee bewerkingen.",
        "type": "oranges",
        "ref": "p. 36 · oef. 2",
        "groups": 3,
        "grouped": false,
        "answer": "30 : 10 = 3\n3 × 10 = 30"
      },
      {
        "kind": "Omgekeerde bewerking",
        "prompt": "Schrijf de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 37 · oef. 3–4",
        "lines": "3 × 10 = 30",
        "answer": "30 : 10 = 3"
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 37 · oef. 5",
        "lines": "0 : 10 = …\n10 : 10 = …",
        "answer": "0\n1"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 37 · oef. 3",
        "cards": [
          "30 : 10",
          "5",
          "70 verdelen in groepen van 10",
          "3",
          "50 : 10",
          "7",
          "30 − 10 − 10 − 10",
          "50 verdelen in groepen van 10",
          "70 : 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Maal en delen door elkaar",
        "prompt": "Los op en controleer met de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 37 · oef. 5",
        "lines": "7 × 10 = …\n30 : 10 = …\n0 × 10 = …\n100 : 10 = …",
        "answer": "70; 3; 0; 10."
      },
      {
        "kind": "Pijlenvoorstelling",
        "prompt": "Vul aan. Schrijf de deling én de vermenigvuldiging.",
        "type": "arrows",
        "ref": "p. 35–36 · oef. 1",
        "a": 60,
        "b": 6,
        "top": ": 10",
        "bottom": "× 10",
        "answer": "60 : 10 = 6\n6 × 10 = 60"
      },
      {
        "kind": "Groepen → omgekeerd",
        "prompt": "Omkring groepen van tien. Schrijf de twee bewerkingen.",
        "type": "oranges",
        "ref": "p. 36 · oef. 2",
        "groups": 6,
        "grouped": false,
        "answer": "60 : 10 = 6\n6 × 10 = 60"
      },
      {
        "kind": "Omgekeerde bewerking",
        "prompt": "Schrijf de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 37 · oef. 3–4",
        "lines": "6 × 10 = 60",
        "answer": "60 : 10 = 6"
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 37 · oef. 5",
        "lines": "40 : 10 = …\n50 : 10 = …",
        "answer": "4\n5"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 37 · oef. 3",
        "cards": [
          "30 : 10",
          "5",
          "70 verdelen in groepen van 10",
          "3",
          "50 : 10",
          "7",
          "30 − 10 − 10 − 10",
          "50 verdelen in groepen van 10",
          "70 : 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Maal en delen door elkaar",
        "prompt": "Los op en controleer met de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 37 · oef. 5",
        "lines": "7 × 10 = …\n30 : 10 = …\n0 × 10 = …\n100 : 10 = …",
        "answer": "70; 3; 0; 10."
      },
      {
        "kind": "Pijlenvoorstelling",
        "prompt": "Vul aan. Schrijf de deling én de vermenigvuldiging.",
        "type": "arrows",
        "ref": "p. 35–36 · oef. 1",
        "a": 80,
        "b": 8,
        "top": ": 10",
        "bottom": "× 10",
        "answer": "80 : 10 = 8\n8 × 10 = 80"
      },
      {
        "kind": "Groepen → omgekeerd",
        "prompt": "Omkring groepen van tien. Schrijf de twee bewerkingen.",
        "type": "oranges",
        "ref": "p. 36 · oef. 2",
        "groups": 8,
        "grouped": false,
        "answer": "80 : 10 = 8\n8 × 10 = 80"
      },
      {
        "kind": "Omgekeerde bewerking",
        "prompt": "Schrijf de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 37 · oef. 3–4",
        "lines": "8 × 10 = 80",
        "answer": "80 : 10 = 8"
      },
      {
        "kind": "Los op",
        "prompt": "Reken uit. Leg één antwoord uit.",
        "type": "text",
        "ref": "p. 37 · oef. 5",
        "lines": "70 : 10 = …\n100 : 10 = …",
        "answer": "7\n10"
      },
      {
        "kind": "Wat hoort samen?",
        "prompt": "Geef elke familie één kleur. Tik op een kaart om te kleuren.",
        "type": "match",
        "ref": "p. 37 · oef. 3",
        "cards": [
          "30 : 10",
          "5",
          "70 verdelen in groepen van 10",
          "3",
          "50 : 10",
          "7",
          "30 − 10 − 10 − 10",
          "50 verdelen in groepen van 10",
          "70 : 10"
        ],
        "sets": [
          [
            0,
            3,
            6
          ],
          [
            1,
            4,
            7
          ],
          [
            2,
            5,
            8
          ]
        ],
        "answer": "Familie 1: de kaarten met 3 groepen.\nFamilie 2: de kaarten met 5 groepen.\nFamilie 3: de kaarten met 7 groepen."
      },
      {
        "kind": "Maal en delen door elkaar",
        "prompt": "Los op en controleer met de omgekeerde bewerking.",
        "type": "text",
        "ref": "p. 37 · oef. 5",
        "lines": "7 × 10 = …\n30 : 10 = …\n0 × 10 = …\n100 : 10 = …",
        "answer": "70; 3; 0; 10."
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "90 : 10 = …",
        "type": "calc",
        "ref": "",
        "a": 90,
        "b": 10,
        "op": "/",
        "answer": "90 : 10 = 9"
      },
      {
        "kind": "Zelf uitleggen",
        "prompt": "Teken zelf een voorbeeld en schrijf de bijpassende bewerking.",
        "type": "text",
        "ref": "",
        "answer": "Meerdere voorbeelden mogelijk. Controleer gelijke groepen van tien en de juiste bewerking."
      }
    ],
    "map": [
      [
        "1–2",
        "Pijlen, groepen en de twee omgekeerde bewerkingen."
      ],
      [
        "3–5",
        "Omgekeerde bewerkingen verbinden en gemengd rekenen."
      ]
    ],
    "check": "Laat een nieuw beeld, een bewerking en een verhaaltje oplossen. Kan het kind uitleggen wat het antwoord telt: voorwerpen of groepen?"
  },
  "11": {
    "number": 11,
    "title": "Materiaal gebruiken om problemen op te lossen",
    "pages": "43",
    "goal": "Materiaal gebruiken om problemen op te lossen",
    "memory": "Materiaal kan helpen om een probleem voor te stellen en uit te proberen. Kies passend materiaal. Controleer ook of je genoeg gegevens hebt: materiaal kan ontbrekende informatie niet zomaar invullen.",
    "hint": "Wat wordt gevraagd? Welke gegevens helpen? Geef het getal én wat je telt in je antwoordzin.",
    "guide": "Klik op woorden om de vraag en de gegevens te markeren. Laat het probleem navertellen. Kies materiaal, noteer de bewerking en een volledige antwoordzin. Bespreek pas daarna het voorbeeld.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "Welk materiaal kan ons helpen rekenen? Noem twee voorbeelden.",
        "type": "text",
        "ref": "",
        "answer": "Bijvoorbeeld blokjes, MAB, stokjes, echte munten of kaarten."
      }
    ],
    "models": [
      {
        "kind": "Stokjes",
        "prompt": "Leg met stokjes het digitale getal 17. Hoeveel stokjes gebruik je?",
        "type": "freeMaterial",
        "ref": "",
        "guide": "Laat eerst een digitale 1 en 7 op een klok bekijken. Selecteer een stokje; verplaats met de pijlen en draai het. Vergelijk echte stokjes met het bordmodel.",
        "answer": "Voor een digitale 1 gebruik je 2 stokjes; voor een 7 gebruik je 3. Samen 5 stokjes."
      },
      {
        "kind": "Blokjes",
        "prompt": "Leg 18 blokjes. Maak groepjes van 3. Hoeveel groepjes krijg je?",
        "type": "freeMaterial",
        "ref": "",
        "answer": "6 groepjes van 3. 18 : 3 = 6."
      }
    ],
    "practice": [
      {
        "kind": "Materiaal kiezen",
        "prompt": "Welk materiaal zou je kiezen? Waarom?",
        "type": "text",
        "ref": "p. 43 · oef. 1",
        "story": "We willen 24 kaartjes eerlijk verdelen in stapeltjes van 6. Welk materiaal helpt?",
        "answer": "Echte kaartjes of blokjes. Leg telkens 6 bij elkaar en tel de stapeltjes: 4."
      },
      {
        "kind": "Uitproberen",
        "prompt": "Probeer het met materiaal.",
        "type": "freeMaterial",
        "ref": "p. 43 · oef. 1",
        "lines": "Leg twee vierkanten naast elkaar. Ze delen één zijde. Hoeveel stokjes heb je nodig?",
        "answer": "Twee vierkanten met één gedeelde zijde hebben 7 stokjes nodig."
      },
      {
        "kind": "Genoeg gegevens?",
        "prompt": "Kun je dit zeker weten? Vertel wat je nog nodig hebt.",
        "type": "text",
        "ref": "p. 43 · oef. 1",
        "story": "Er zijn 30 kaarten. Elke speler krijgt 6 kaarten. Er staat niet of alle kaarten worden uitgedeeld. Hoeveel spelers zijn er?",
        "answer": "Niet zeker. Als alle kaarten op zijn, zijn er 5 spelers. Anders moet je weten hoeveel kaarten overblijven."
      },
      {
        "kind": "Echt materiaal",
        "prompt": "Welk materiaal moet je echt klaarleggen?",
        "type": "text",
        "ref": "p. 43 · oef. 1",
        "story": "Een stapel munten van 1 euro is 2 cm hoog. Hoe kun je onderzoeken hoeveel euro dat is?",
        "answer": "Gebruik echte munten van 1 euro en een meetlat. Maak een stapel van 2 cm en tel. Met blokjes van een andere dikte kun je dit niet bepalen."
      }
    ],
    "self": [
      {
        "kind": "Zelf kiezen",
        "prompt": "Bedenk een rekenprobleem waarbij stokjes of blokjes helpen. Leg uit waarom.",
        "type": "text",
        "ref": "",
        "answer": "Meerdere antwoorden mogelijk. Het materiaal moet de gegevens en de handeling goed voorstellen."
      }
    ],
    "map": [
      [
        "1",
        "Bij elk probleem kiezen of en welk materiaal helpt; de keuze uitleggen."
      ]
    ],
    "check": "Laat een nieuw vraagstuk oplossen: de vraag herkennen, passend handelen, een bewerking schrijven en antwoorden op precies de gestelde vraag."
  },
  "15": {
    "number": 15,
    "title": "Een antwoordzin schrijven",
    "pages": "60–63",
    "goal": "Een antwoordzin schrijven",
    "memory": "Lees en vertel het probleem na. Duid de vraag en gegevens aan. Kies een aanpak. Schrijf de bewerking en een antwoordzin.",
    "hint": "Wat wordt gevraagd? Welke gegevens helpen? Geef het getal én wat je telt in je antwoordzin.",
    "guide": "Klik op woorden om de vraag en de gegevens te markeren. Laat het probleem navertellen. Kies materiaal, noteer de bewerking en een volledige antwoordzin. Bespreek pas daarna het voorbeeld.",
    "intro": [
      {
        "kind": "Vraag begrijpen",
        "prompt": "Wat hoort in een goede antwoordzin?",
        "type": "text",
        "ref": "",
        "answer": "Het antwoordgetal, wat je telt en een antwoord op de gestelde vraag."
      }
    ],
    "models": [
      {
        "kind": "Samen voordoen",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "",
        "story": "In een mand liggen 28 appels. We eten er 6 op. Hoeveel appels blijven er over?",
        "answer": "28 − 6 = 22\nEr blijven 22 appels over."
      },
      {
        "kind": "Voorstellen",
        "prompt": "Stel het verhaal met blokjes of tientallen voor. Schrijf daarna de antwoordzin.",
        "type": "freeMaterial",
        "ref": "",
        "story": "In de kast liggen 24 schriften. Er komen 3 schriften bij. Hoeveel schriften liggen er nu?",
        "answer": "24 + 3 = 27\nEr liggen nu 27 schriften in de kast."
      }
    ],
    "practice": [
      {
        "kind": "Prent → antwoordzin",
        "prompt": "Hoeveel sinaasappels zie je? Schrijf een volledige antwoordzin.",
        "type": "sceneCount",
        "ref": "p. 61 · oef. 1",
        "a": 12,
        "answer": "Ik zie 12 sinaasappels."
      },
      {
        "kind": "Optellen",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 61 · oef. 2",
        "story": "Er zitten 32 kinderen in de zaal. Er komen 20 kinderen bij. Hoeveel kinderen zijn er nu?",
        "answer": "32 + 20 = 52\nEr zijn nu 52 kinderen."
      },
      {
        "kind": "Aftrekken",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 61 · oef. 2",
        "story": "De bakker heeft 70 broodjes. Hij verkoopt er 40. Hoeveel broodjes heeft hij nog?",
        "answer": "70 − 40 = 30\nDe bakker heeft nog 30 broodjes."
      },
      {
        "kind": "Vermenigvuldigen",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 62 · oef. 2",
        "story": "Er zijn 4 vogels. Elke vogel krijgt 10 zaadjes. Hoeveel zaadjes zijn er nodig?",
        "answer": "4 × 10 = 40\nEr zijn 40 zaadjes nodig."
      },
      {
        "kind": "Delen",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 62 · oef. 2",
        "story": "Er zijn 16 koeken. Elk kind krijgt 2 koeken. Hoeveel kinderen kunnen een portie krijgen?",
        "answer": "16 : 2 = 8\n8 kinderen kunnen een portie krijgen."
      },
      {
        "kind": "Zelf een vraag",
        "prompt": "Bedenk een vraag. Schrijf de bewerking en het antwoord.",
        "type": "text",
        "ref": "p. 63 · oef. 4",
        "story": "Er zijn 50 bloembollen. We planten telkens 10 bloembollen in één rij.",
        "answer": "Bijvoorbeeld: hoeveel rijen kunnen we planten?\n50 : 10 = 5\nWe kunnen 5 rijen planten."
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "",
        "story": "Er staan 21 fietsen. Er komen 14 fietsen bij. Hoeveel fietsen staan er nu?",
        "answer": "21 + 14 = 35\nEr staan nu 35 fietsen."
      }
    ],
    "map": [
      [
        "1",
        "Een prent tellen en een volledige antwoordzin schrijven."
      ],
      [
        "2",
        "Vraagstukken met plus, min, maal en delen oplossen."
      ],
      [
        "3 · extra hulp",
        "Een vraag aan een passende antwoordzin koppelen."
      ],
      [
        "4 · uitdaging",
        "Zelf een vraag bedenken en beantwoorden."
      ]
    ],
    "check": "Laat een nieuw vraagstuk oplossen: de vraag herkennen, passend handelen, een bewerking schrijven en antwoorden op precies de gestelde vraag."
  },
  "16": {
    "number": 16,
    "title": "Controleren of een antwoord mogelijk is",
    "pages": "64–67",
    "goal": "Controleren of een antwoord mogelijk is",
    "memory": "Lees en vertel het probleem na. Duid de vraag en gegevens aan. Kies een aanpak. Schrijf de bewerking en een antwoordzin. Controleer door je antwoord terug in het verhaal te zetten.",
    "hint": "Wat wordt gevraagd? Welke gegevens helpen? Geef het getal én wat je telt in je antwoordzin.",
    "guide": "Klik op woorden om de vraag en de gegevens te markeren. Laat het probleem navertellen. Kies materiaal, noteer de bewerking en een volledige antwoordzin. Bespreek pas daarna het voorbeeld.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "",
        "story": "Er zijn 20 appels. We eten er 3 op. Hoeveel blijven er over?",
        "answer": "20 − 3 = 17\nEr blijven 17 appels over."
      }
    ],
    "models": [
      {
        "kind": "Terug in het verhaal",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "",
        "story": "Ilias geeft 2 potloden weg. Hij houdt 15 potloden over. Hoeveel had hij eerst?",
        "answer": "15 + 2 = 17\nIlias had eerst 17 potloden.\nControle: hij had 17, gaf 2 weg en houdt 15 over."
      },
      {
        "kind": "Controleren met materiaal",
        "prompt": "Leg het antwoord terug in het verhaal. Klopt wat er overblijft?",
        "type": "freeMaterial",
        "ref": "",
        "story": "Mila had 12 knikkers. Zij kreeg er enkele bij en heeft nu 18 knikkers.",
        "answer": "Er kwamen 6 knikkers bij. Controle: 12 + 6 = 18."
      }
    ],
    "practice": [
      {
        "kind": "Kies de bewerking",
        "prompt": "Kies en leg je keuze uit.",
        "type": "text",
        "ref": "p. 65 · oef. 1",
        "story": "We hebben 18 glazen. 6 bevatten melk, de andere water. Hoeveel glazen bevatten water?",
        "choices": [
          "18 + 6 = 24",
          "18 − 6 = 12",
          "18 − 12 = 6"
        ],
        "answer": "18 − 6 = 12. Er zijn 12 glazen water. Controle: 12 + 6 = 18."
      },
      {
        "kind": "Eerst onbekend",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 65 · oef. 1–2",
        "story": "Noor geeft 4 stickers weg. Ze heeft er nog 23. Hoeveel stickers had Noor eerst?",
        "answer": "23 + 4 = 27\nNoor had eerst 27 stickers.\nControle: 27 − 4 = 23."
      },
      {
        "kind": "Erbij onbekend",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 65 · oef. 2",
        "story": "Er liggen 30 boeken. We leggen er boeken bij. Nu zijn het er 56. Hoeveel boeken kwamen erbij?",
        "answer": "56 − 30 = 26\nEr kwamen 26 boeken bij.\nControle: 30 + 26 = 56."
      },
      {
        "kind": "Deel van het geheel",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 65 · oef. 2",
        "story": "Er zijn 28 bekers. 15 zijn blauw, de andere zijn geel. Hoeveel gele bekers zijn er?",
        "answer": "28 − 15 = 13\nEr zijn 13 gele bekers.\nControle: 15 + 13 = 28."
      },
      {
        "kind": "Meer of minder",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 66 · oef. 2",
        "story": "Ada heeft 24 kralen. Dat zijn er 5 minder dan Bas. Hoeveel kralen heeft Bas?",
        "answer": "24 + 5 = 29\nBas heeft 29 kralen.\nControle: 29 − 5 = 24."
      },
      {
        "kind": "Verschil zoeken",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "p. 66 · oef. 2",
        "story": "Bo heeft 13 kaarten. Sam heeft 27 kaarten. Hoeveel kaarten heeft Sam meer?",
        "answer": "27 − 13 = 14\nSam heeft 14 kaarten meer.\nControle: 13 + 14 = 27."
      },
      {
        "kind": "Zoek de fout",
        "prompt": "Kan dit antwoord kloppen? Verbeter en controleer.",
        "type": "text",
        "ref": "stap 5: controleren",
        "story": "Er zijn 35 kinderen. Er gaan 12 naar huis. Een leerling schrijft: er blijven 27 kinderen.",
        "answer": "Nee. 35 − 12 = 23. Er blijven 23 kinderen. Controle: 23 + 12 = 35."
      }
    ],
    "self": [
      {
        "kind": "Zelf controleren",
        "prompt": "Lees. Duid de vraag en de gegevens aan. Schrijf samen.",
        "type": "text",
        "ref": "",
        "story": "In een doos zitten nog 42 blokjes. We hebben er 25 uitgenomen. Hoeveel blokjes zaten er eerst in?",
        "answer": "42 + 25 = 67\nEr zaten eerst 67 blokjes in de doos.\nControle: 67 − 25 = 42."
      }
    ],
    "map": [
      [
        "1",
        "De passende bewerking kiezen en verklaren."
      ],
      [
        "2",
        "Onbekend begin, onbekende verandering, deel en verschil zoeken."
      ],
      [
        "3 · extra hulp",
        "Eenvoudige verhalen met materiaal controleren."
      ],
      [
        "4 · uitdaging",
        "Grotere getallen en de uitkomst terug in het verhaal plaatsen."
      ]
    ],
    "check": "Laat een nieuw vraagstuk oplossen: de vraag herkennen, passend handelen, een bewerking schrijven en antwoorden op precies de gestelde vraag."
  },
  "17": {
    "number": 17,
    "title": "De getallen tot 100",
    "pages": "74–76",
    "goal": "Lees, schrijf, leg, vergelijk en orden getallen tot 100.",
    "memory": "Een tiental is tien eenheden. Vergelijk eerst de tientallen, dan de eenheden. Op de getallenas staan kleinere getallen links. Van minder naar meer gebruik je <; van meer naar minder gebruik je >.",
    "hint": "Kijk naar tientallen en eenheden. Bij een getallenas: bepaal eerst hoeveel één streepje waard is.",
    "guide": "Laat getallen hardop lezen én schrijven. Gebruik MAB en de getallenas wanneer nodig. Bij dictee: spreek een eigen getal uit zonder het vooraf op het bord te zetten.",
    "intro": [
      {
        "kind": "Weet je nog?",
        "prompt": "Wat is 6 T en 4 E?",
        "type": "text",
        "ref": "",
        "answer": "64"
      },
      {
        "kind": "Buren",
        "prompt": "Wat komt juist vóór en juist na 50?",
        "type": "text",
        "ref": "",
        "answer": "49 en 51"
      }
    ],
    "models": [
      {
        "kind": "MAB lezen",
        "prompt": "Hoeveel tientallen en eenheden zie je? Schrijf het getal.",
        "type": "numberMab",
        "ref": "",
        "a": 67,
        "answer": "6 T en 7 E: 67."
      },
      {
        "kind": "Getal leggen",
        "prompt": "Leg zelf een getal. Een ander kind leest het.",
        "type": "freeMaterial",
        "ref": "",
        "answer": "Controleer: elke staaf telt voor tien, elk blokje voor één."
      },
      {
        "kind": "Getallenas",
        "prompt": "Welk getal hoort bij elk vlaggetje?",
        "type": "numberLine",
        "ref": "",
        "start": 30,
        "end": 50,
        "given": [
          30,
          40,
          50
        ],
        "targets": [
          34,
          43,
          48
        ],
        "answer": "34, 43, 48"
      }
    ],
    "practice": [
      {
        "kind": "Getallendictee",
        "prompt": "Luister naar de leerkracht. Schrijf het getal.",
        "type": "text",
        "ref": "p. 74 · oef. 1",
        "guide": "Dicteer bijvoorbeeld 46. Laat het eerst opschrijven, dan verwoorden in T en E. Dit getal staat alleen in deze leerkrachtnotitie.",
        "answer": "De leerkracht vergelijkt met het gedicteerde getal."
      },
      {
        "kind": "Getal → T en E",
        "prompt": "Vul aan: 46 = … T en … E.",
        "type": "text",
        "ref": "p. 74 · oef. 2",
        "answer": "4 T en 6 E"
      },
      {
        "kind": "T en E → getal",
        "prompt": "Welk getal is 6 T en 4 E?",
        "type": "text",
        "ref": "p. 74 · oef. 3",
        "answer": "64"
      },
      {
        "kind": "Vlaggetjes",
        "prompt": "Schrijf de getallen bij de vlaggetjes.",
        "type": "numberLine",
        "ref": "p. 75 · oef. 4",
        "start": 40,
        "end": 60,
        "given": [
          40,
          50,
          60
        ],
        "targets": [
          42,
          47,
          56
        ],
        "answer": "42, 47, 56"
      },
      {
        "kind": "Sprongen",
        "prompt": "Welke sprong zie je? Vul de vlaggetjes aan.",
        "type": "sequence",
        "ref": "p. 75 · oef. 5",
        "seq": [
          20,
          25,
          null,
          35,
          null,
          null
        ],
        "values": [
          20,
          25,
          30,
          35,
          40,
          45
        ],
        "answer": "Sprongen van 5: 20, 25, 30, 35, 40, 45"
      },
      {
        "kind": "Voor, na en tussen",
        "prompt": "Schrijf de getallen.",
        "type": "text",
        "ref": "p. 75 · oef. 6",
        "lines": "Juist vóór 40: …\nTwee plaatsen na 54: …\nTussen 61 en 63: …",
        "answer": "39; 56; 62"
      },
      {
        "kind": "Vergelijken",
        "prompt": "Vul het teken in: 46 … 64.",
        "type": "text",
        "ref": "p. 76 · oef. 7",
        "answer": "46 < 64"
      },
      {
        "kind": "Minder naar meer",
        "prompt": "Orden van minder naar meer. Schrijf ook de tekens.",
        "type": "text",
        "ref": "p. 76 · oef. 8",
        "lines": "42     24     62     46     26",
        "answer": "24 < 26 < 42 < 46 < 62"
      },
      {
        "kind": "Meer naar minder",
        "prompt": "Orden van meer naar minder. Schrijf ook de tekens.",
        "type": "text",
        "ref": "p. 76 · oef. 9",
        "lines": "81     18     58     85     51",
        "answer": "85 > 81 > 58 > 51 > 18"
      },
      {
        "kind": "Getallendictee",
        "prompt": "Luister naar de leerkracht. Schrijf het getal.",
        "type": "text",
        "ref": "p. 74 · oef. 1",
        "guide": "Dicteer bijvoorbeeld 72. Laat het eerst opschrijven, dan verwoorden in T en E. Dit getal staat alleen in deze leerkrachtnotitie.",
        "answer": "De leerkracht vergelijkt met het gedicteerde getal."
      },
      {
        "kind": "Getal → T en E",
        "prompt": "Vul aan: 72 = … T en … E.",
        "type": "text",
        "ref": "p. 74 · oef. 2",
        "answer": "7 T en 2 E"
      },
      {
        "kind": "T en E → getal",
        "prompt": "Welk getal is 2 T en 7 E?",
        "type": "text",
        "ref": "p. 74 · oef. 3",
        "answer": "27"
      },
      {
        "kind": "Vlaggetjes",
        "prompt": "Schrijf de getallen bij de vlaggetjes.",
        "type": "numberLine",
        "ref": "p. 75 · oef. 4",
        "start": 50,
        "end": 70,
        "given": [
          50,
          60,
          70
        ],
        "targets": [
          52,
          57,
          66
        ],
        "answer": "52, 57, 66"
      },
      {
        "kind": "Sprongen",
        "prompt": "Welke sprong zie je? Vul de vlaggetjes aan.",
        "type": "sequence",
        "ref": "p. 75 · oef. 5",
        "seq": [
          30,
          35,
          null,
          45,
          null,
          null
        ],
        "values": [
          30,
          35,
          40,
          45,
          50,
          55
        ],
        "answer": "Sprongen van 5: 30, 35, 40, 45, 50, 55"
      },
      {
        "kind": "Voor, na en tussen",
        "prompt": "Schrijf de getallen.",
        "type": "text",
        "ref": "p. 75 · oef. 6",
        "lines": "Juist vóór 50: …\nTwee plaatsen na 64: …\nTussen 71 en 73: …",
        "answer": "49; 66; 72"
      },
      {
        "kind": "Vergelijken",
        "prompt": "Vul het teken in: 72 … 27.",
        "type": "text",
        "ref": "p. 76 · oef. 7",
        "answer": "72 > 27"
      },
      {
        "kind": "Minder naar meer",
        "prompt": "Orden van minder naar meer. Schrijf ook de tekens.",
        "type": "text",
        "ref": "p. 76 · oef. 8",
        "lines": "42     24     62     46     26",
        "answer": "24 < 26 < 42 < 46 < 62"
      },
      {
        "kind": "Meer naar minder",
        "prompt": "Orden van meer naar minder. Schrijf ook de tekens.",
        "type": "text",
        "ref": "p. 76 · oef. 9",
        "lines": "81     18     58     85     51",
        "answer": "85 > 81 > 58 > 51 > 18"
      },
      {
        "kind": "Getallendictee",
        "prompt": "Luister naar de leerkracht. Schrijf het getal.",
        "type": "text",
        "ref": "p. 74 · oef. 1",
        "guide": "Dicteer bijvoorbeeld 85. Laat het eerst opschrijven, dan verwoorden in T en E. Dit getal staat alleen in deze leerkrachtnotitie.",
        "answer": "De leerkracht vergelijkt met het gedicteerde getal."
      },
      {
        "kind": "Getal → T en E",
        "prompt": "Vul aan: 85 = … T en … E.",
        "type": "text",
        "ref": "p. 74 · oef. 2",
        "answer": "8 T en 5 E"
      },
      {
        "kind": "T en E → getal",
        "prompt": "Welk getal is 5 T en 8 E?",
        "type": "text",
        "ref": "p. 74 · oef. 3",
        "answer": "58"
      },
      {
        "kind": "Vlaggetjes",
        "prompt": "Schrijf de getallen bij de vlaggetjes.",
        "type": "numberLine",
        "ref": "p. 75 · oef. 4",
        "start": 60,
        "end": 80,
        "given": [
          60,
          70,
          80
        ],
        "targets": [
          62,
          67,
          76
        ],
        "answer": "62, 67, 76"
      },
      {
        "kind": "Sprongen",
        "prompt": "Welke sprong zie je? Vul de vlaggetjes aan.",
        "type": "sequence",
        "ref": "p. 75 · oef. 5",
        "seq": [
          40,
          45,
          null,
          55,
          null,
          null
        ],
        "values": [
          40,
          45,
          50,
          55,
          60,
          65
        ],
        "answer": "Sprongen van 5: 40, 45, 50, 55, 60, 65"
      },
      {
        "kind": "Voor, na en tussen",
        "prompt": "Schrijf de getallen.",
        "type": "text",
        "ref": "p. 75 · oef. 6",
        "lines": "Juist vóór 60: …\nTwee plaatsen na 74: …\nTussen 81 en 83: …",
        "answer": "59; 76; 82"
      },
      {
        "kind": "Vergelijken",
        "prompt": "Vul het teken in: 85 … 58.",
        "type": "text",
        "ref": "p. 76 · oef. 7",
        "answer": "85 > 58"
      },
      {
        "kind": "Minder naar meer",
        "prompt": "Orden van minder naar meer. Schrijf ook de tekens.",
        "type": "text",
        "ref": "p. 76 · oef. 8",
        "lines": "42     24     62     46     26",
        "answer": "24 < 26 < 42 < 46 < 62"
      },
      {
        "kind": "Meer naar minder",
        "prompt": "Orden van meer naar minder. Schrijf ook de tekens.",
        "type": "text",
        "ref": "p. 76 · oef. 9",
        "lines": "81     18     58     85     51",
        "answer": "85 > 81 > 58 > 51 > 18"
      }
    ],
    "self": [
      {
        "kind": "Zelf proberen",
        "prompt": "Schrijf van meer naar minder, met de juiste tekens.",
        "type": "text",
        "ref": "",
        "lines": "36     63     26     62",
        "answer": "63 > 62 > 36 > 26"
      }
    ],
    "map": [
      [
        "1",
        "Getallendictee."
      ],
      [
        "2–3",
        "Getal ↔ tientallen en eenheden."
      ],
      [
        "4",
        "Getallen bij vlaggetjes op de getallenas."
      ],
      [
        "5–6",
        "Sprongen, voor, na en tussen."
      ],
      [
        "7",
        "Getallen vergelijken met <, > en =."
      ],
      [
        "8–9",
        "Ordenen van minder naar meer en omgekeerd."
      ]
    ],
    "check": "Dicteer een nieuw getal. Laat het leggen, op de getallenas plaatsen en met een ander getal vergelijken."
  }
};
