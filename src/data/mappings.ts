// Component mappings from KNOWLEDGE.md

export const SERIES: Record<string, { name: string; collection: string }> = {
  S1: { name: "Sofa Mar", collection: "Viena" },
  S2: { name: "Sofa Elma", collection: "Elma" },
};

export const FABRICS: Record<string, { name: string; group: number; colors: Record<string, string> }> = {
  T1: { name: "Guilty", group: 1, colors: { A: "Sand", B: "Cement", C: "Pearl" } },
  T2: { name: "Portland", group: 1, colors: { A: "Cream", B: "Ash", C: "Moss", D: "Taupe", E: "Rust" } },
  T3: { name: "Cloud", group: 1, colors: { A: "3", B: "39", C: "79", D: "83", E: "91" } },
  T4: { name: "Tribue", group: 2, colors: { A: "Ivory", B: "Fog", C: "Green", D: "Pearl", E: "Toffee" } },
  T5: { name: "Brooklyn", group: 2, colors: { A: "Pearl", B: "Beige", C: "Mud", D: "Fog", E: "Cement" } },
  T6: { name: "Bronx", group: 2, colors: { A: "Camel", B: "Beige", C: "Light Grey", D: "Taupe", E: "Ocean" } },
  T7: { name: "Casino", group: 2, colors: { A: "Sand", B: "Deep Green", C: "Fog", D: "Pearl", E: "Terracotta" } },
  T8: { name: "Seattle", group: 3, colors: { A: "Sand", B: "Toffee", C: "Cream", D: "Camel", E: "Light Grey" } },
  T9: { name: "Macau", group: 3, colors: { A: "Sand", B: "Gold", C: "Ash", D: "Pearl", E: "Forrest" } },
  T10: { name: "Puente", group: 1, colors: { A: "06", B: "3", C: "80", D: "92", E: "37" } },
  T11: { name: "Legend Natural - Ascot", group: 3, colors: { A: "Pearl", B: "Cream/Nata", C: "Taupe/Toffee", D: "Deep Terra/Brick", E: "Grey/Taupe" } },
  T12: { name: "Bliss", group: 3, colors: { A: "Cream", B: "Sand", C: "Fog", D: "Khaki", E: "Stone" } },
  T13: { name: "Zoom 1", group: 1, colors: { A: "Cream", B: "Mink", C: "Toffee", D: "Winter Moss", E: "Dove", F: "Ash" } },
};

export const SEAT_TYPES: Record<string, string> = {
  N: "Niskie",
  ND: "Niskie dzielone",
  W: "Wysokie",
  "": "Standardowe",
};

// Seats for SOFA (S1 series)
export const SEATS_SOFA_S1: Record<string, { frame: string; foam: string; front: string; midStrip: boolean }> = {
  "SD01N": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "17 x 190 x 2 VP30 [Viena]", midStrip: false },
  "SD01ND": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "17 x 190 x 2 VP30 [Viena]", midStrip: true },
  "SD01W": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "23 x 190 x 2 VP30", midStrip: false },
  "SD02N": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "Półwałek SD02N", midStrip: false },
  "SD02ND": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "Półwałek SD02N", midStrip: true },
  "SD02W": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "Półwałek SD02W", midStrip: false },
  "SD03": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "17 x 190 x 2 VP30 [Viena]", midStrip: false },
  "SD04": { frame: "S1-SD-190 [Viena]", foam: "78 x 190 x 9 VPPT 30-40 [Viena]", front: "Półwałek SD04", midStrip: false },
};

// Seats for PUFA
export const SEATS_PUFA: Record<string, { frontBack: string; sides: string; foam: string; box: string }> = {
  "SD01N": { frontBack: "17 x 63 x 1", sides: "17 x 63 x 1", foam: "16 x 62 x 62", box: "13 cm" },
  "SD01ND": { frontBack: "17 x 63 x 1", sides: "17 x 63 x 1", foam: "16 x 62 x 62", box: "13 cm" },
  "SD01W": { frontBack: "23 x 63 x 1", sides: "23 x 63 x 1", foam: "18 x 62 x 62", box: "8 cm" },
  "SD02N": { frontBack: "Półwałek SD02N", sides: "17 x 63 x 1", foam: "16 x 62 x 62", box: "13 cm" },
  "SD02ND": { frontBack: "Półwałek SD02N", sides: "17 x 63 x 1", foam: "16 x 62 x 62", box: "13 cm" },
  "SD02NB": { frontBack: "Półwałek SD02N", sides: "Półwałek SD02N", foam: "16 x 62 x 62", box: "13 cm" },
  "SD02W": { frontBack: "Półwałek SD02W", sides: "23 x 63 x 1", foam: "18 x 62 x 62", box: "8 cm" },
  "SD03": { frontBack: "17 x 63 x 1", sides: "17 x 63 x 1", foam: "16 x 62 x 62", box: "13 cm" },
  "SD04": { frontBack: "Półwałek SD04", sides: "Półwałek SD04", foam: "16 x 62 x 62", box: "13 cm" },
};

