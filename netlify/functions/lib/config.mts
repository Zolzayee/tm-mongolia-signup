// Club settings. To add new Thursdays, edit this file and push to GitHub:
// Netlify rebuilds and the sign-up page updates by itself.
// Member names are NOT stored here (this repository is public). They live in the
// MEMBERS environment variable on Netlify, as a JSON list of names.

export type Role = { id: string; g: string; label: string; resp: string; benefit: string };

// Meeting dates shown on the page (YYYY-MM-DD, Thursdays).
export const DATES: string[] = [
  "2026-11-19",
  "2026-11-26",
  "2026-12-03",
  "2026-12-10",
  "2026-12-17",
  "2026-12-24",
  "2026-12-31"
];

// Order matches columns D to Q of the Schedule tab in the Google Sheet.
export const ROLES: Role[] = [
  {
    "id": "tm",
    "g": "Meeting leadership",
    "label": "Toastmaster",
    "resp": "Leads the entire meeting, introduces each session and role holder, maintains the meeting flow, and ensures a positive and engaging experience for everyone.",
    "benefit": "Develops public speaking, facilitation, time management, event hosting, and leadership skills."
  },
  {
    "id": "warm",
    "g": "Meeting leadership",
    "label": "Warm-up Master",
    "resp": "Conducts a short icebreaker or energizing activity to help members relax, interact, and feel comfortable before the meeting begins.",
    "benefit": "Builds creativity, audience engagement, facilitation, spontaneity, and the ability to connect with different personalities."
  },
  {
    "id": "word",
    "g": "Meeting leadership",
    "label": "Word Master",
    "resp": "Introduces the Word of the Day, explains its meaning and usage, and encourages members to incorporate it naturally into their speeches and conversations.",
    "benefit": "Expands vocabulary, improves language proficiency, and develops the ability to explain and communicate ideas clearly."
  },
  {
    "id": "tt",
    "g": "Meeting leadership",
    "label": "Table Topics Master",
    "resp": "Prepares and delivers interesting impromptu speaking questions, invites members to participate, and manages the Table Topics session.",
    "benefit": "Strengthens creativity, quick thinking, question design, facilitation, and the ability to think on your feet."
  },
  {
    "id": "ge",
    "g": "Evaluation and support",
    "label": "General Evaluator",
    "resp": "Evaluates the overall quality of the meeting, coordinates the evaluation team, invites reports from supporting role holders, and provides constructive feedback on how the meeting can improve.",
    "benefit": "Develops critical thinking, observation, constructive feedback, leadership, and the ability to evaluate performance objectively."
  },
  {
    "id": "ah",
    "g": "Evaluation and support",
    "label": "Ah-Counter",
    "resp": "Listens for filler words and sounds such as \"um,\" \"ah,\" \"you know,\" and unnecessary repetitions, then reports observations at the end of the meeting.",
    "benefit": "Develops active listening, attention to detail, self-awareness, and greater awareness of verbal communication habits."
  },
  {
    "id": "gram",
    "g": "Evaluation and support",
    "label": "Grammarian",
    "resp": "Observes members' language usage, identifies effective expressions and grammatical mistakes, and provides a report with examples and suggestions for improvement.",
    "benefit": "Enhances grammar, vocabulary, language awareness, listening skills, and the ability to communicate more precisely."
  },
  {
    "id": "timer",
    "g": "Evaluation and support",
    "label": "Timer",
    "resp": "Monitors the duration of speeches and meeting segments, displays timing signals, and provides a timing report to help everyone stay within the allocated time.",
    "benefit": "Strengthens time management, concentration, discipline, attention to detail, and an understanding of effective speech pacing."
  },
  {
    "id": "joke",
    "g": "Evaluation and support",
    "label": "Joke Master",
    "resp": "Shares a short, appropriate joke or humorous story to bring energy and laughter to the meeting.",
    "benefit": "Builds confidence, storytelling ability, creativity, humor, and the ability to connect with an audience through entertainment."
  },
  {
    "id": "sp1",
    "g": "Speakers and evaluators",
    "label": "Speaker 1",
    "resp": "Prepared Speaker: delivers a structured speech based on a selected Pathways project or personal learning objective, applying specific communication and presentation skills.",
    "benefit": "Develops speech organization, storytelling, confidence, body language, vocal variety, persuasion, and the ability to communicate ideas effectively."
  },
  {
    "id": "ev1",
    "g": "Speakers and evaluators",
    "label": "Evaluator 1",
    "resp": "Speech Evaluator: listens carefully to an assigned speaker, identifies their strengths and areas for improvement, and delivers a constructive evaluation with practical recommendations.",
    "benefit": "Improves active listening, analytical thinking, empathy, public speaking, and the ability to give and receive constructive feedback."
  },
  {
    "id": "sp2",
    "g": "Speakers and evaluators",
    "label": "Speaker 2",
    "resp": "Prepared Speaker: delivers a structured speech based on a selected Pathways project or personal learning objective, applying specific communication and presentation skills.",
    "benefit": "Develops speech organization, storytelling, confidence, body language, vocal variety, persuasion, and the ability to communicate ideas effectively."
  },
  {
    "id": "ev2",
    "g": "Speakers and evaluators",
    "label": "Evaluator 2",
    "resp": "Speech Evaluator: listens carefully to an assigned speaker, identifies their strengths and areas for improvement, and delivers a constructive evaluation with practical recommendations.",
    "benefit": "Improves active listening, analytical thinking, empathy, public speaking, and the ability to give and receive constructive feedback."
  },
  {
    "id": "sp3",
    "g": "Speakers and evaluators",
    "label": "Speaker 3",
    "resp": "Prepared Speaker: delivers a structured speech based on a selected Pathways project or personal learning objective, applying specific communication and presentation skills.",
    "benefit": "Develops speech organization, storytelling, confidence, body language, vocal variety, persuasion, and the ability to communicate ideas effectively."
  },
  {
    "id": "ev3",
    "g": "Speakers and evaluators",
    "label": "Evaluator 3",
    "resp": "Speech Evaluator: listens carefully to an assigned speaker, identifies their strengths and areas for improvement, and delivers a constructive evaluation with practical recommendations.",
    "benefit": "Improves active listening, analytical thinking, empathy, public speaking, and the ability to give and receive constructive feedback."
  },
  {
    "id": "backup",
    "g": "Speakers and evaluators",
    "label": "Back-up",
    "resp": "Stands by to take over as a speaker or evaluator if someone cannot attend, so the meeting keeps its full programme.",
    "benefit": "Builds readiness and flexibility, and you learn how the whole meeting fits together."
  }
];

