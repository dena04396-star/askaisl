/**
 * viseme.ts
 * Converts ElevenLabs character-level alignment data into a VisemeFrame
 * timeline that Avatar3D can binary-search in its render loop for
 * frame-accurate lip sync.
 *
 * Supports:
 *  - English (full phoneme-class mapping via digraphs)
 *  - Sinhala / Tamil (Unicode range → open-vowel/consonant heuristic)
 *  - Silence / punctuation → neutral rest pose
 */

/** The 14 viseme keys supported by Avaturn/Ready Player Me morph targets */
export type VKey =
  | "aa" | "E"  | "I"  | "O"  | "U"       // vowels
  | "PP" | "FF" | "TH" | "DD" | "kk"       // stop / fricative consonants
  | "CH" | "SS" | "nn" | "RR";             // sibilants / sonorants

export type VWeights = Partial<Record<VKey, number>>;

/** One scheduled viseme event on the timeline */
export interface VisemeFrame {
  startTime: number;   // seconds (audio element currentTime)
  endTime:   number;   // seconds
  weights:   VWeights; // target morph-target weights [0–1]
}

/* ── ElevenLabs alignment payload ─────────────────────────────────────── */
export interface ElevenLabsAlignment {
  characters:                   string[];
  character_start_times_seconds: number[];
  character_end_times_seconds:   number[];
}

export interface ElevenLabsTTSResponse {
  audio_base64:         string;
  alignment:            ElevenLabsAlignment;
  normalized_alignment: ElevenLabsAlignment;
}

/* ── Weights per viseme class (intensity at full articulation) ─────────── */
const W: Record<VKey, number> = {
  aa: 0.90,  // open-mouth "aah"
  E:  0.65,  // front spread "ee/eh"
  I:  0.60,  // high front "ih"
  O:  0.75,  // rounded back "oh"
  U:  0.70,  // high back "oo"
  PP: 0.85,  // bilabial close p/b/m
  FF: 0.65,  // labiodental f/v
  TH: 0.55,  // dental th
  DD: 0.45,  // alveolar d/t
  kk: 0.40,  // velar k/g
  CH: 0.60,  // postalveolar ch/sh/j
  SS: 0.70,  // alveolar sibilant s/z
  nn: 0.35,  // nasal/lateral n/l
  RR: 0.50,  // rhotic r
};

/* ── English character → primary viseme (handles digraphs separately) ─── */
const CHAR_VISEME: Record<string, VKey | null> = {
  // Open vowels
  a: "aa", A: "aa", α: "aa",
  // Front vowels
  e: "E",  E: "E",  é: "E", è: "E", ê: "E", ë: "E",
  // High front
  i: "I",  I: "I",  í: "I", î: "I", ï: "I", y: "I",
  // Back rounded
  o: "O",  O: "O",  ó: "O", ô: "O", ö: "O",
  // High back
  u: "U",  U: "U",  ú: "U", û: "U", ü: "U",
  // Bilabial
  p: "PP", b: "PP", m: "PP",
  P: "PP", B: "PP", M: "PP",
  // Labiodental
  f: "FF", v: "FF", F: "FF", V: "FF",
  // Alveolar plosive / affricate
  d: "DD", t: "DD", D: "DD", T: "DD",
  // Velar
  k: "kk", g: "kk", K: "kk", G: "kk",
  q: "kk", Q: "kk",
  // Alveolar sibilant
  s: "SS", z: "SS", S: "SS", Z: "SS",
  // Nasal / lateral / glide
  n: "nn", l: "nn", N: "nn", L: "nn",
  w: "U",  W: "U",  // labial glide → rounded
  // Rhotic
  r: "RR", R: "RR",
  // Silence / punctuation → null (return to rest)
  " ": null, "\n": null, "\r": null,
  ".": null, ",": null, "!": null, "?": null,
  ";": null, ":": null, "-": null, "—": null,
  "(": null, ")": null, '"': null, "'": null,
  // h,x,c handled inline via digraph logic
  h: null, H: null,
  c: "SS", C: "SS", // default; overridden when ch/ck
  x: "kk", X: "kk",
  j: "CH", J: "CH",
};