export const BACKRESTS: Record<string, { frame: string; foam: string; top: string; height: string }> = {
  OP62: { frame: "S1-OP62-190", foam: "62.5 x 190 x 9 VPPT 30-40 [Viena]", top: "19 x 190 x 2 VP30 [Viena]", height: "62" },
  OP68: { frame: "S1-OP68-190", foam: "68 x 190 x 9 VPPT 30-40 [Viena]", top: "19 x 190 x 2 VP30 [Viena]", height: "68" },
};

export const SIDES: Record<string, { frame: string; name: string }> = {
  B1: { frame: "B1 [Roland]", name: "Roland" },
  B2: { frame: "B2 [Arte]", name: "Arte" },
  B3: { frame: "B3 [Urano]", name: "Urano" },
  B4: { frame: "B4 [Nord]", name: "Nord" },
  B5: { frame: "B5 [Herford]", name: "Herford" },
  B6: { frame: "B6/B8 [Iga\\Vamos]", name: "Iga A" },
  B7: { frame: "B7 [Iga I]", name: "Iga B" },
  B8: { frame: "B6/B8 [Iga\\Vamos]", name: "Iga C" },
  B6s: { frame: "B6/B8 [Iga\\Vamos]", name: "Iga A" },
  B6w: { frame: "B10 [Iga\\Vamos Cienka]", name: "Iga A Wąska" },
  B9: { frame: "B9 [Viena]", name: "Viena" },
};

export const CHESTS: Record<string, { name: string; legHeight: number; legCount: number }> = {
  SK15: { name: "SK15 - 190", legHeight: 10, legCount: 4 },
  SK17: { name: "SK17 - 190", legHeight: 8, legCount: 4 },
  SK23: { name: "SK23 - 190", legHeight: 2.5, legCount: 4 },
};

export const AUTOMATS: Record<string, { name: string; type: string; seatLegs: boolean; seatLegHeight: number; seatLegCount: number }> = {
  AT1: { name: "Zwykły", type: "Automat zwykły", seatLegs: true, seatLegHeight: 16, seatLegCount: 2 },
  AT2: { name: "Wyrzutkowy", type: "Automat z nóżką", seatLegs: false, seatLegHeight: 0, seatLegCount: 0 },
};

export const LEGS: Record<string, { name: string; material: string; colors: Record<string, string> }> = {
  N1: { name: "Stożek prosty", material: "Drewniany", colors: { A: "Buk", B: "Brązowa", C: "Czarna" } },
  N2: { name: "Stożek skos", material: "Drewniany", colors: { A: "Buk", B: "Brązowa", C: "Czarna" } },
  N3: { name: "Walec", material: "Drewniany", colors: { A: "Buk", B: "Brązowa", C: "Czarna" } },
  N4: { name: "Plastikowa", material: "Plastik", colors: {} },
  N5: { name: "Szpilka", material: "Metalowa", colors: { A: "Czarna", B: "Złota" } },
};

export const PILLOWS: Record<string, { name: string }> = {
  P1: { name: "Poduszka kwadratowa" },
  P2: { name: "Poduszka zaokrąglona" },
};

export const JASKI: Record<string, { name: string }> = {
  J1: { name: "Jasiek kwadratowy" },
  J2: { name: "Jasiek zaokrąglony" },
};

export const WALKI: Record<string, { name: string }> = {
  W1: { name: "Wałek" },
};

export const EXTRAS: Record<string, { name: string; type: string }> = {
  PF: { name: "Pufa normalna", type: "pufa" },
  PFO: { name: "Pufa otwierana", type: "pufa" },
  FT: { name: "Fotel", type: "fotel" },
};

export const FINISHES: Record<string, string> = {
  A: "Stebnówka",
  B: "Szczypanka",
  C: "Dwuigłówka",
  D: "Zwykły",
};

export const DEFAULT_FINISHES: Record<string, string> = {
  "SD01N": "A",
  "SD01ND": "A",
  "SD01W": "A",
  "SD02N": "A",
  "SD02ND": "A",
  "SD02W": "A",
  "SD03": "A",
  "SD04": "D",
};
