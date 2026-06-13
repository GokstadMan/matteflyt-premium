export type QuizChoice = { id: string; label: string };
export type QuizProblem = {
  id: string;
  topic: string;
  difficulty: "Lett" | "Middels" | "Vanskelig";
  question: string;
  choices: QuizChoice[];
  correctId: string;
  hints: string[]; // progressive
  explanation: string;
  xp: number;
};

export const quizProblems: QuizProblem[] = [
  {
    id: "p1",
    topic: "Algebra",
    difficulty: "Lett",
    question: "Løs likningen: 2x + 6 = 14",
    choices: [
      { id: "a", label: "x = 2" },
      { id: "b", label: "x = 4" },
      { id: "c", label: "x = 5" },
      { id: "d", label: "x = 10" },
    ],
    correctId: "b",
    hints: [
      "Start med å isolere leddet med x. Trekk fra 6 på begge sider.",
      "Du sitter igjen med 2x = 8. Hva må du gjøre for å få x alene?",
      "Del begge sider på 2.",
    ],
    explanation:
      "2x + 6 = 14 → 2x = 14 − 6 = 8 → x = 8 / 2 = **4**.",
    xp: 10,
  },
  {
    id: "p2",
    topic: "Brøk",
    difficulty: "Lett",
    question: "Hva er 1/2 + 1/3?",
    choices: [
      { id: "a", label: "2/5" },
      { id: "b", label: "1/6" },
      { id: "c", label: "5/6" },
      { id: "d", label: "2/6" },
    ],
    correctId: "c",
    hints: [
      "Finn fellesnevner for 2 og 3.",
      "Fellesnevneren er 6. Gjør om begge brøkene: 1/2 = 3/6 og 1/3 = 2/6.",
      "Legg sammen tellerne når nevnerne er like.",
    ],
    explanation: "1/2 = 3/6, 1/3 = 2/6. Sum: 3/6 + 2/6 = **5/6**.",
    xp: 10,
  },
  {
    id: "p3",
    topic: "Geometri",
    difficulty: "Middels",
    question:
      "En rettvinklet trekant har katetene 3 og 4. Hvor lang er hypotenusen?",
    choices: [
      { id: "a", label: "5" },
      { id: "b", label: "6" },
      { id: "c", label: "7" },
      { id: "d", label: "12" },
    ],
    correctId: "a",
    hints: [
      "Bruk Pytagoras' setning: a² + b² = c².",
      "Regn ut 3² + 4² = 9 + 16 = 25.",
      "Hypotenusen er kvadratroten av 25.",
    ],
    explanation: "√(3² + 4²) = √25 = **5**.",
    xp: 15,
  },
  {
    id: "p4",
    topic: "Funksjoner",
    difficulty: "Middels",
    question: "Hva er stigningstallet til linjen y = 3x − 7?",
    choices: [
      { id: "a", label: "−7" },
      { id: "b", label: "3" },
      { id: "c", label: "7" },
      { id: "d", label: "−3" },
    ],
    correctId: "b",
    hints: [
      "Sammenlign med standardformen y = ax + b.",
      "a er stigningstallet og b er konstantleddet.",
      "Tallet foran x er stigningstallet.",
    ],
    explanation:
      "For y = ax + b er a stigningstallet. Her er a = **3** (og b = −7).",
    xp: 15,
  },
  {
    id: "p5",
    topic: "Likninger",
    difficulty: "Vanskelig",
    question: "Løs: x² − 5x + 6 = 0",
    choices: [
      { id: "a", label: "x = 1 eller x = 6" },
      { id: "b", label: "x = 2 eller x = 3" },
      { id: "c", label: "x = −2 eller x = −3" },
      { id: "d", label: "x = 0 eller x = 5" },
    ],
    correctId: "b",
    hints: [
      "Prøv å faktorisere: finn to tall som ganger seg til 6 og legger seg sammen til 5.",
      "Tallene er 2 og 3: (x − 2)(x − 3) = 0.",
      "Et produkt er null når én av faktorene er null.",
    ],
    explanation:
      "x² − 5x + 6 = (x − 2)(x − 3) = 0 → x = **2** eller x = **3**.",
    xp: 25,
  },
];