/* ── Digraph lookup (must be checked BEFORE single-char fallback) ──────── */
const DIGRAPH: Record<string, VKey> = {
  sh: "CH", SH: "CH", Sh: "CH",
  ch: "CH", CH: "CH", Ch: "CH",
  th: "TH", TH: "TH", Th: "TH",
  ph: "FF", PH: "FF", Ph: "FF",
  wh: "U",  WH: "U",  Wh: "U",
  ck: "kk", CK: "kk", Ck: "kk",
  ng: "kk", NG: "kk", Ng: "kk",
  nk: "kk", NK: "kk", Nk: "kk",
  gh: null as unknown as VKey, // silent
  kn: "nn" as VKey,
};

/* ── Unicode range heuristics for Sinhala / Tamil ──────────────────────── */
function unicodeViseme(cp: number): VKey | null {
  // Sinhala: U+0D80–U+0DFF
  if (cp >= 0x0D80 && cp <= 0x0DFF) {
    // Vowel signs (matra) / independent vowels → open mouth
    if ((cp >= 0x0D85 && cp <= 0x0D96) || (cp >= 0x0DCF && cp <= 0x0DD6))
      return "aa";
    return "nn"; // most consonants → nasal/general consonant posture
  }
  // Tamil: U+0B80–U+0BFF
  if (cp >= 0x0B80 && cp <= 0x0BFF) {
    if ((cp >= 0x0B85 && cp <= 0x0B8A) || (cp >= 0x0BBE && cp <= 0x0BC2))
      return "aa";
    return "nn";
  }
  return null;
}

/* ── Core mapping: char at index idx → { viseme | null, charsConsumed } ── */
function resolveViseme(
  chars: string[],
  idx: number
): { viseme: VKey | null; consumed: number } {
  const c0 = chars[idx];
  const c1 = chars[idx + 1] ?? "";

  // Try 2-char digraph first
  const digraph = (c0 + c1).toLowerCase();
  if (digraph in DIGRAPH) {
    const v = DIGRAPH[digraph];
    return { viseme: v ?? null, consumed: 2 };
  }

  // Latin single char
  if (c0 in CHAR_VISEME) {
    return { viseme: CHAR_VISEME[c0] ?? null, consumed: 1 };
  }

  // Unicode (Sinhala / Tamil)
  const cp = c0.codePointAt(0) ?? 0;
  if (cp > 127) {
    return { viseme: unicodeViseme(cp), consumed: 1 };
  }

  return { viseme: null, consumed: 1 };
}

/* ── Build a VisemeFrame timeline from ElevenLabs alignment ─────────────── */
export function buildVisemeTimeline(
  alignment: ElevenLabsAlignment
): VisemeFrame[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const frames: VisemeFrame[] = [];

  let i = 0;
  while (i < characters.length) {
    const { viseme, consumed } = resolveViseme(characters, i);

    const startTime = character_start_times_seconds[i] ?? 0;
    // End time = last character consumed (for digraphs, take the second char's end)
    const endTime   = character_end_times_seconds[Math.min(i + consumed - 1, characters.length - 1)] ?? startTime;

    if (viseme !== null) {
      const weights: VWeights = { [viseme]: W[viseme] };

      // Co-articulation: vowels slightly open the jaw even during consonants
      if (viseme !== "aa" && viseme !== "O" && viseme !== "U") {
        const jawNeighbour = lookupNeighbourVowel(characters, character_start_times_seconds, i, 0.12);
        if (jawNeighbour) weights.aa = W.aa * 0.3;
      }

      frames.push({ startTime, endTime, weights });
    } else {
      // Silence / punctuation → explicit rest frame (closes mouth gradually)
      if (frames.length === 0 || frames[frames.length - 1].weights.aa !== 0) {
        frames.push({ startTime, endTime, weights: {} });
      }
    }

    i += consumed;
  }

  return frames;
}

/* Helper: look within ±lookAheadSec for the nearest vowel to add co-art jaw */
function lookupNeighbourVowel(
  chars: string[],
  starts: number[],
  idx: number,
  lookAheadSec: number
): boolean {
  const tCur = starts[idx] ?? 0;
  const vowels = new Set<string>(["a","e","i","o","u","A","E","I","O","U"]);
  for (let j = idx - 2; j <= idx + 3 && j < chars.length; j++) {
    if (j < 0) continue;
    if (j === idx) continue;
    if (Math.abs((starts[j] ?? 0) - tCur) <= lookAheadSec && vowels.has(chars[j])) return true;
  }
  return false;
}
