'use strict';
const sudokuImageBase = new URL("https://zisa-sudokuprenten.pages.dev/sudoku_afbeeldingen/");
const sudokuSharedImages = {
  "Carnaval/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/A.webp",
  "Carnaval/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/B.webp",
  "Carnaval/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/C.webp",
  "Carnaval/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/D.webp",
  "Carnaval/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/E.webp",
  "Carnaval/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/F.webp",
  "Carnaval/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/G.webp",
  "Carnaval/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/H.webp",
  "Carnaval/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/I.webp",
  "Carnaval/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/J.webp",
  "Carnaval/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/K.webp",
  "Carnaval/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/L.webp",
  "Carnaval/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/M.webp",
  "Carnaval/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/N.webp",
  "Carnaval/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/O.webp",
  "Carnaval/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/R.webp",
  "Carnaval/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/S.webp",
  "Carnaval/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/T.webp",
  "Carnaval/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/U.webp",
  "Carnaval/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Carnaval/P.webp",
  "Halloween/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/A.webp",
  "Halloween/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/T.webp",
  "Halloween/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/C.webp",
  "Halloween/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/D.webp",
  "Halloween/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/E.webp",
  "Halloween/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/F.webp",
  "Halloween/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/G.webp",
  "Halloween/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/H.webp",
  "Halloween/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/I.webp",
  "Halloween/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/J.webp",
  "Halloween/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/K.webp",
  "Halloween/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/L.webp",
  "Halloween/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/M.webp",
  "Halloween/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/N.webp",
  "Halloween/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/O.webp",
  "Halloween/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/P.webp",
  "Halloween/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/R.webp",
  "Halloween/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/S.webp",
  "Halloween/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/V.webp",
  "Halloween/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Halloween/Z.webp",
  "Kerst/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/A.webp",
  "Kerst/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/B.webp",
  "Kerst/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/C.webp",
  "Kerst/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/D.webp",
  "Kerst/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/E.webp",
  "Kerst/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/F.webp",
  "Kerst/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/G.webp",
  "Kerst/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/H.webp",
  "Kerst/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/I.webp",
  "Kerst/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/J.webp",
  "Kerst/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/K.webp",
  "Kerst/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/M.webp",
  "Kerst/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/N.webp",
  "Kerst/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/O.webp",
  "Kerst/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/P.webp",
  "Kerst/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/U.webp",
  "Kerst/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/T.webp",
  "Kerst/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/W.webp",
  "Kerst/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/S.webp",
  "Kerst/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Kerst/V.webp",
  "Pasen/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/A.webp",
  "Pasen/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/B.webp",
  "Pasen/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/C.webp",
  "Pasen/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/E.webp",
  "Pasen/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/F.webp",
  "Pasen/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/H.webp",
  "Pasen/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/I.webp",
  "Pasen/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/J.webp",
  "Pasen/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/K.webp",
  "Pasen/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/L.webp",
  "Pasen/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/M.webp",
  "Pasen/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/N.webp",
  "Pasen/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/O.webp",
  "Pasen/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/P.webp",
  "Pasen/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/R.webp",
  "Pasen/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/S.webp",
  "Pasen/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/T.webp",
  "Pasen/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/U.webp",
  "Pasen/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/V.webp",
  "Pasen/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Pasen/W.webp",
  "Sinterklaas/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/B.webp",
  "Sinterklaas/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/C.webp",
  "Sinterklaas/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/D.webp",
  "Sinterklaas/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/E.webp",
  "Sinterklaas/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/F.webp",
  "Sinterklaas/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/G.webp",
  "Sinterklaas/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/H.webp",
  "Sinterklaas/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/I.webp",
  "Sinterklaas/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/J.webp",
  "Sinterklaas/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/K.webp",
  "Sinterklaas/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/L.webp",
  "Sinterklaas/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/M.webp",
  "Sinterklaas/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/N.webp",
  "Sinterklaas/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/O.webp",
  "Sinterklaas/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/P.webp",
  "Sinterklaas/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/R.webp",
  "Sinterklaas/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/A.webp",
  "Sinterklaas/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/T.webp",
  "Sinterklaas/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/V.webp",
  "Sinterklaas/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/Sinterklaas/Z.webp",
  "herfst/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/A.webp",
  "herfst/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/B.webp",
  "herfst/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/D.webp",
  "herfst/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/E.webp",
  "herfst/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/F.webp",
  "herfst/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/G.webp",
  "herfst/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/H.webp",
  "herfst/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/J.webp",
  "herfst/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/K.webp",
  "herfst/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/L.webp",
  "herfst/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/M.webp",
  "herfst/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/N.webp",
  "herfst/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/O.webp",
  "herfst/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/P.webp",
  "herfst/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/R.webp",
  "herfst/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/S.webp",
  "herfst/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/T.webp",
  "herfst/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/U.webp",
  "herfst/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/herfst/C.webp",
  "lente/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/A.webp",
  "lente/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/B.webp",
  "lente/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/C.webp",
  "lente/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/D.webp",
  "lente/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/E.webp",
  "lente/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/F.webp",
  "lente/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/G.webp",
  "lente/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/H.webp",
  "lente/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/I.webp",
  "lente/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/J.webp",
  "lente/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/K.webp",
  "lente/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/L.webp",
  "lente/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/M.webp",
  "lente/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/N.webp",
  "lente/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/O.webp",
  "lente/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/P.webp",
  "lente/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/R.webp",
  "lente/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/S.webp",
  "lente/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/T.webp",
  "lente/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/lente/U.webp",
  "terug_naar_school/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/A.webp",
  "terug_naar_school/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/B.webp",
  "terug_naar_school/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/C.webp",
  "terug_naar_school/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/D.webp",
  "terug_naar_school/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/E.webp",
  "terug_naar_school/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/F.webp",
  "terug_naar_school/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/G.webp",
  "terug_naar_school/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/H.webp",
  "terug_naar_school/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/I.webp",
  "terug_naar_school/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/J.webp",
  "terug_naar_school/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/K.webp",
  "terug_naar_school/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/L.webp",
  "terug_naar_school/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/M.webp",
  "terug_naar_school/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/N.webp",
  "terug_naar_school/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/O.webp",
  "terug_naar_school/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/P.webp",
  "terug_naar_school/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/R.webp",
  "terug_naar_school/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/S.webp",
  "terug_naar_school/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/T.webp",
  "terug_naar_school/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/terug_naar_school/Z.webp",
  "winter/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/A.webp",
  "winter/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/B.webp",
  "winter/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/C.webp",
  "winter/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/D.webp",
  "winter/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/E.webp",
  "winter/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/F.webp",
  "winter/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/G.webp",
  "winter/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/H.webp",
  "winter/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/I.webp",
  "winter/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/J.webp",
  "winter/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/K.webp",
  "winter/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/L.webp",
  "winter/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/M.webp",
  "winter/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/N.webp",
  "winter/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/O.webp",
  "winter/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/P.webp",
  "winter/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/R.webp",
  "winter/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/S.webp",
  "winter/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/T.webp",
  "winter/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/winter/V.webp",
  "zomer/01": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/A.webp",
  "zomer/02": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/B.webp",
  "zomer/03": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/C.webp",
  "zomer/04": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/D.webp",
  "zomer/05": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/E.webp",
  "zomer/06": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/F.webp",
  "zomer/07": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/G.webp",
  "zomer/08": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/H.webp",
  "zomer/09": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/I.webp",
  "zomer/10": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/J.webp",
  "zomer/11": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/K.webp",
  "zomer/12": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/L.webp",
  "zomer/13": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/M.webp",
  "zomer/14": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/N.webp",
  "zomer/15": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/O.webp",
  "zomer/16": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/P.webp",
  "zomer/17": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/R.webp",
  "zomer/18": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/S.webp",
  "zomer/19": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/T.webp",
  "zomer/20": "https://zisa-lenteproef.pages.dev/thema_afbeeldingen/zomer/U.webp"
};
document.addEventListener('DOMContentLoaded', () => {
    const { GRID_SPECS, shuffle, createSudokuWithDifficulty, planPages } = window.SudokuV2;
    const $ = id => document.getElementById(id);
    const canvas = $('mainCanvas');
    const type = () => document.querySelector('[name="sudokuType"]:checked').value;
    const variety = () => document.querySelector('[name="imageVariety"]:checked').value;
    const size = () => Number($('gridSizeSelect').value);
    const count = () => Number($('aantalSudokus').value);
    const themeCount = () => window.SUDOKU_THEME_COUNTS?.[$('themeSelect').value] || 20;
    const needed = () => size() * (variety() === 'different' ? count() : 1);
    const downloadButtons = ['downloadPngBtn', 'downloadPdfBtn', 'toggleSolutionsBtn', 'downloadSolutionsPdfBtn'];
    let themeImages = [], selectedImages = [], uploads = [];
    let worksheet = null, pages = [], pageIndex = 0, showingSolutions = false;
    let sourceRevision = 0, generationRevision = 0, loadingImages = false, generating = false;
    let sourceError = '';

    function message(text, error = false) {
        $('meldingContainer').textContent = text;
        $('meldingContainer').style.color = error ? '#a32121' : '#17476d';
    }
    function ready() {
        return type() === 'getallen' || (!loadingImages && !sourceError &&
            ($('themeSelect').value ? selectedImages.length === needed() : uploads.length >= needed()));
    }
    function invalidate() {
        generationRevision++;
        generating = false;
        worksheet = null; pages = []; pageIndex = 0; showingSolutions = false;
        canvas.width = 840; canvas.height = 1188;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#526b82'; ctx.font = '24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Kies je instellingen en afbeeldingen.', 420, 140);
        updateButtons();
    }
    function updateButtons() {
        canvas.dataset.pageCount = String(pages.length);
        downloadButtons.forEach(id => { $(id).disabled = !worksheet || generating || (type() === 'afbeeldingen' && loadingImages); });
        $('genereerBtn').disabled = !ready() || generating;
        $('confirmThemeImagesBtn').disabled = !ready() || generating;
        $('autoThemeImagesBtn').disabled = loadingImages || generating || themeImages.length < needed();
        $('toggleSolutionsBtn').textContent = showingSolutions ? 'Terug naar werkblad' : 'Oplossingen tonen';
        $('downloadPdfBtn').textContent = showingSolutions ? '↓ PDF oplossingen' : '↓ PDF werkblad';
        $('previousPageBtn').disabled = pageIndex <= 0 || !pages.length;
        $('nextPageBtn').disabled = pageIndex >= pages.length - 1;
        $('pageIndicator').textContent = pages.length ? `Pagina ${pageIndex + 1} van ${pages.length}` : 'Nog geen werkblad';
        $('previewStatus').textContent = pages.length
            ? `${pages.length} pagina${pages.length === 1 ? '' : "’s"}. PDF en PNG bevatten alle pagina’s van deze weergave.` : '';
        $('main-content').setAttribute('aria-busy', String(generating || loadingImages));
    }
    function updateUi() {
        const images = type() === 'afbeeldingen';
        $('imageSettings').hidden = !images;
        const theme = $('themeSelect').value;
        const different = document.querySelector('[name="imageVariety"][value="different"]');
        const impossible = images && Boolean(theme) && size() * count() > themeCount();
        different.disabled = impossible;
        if (impossible && different.checked) document.querySelector('[name="imageVariety"][value="same"]').checked = true;
        selectedImages = selectedImages.slice(0, needed());
        $('themeSelectionGroup').style.display = images ? 'flex' : 'none';
        $('image-variety-controls').style.display = images && count() > 1 ? 'flex' : 'none';
        $('themeImageSelection').style.display = images && theme ? 'flex' : 'none';
        $('image-controls').style.display = images && !theme ? 'block' : 'none';
        $('varietyHint').textContent = impossible
            ? `Dit thema bevat ${themeCount()} afbeeldingen. Voor deze combinatie gebruiken we dezelfde afbeeldingen. Kies minder sudoku’s of upload eigen afbeeldingen voor aparte sets.` : '';
        $('aantalMelding').textContent = (size() === 4
            ? 'Tot 4 sudoku’s op een roosterpagina.'
            : 'Eén sudoku per roosterpagina.') + (images ? ' Knipstroken komen op extra pagina’s.' : '');
        $('themeImageSelectionLabel').textContent = `Kies ${needed()} afbeeldingen uit het thema (${selectedImages.length} geselecteerd):`;
        $('imageInputLabel').textContent = `Upload minstens ${needed()} verschillende afbeeldingen:`;
        if (images && loadingImages) message('Afbeeldingen laden…');
        else if (images && sourceError) message(sourceError, true);
        else if (images && !ready()) {
            const amount = theme ? selectedImages.length : uploads.length;
            message(`Nog ${Math.max(0, needed()-amount)} afbeeldingen nodig.`, true);
        } else if (!generating) message(images ? 'Afbeeldingen klaar. Je kunt een nieuwe sudoku maken.' : '');
        renderImageChoices(); updateButtons();
    }
    function renderImageChoices() {
        const choices = $('selectableThemeImagePreviews');
        const scrollTop = choices.scrollTop;
        const focusedIndex = Array.from(choices.children).indexOf(document.activeElement);
        $('selectableThemeImagePreviews').replaceChildren(); $('image-previews').replaceChildren();
        const theme = $('themeSelect').value;
        const parent = theme ? $('selectableThemeImagePreviews') : $('image-previews');
        (theme ? themeImages : uploads).forEach((img, index) => {
            const wrapper = document.createElement(theme ? 'button' : 'div');
            wrapper.className = 'theme-image-wrapper';
            const chosen = selectedImages.includes(img);
            if (chosen) wrapper.classList.add('selected');
            const preview = document.createElement('img');
            preview.src = img.src; preview.alt = `Afbeelding ${index + 1}`;
            wrapper.appendChild(preview); parent.appendChild(wrapper);
            if (theme) {
                wrapper.type = 'button'; wrapper.setAttribute('aria-pressed', String(chosen));
                wrapper.addEventListener('click', () => {
                    if (!chosen && selectedImages.length >= needed()) return;
                    selectedImages = chosen ? selectedImages.filter(value => value !== img) : [...selectedImages, img];
                    invalidate(); updateUi();
                });
            }
        });
        if (focusedIndex >= 0) choices.children[focusedIndex]?.focus({ preventScroll: true });
        choices.scrollTop = scrollTop;
    }
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            if (/^https?:/.test(src)) img.crossOrigin = "anonymous";
            img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('Lege afbeelding'));
            img.onerror = () => reject(new Error('Afbeelding kon niet worden geladen'));
            img.src = src;
        });
    }
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen'));
            reader.onabort = () => reject(new Error('Bestand lezen afgebroken'));
            reader.readAsDataURL(file);
        });
    }
    async function changeTheme() {
        const revision = ++sourceRevision;
        const theme = $('themeSelect').value;
        themeImages = []; selectedImages = []; sourceError = ''; loadingImages = Boolean(theme);
        invalidate(); updateUi();
        if (!theme) { loadingImages = false; updateUi(); if (ready()) await generate(); return; }
        try {
            const results = await Promise.all(Array.from({length: themeCount()}, (_, i) =>
                loadImage(sudokuSharedImages[`${theme}/${String(i+1).padStart(2, '0')}`] || new URL(`${theme}/${String(i+1).padStart(2, '0')}.webp`, sudokuImageBase).href)));
            if (revision !== sourceRevision) return;
            themeImages = results;
        } catch (error) {
            if (revision !== sourceRevision) return;
            sourceError = 'Dit thema kon niet worden geladen. Kies het thema opnieuw via de lege keuze, of kies een ander thema.';
        } finally {
            if (revision === sourceRevision) { loadingImages = false; updateUi(); }
        }
    }
    async function uploadFiles(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        const revision = ++sourceRevision;
        uploads = []; sourceError = ''; loadingImages = true;
        invalidate(); updateUi();
        try {
            const urls = [...new Set(await Promise.all(files.map(readFile)))];
            const loaded = await Promise.all(urls.map(loadImage));
            if (revision !== sourceRevision) return;
            uploads = loaded;
        } catch (error) {
            if (revision !== sourceRevision) return;
            sourceError = 'Een bestand is geen leesbare afbeelding. Kies de afbeeldingen opnieuw.';
        } finally {
            if (revision === sourceRevision) {
                loadingImages = false; $('imageInput').value = ''; updateUi();
                if (ready()) await generate();
            }
        }
    }
    async function generate() {
        if (!ready()) { invalidate(); updateUi(); return; }
        const revision = ++generationRevision;
        generating = true; updateButtons(); message('Sudoku’s maken en oplossingen controleren…');
        await new Promise(resolve => setTimeout(resolve, 0));
        if (revision !== generationRevision) return;
        try {
            const config = { size: size(), type: type(), difficulty: $('difficulty').value, puzzles: [] };
            const amount = count();
            const source = $('themeSelect').value ? selectedImages : uploads;
            const separate = variety() === 'different';
            for (let i = 0; i < amount; i++) {
                const { puzzle, solution } = createSudokuWithDifficulty(config.size, config.difficulty);
                const offset = separate ? i*config.size : 0;
                const images = config.type === 'afbeeldingen' ? source.slice(offset, offset+config.size) : [];
                const missing = [];
                puzzle.forEach((row, r) => row.forEach((value, c) => { if (!value) missing.push(solution[r][c]); }));
                shuffle(missing);
                config.puzzles.push({ puzzle, solution, images, missing });
                await new Promise(resolve => setTimeout(resolve, 0));
                if (revision !== generationRevision) return;
            }
            worksheet = config; showingSolutions = false; pageIndex = 0;
            pages = planPages(worksheet); renderPreview();
            message('Werkblad klaar. Druk af op ware grootte (100%) zodat de knipplaatjes passen.');
        } catch (error) {
            invalidate(); message('Het werkblad kon niet worden gemaakt. Probeer opnieuw.', true);
            console.error(error);
        } finally {
            if (revision === generationRevision) { generating = false; updateButtons(); }
        }
    }
    function drawImage(ctx, image, x, y, side) {
        const ratio = Math.min(side/image.naturalWidth, side/image.naturalHeight);
        const w = image.naturalWidth*ratio, h = image.naturalHeight*ratio;
        ctx.drawImage(image, x+(side-w)/2, y+(side-h)/2, w, h);
    }
    function drawGrid(ctx, item, showSolutions) {
        const { index, x, y, side } = item;
        const data = worksheet.puzzles[index], n = worksheet.size, cell = side/n;
        const grid = showSolutions ? data.solution : data.puzzle;
        ctx.fillStyle = '#17476d'; ctx.font = 'bold 3.8px Arial'; ctx.textAlign = 'left';
        ctx.fillText(`Sudoku ${index+1}`, x, y-4);
        for (let r=0; r<n; r++) for (let c=0; c<n; c++) {
            const value = grid[r][c]; if (!value) continue;
            const added = showSolutions && data.puzzle[r][c] === 0;
            const cx = x+c*cell, cy = y+r*cell;
            if (worksheet.type === 'getallen') {
                ctx.fillStyle = added ? '#16834f' : '#111'; ctx.font = `${cell*0.55}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(String(value), cx+cell/2, cy+cell/2);
                ctx.textBaseline = 'alphabetic';
            } else {
                drawImage(ctx, data.images[value-1], cx+cell*0.12, cy+cell*0.12, cell*0.76);
                if (added) { ctx.strokeStyle = '#16834f'; ctx.lineWidth = 0.6; ctx.strokeRect(cx+1,cy+1,cell-2,cell-2); }
            }
        }
        const spec = GRID_SPECS[n]; ctx.strokeStyle = '#17476d';
        for (let i=0; i<=n; i++) {
            ctx.lineWidth = i%spec.blockCols === 0 ? 0.7 : 0.22;
            ctx.beginPath(); ctx.moveTo(x+i*cell,y); ctx.lineTo(x+i*cell,y+side); ctx.stroke();
            ctx.lineWidth = i%spec.blockRows === 0 ? 0.7 : 0.22;
            ctx.beginPath(); ctx.moveTo(x,y+i*cell); ctx.lineTo(x+side,y+i*cell); ctx.stroke();
        }
    }
    function renderPage(page, index, total, target = document.createElement('canvas'), scale = 4) {
        target.width = 210*scale; target.height = 297*scale;
        const ctx = target.getContext('2d'); ctx.scale(scale,scale);
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,210,297);
        ctx.fillStyle = '#17476d'; ctx.font = '3.5px Arial'; ctx.textAlign = 'left';
        ctx.fillText('Naam: __________________________',10,14);
        ctx.fillText('Datum: _______________',135,14);
        const cuts = page.kind === 'cuts';
        ctx.font = 'bold 6px Arial'; ctx.textAlign = 'center';
        ctx.fillText(cuts ? 'KNIPSTROKEN SUDOKU' : page.solutions ? 'OPLOSSINGEN SUDOKU' : 'SUDOKU',105,25);
        ctx.font = '3.5px Arial'; ctx.fillStyle = '#43566b';
        ctx.fillText(cuts ? 'Knip de plaatjes uit en plak ze bij de juiste sudoku.' : page.solutions
            ? 'De aangevulde vakjes zijn groen gemarkeerd.'
            : `Elk ${worksheet.type === 'getallen' ? 'getal' : 'plaatje'} komt één keer voor in elke rij, kolom en elk dik omlijnd blok.`,105,33);
        if (cuts) {
            for (const section of page.sections) {
                const data = worksheet.puzzles[section.index];
                ctx.textAlign = 'left'; ctx.font = 'bold 4px Arial'; ctx.fillStyle = '#17476d';
                ctx.fillText(`Voor sudoku ${section.index+1}`,section.x,section.y+4);
                data.missing.forEach((value,i) => {
                    const x = section.x+(i%section.columns)*(section.cell+3);
                    const y = section.y+10+Math.floor(i/section.columns)*(section.cell+3);
                    ctx.strokeStyle = '#526b82'; ctx.lineWidth = 0.25; ctx.setLineDash([1,1]);
                    ctx.strokeRect(x,y,section.cell,section.cell); ctx.setLineDash([]);
                    drawImage(ctx,data.images[value-1],x+section.cell*0.12,y+section.cell*0.12,section.cell*0.76);
                });
            }
        } else page.grids.forEach(grid => drawGrid(ctx,grid,page.solutions));
        ctx.fillStyle = '#526b82'; ctx.font = '3px Arial'; ctx.textAlign = 'left';
        ctx.fillText('Afdrukken op ware grootte (100%).',10,290);
        ctx.textAlign = 'right'; ctx.fillText(`Pagina ${index+1} van ${total}`,200,290);
        return target;
    }
    function renderPreview() {
        if (!worksheet || !pages.length) return;
        renderPage(pages[pageIndex],pageIndex,pages.length,canvas); updateButtons();
    }
    function saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    function downloadPng() {
        if (!worksheet || generating) return;
        // Eén bestand voorkomt dat de browser meerdere downloads blokkeert.
        const combined = document.createElement('canvas');
        const filename = `sudoku-${showingSolutions ? 'oplossingen' : 'werkblad'}-alle-paginas.png`;
        const scale = 3, height = 297*scale;
        combined.width = 210*scale; combined.height = height*pages.length;
        const ctx = combined.getContext('2d');
        pages.forEach((page,i) => ctx.drawImage(renderPage(page,i,pages.length,undefined,scale),0,i*height));
        combined.toBlob(blob => {
            if (blob) saveBlob(blob,filename);
            else message('PNG maken is mislukt. Probeer PDF.',true);
        },'image/png');
    }
    function downloadPdf(solutions = showingSolutions) {
        if (!worksheet || generating) return;
        try {
            if (!window.jspdf?.jsPDF) throw new Error('PDF-bibliotheek niet geladen');
            const exported = planPages(worksheet,solutions);
            const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            exported.forEach((page,i) => {
                if (i) doc.addPage();
                doc.addImage(renderPage(page,i,exported.length),'PNG',0,0,210,297,undefined,'FAST');
            });
            doc.save(`sudoku-${solutions ? 'oplossingen' : 'werkblad'}-${worksheet.size}x${worksheet.size}.pdf`);
        } catch (error) { message('PDF maken is mislukt. Vernieuw de pagina en probeer opnieuw.',true); console.error(error); }
    }
    document.querySelectorAll('[name="sudokuType"], [name="imageVariety"], #gridSizeSelect, #aantalSudokus, #difficulty').forEach(el => {
        el.addEventListener('change', () => { invalidate(); updateUi(); if (ready()) generate(); });
    });
    $('themeSelect').addEventListener('change',changeTheme);
    $('imageInput').addEventListener('change',uploadFiles);
    $('clearImagesBtn').addEventListener('click', () => {
        sourceRevision++; uploads = []; sourceError = ''; loadingImages = false; $('imageInput').value = '';
        invalidate(); updateUi();
    });
    $('genereerBtn').addEventListener('click',generate);
    $('confirmThemeImagesBtn').addEventListener('click',generate);
    $('autoThemeImagesBtn').addEventListener('click', () => {
        if (loadingImages || themeImages.length < needed()) return;
        selectedImages = shuffle([...themeImages]).slice(0, needed());
        invalidate(); updateUi(); generate();
    });
    $('toggleSolutionsBtn').addEventListener('click', () => {
        if (!worksheet) return;
        showingSolutions = !showingSolutions; pages = planPages(worksheet,showingSolutions); pageIndex = 0; renderPreview();
    });
    $('downloadPngBtn').addEventListener('click',downloadPng);
    $('downloadPdfBtn').addEventListener('click', () => downloadPdf());
    $('downloadSolutionsPdfBtn').addEventListener('click', () => downloadPdf(true));
    $('previousPageBtn').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPreview(); } });
    $('nextPageBtn').addEventListener('click', () => { if (pageIndex+1 < pages.length) { pageIndex++; renderPreview(); } });
    updateUi(); generate();
});
