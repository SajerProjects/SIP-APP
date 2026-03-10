export const HUES = ["#F0B429","#34D399","#F87171","#60A5FA","#A78BFA","#FB923C","#2DD4BF","#E879F9","#FBBF24","#F472B6","#818CF8","#FB7185","#4ADE80","#FACC15","#22D3EE"];

export const DEFAULT_SECTIONS = [
  { title: "What am I currently working on?", mandatory: true },
  { title: "What ideas do I have?", mandatory: true },
  { title: "What are my goals?", mandatory: true },
];

export const EMOJI_OPTIONS = [
  "\u{1F981}","\u{1F43A}","\u{1F98A}","\u{1F42F}","\u{1F985}","\u{1F40D}","\u{1F988}","\u{1F98F}","\u26A1","\u{1F432}",
  "\u{1F43B}","\u{1F987}","\u{1F42C}","\u{1F989}","\u{1F418}","\u{1F98E}","\u{1F419}","\u{1F9AC}","\u{1F41D}","\u{1F9A9}",
  "\u{1F428}","\u{1F996}","\u{1F433}","\u{1F99A}","\u{1F98D}","\u{1F406}","\u{1F982}","\u{1F40A}","\u{1F99C}","\u{1F427}",
];

export const WEEKLY_PROMPTS = [
  { key: "actions", label: "What did I do this week?" },
  { key: "learned", label: "What did I learn?" },
  { key: "tools", label: "What tools/resources did I use?" },
  { key: "wentWell", label: "What went well?" },
  { key: "wentWrong", label: "What didn't go well?" },
  { key: "nextFocus", label: "What's my focus next week?" },
];

export const INVITE_CODE = "$ip2026";
export const DB_PATH = "sip_data";
export const INIT_DATA = { members: [], groupName: "SIP", weeklies: {} };
