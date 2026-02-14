/** All durations in frames at 30fps */
export const FPS = 30;

/** Transition duration between acts (frames) */
export const ACT_TRANSITION = 15;

/** Act durations (frames) — must sum to 4560 (4500 + 4 transitions × 15) */
export const ACT_FRAMES = {
  I: 310,
  II: 460,
  III: 2560,
  IV: 760,
  V: 470,
} as const;

/** Act III sub-sequence durations (frames) — must sum to 2560 */
export const ACT_III_FRAMES = {
  landing: 300,
  auth: 240,
  portfolio: 540,
  poolBrowsing: 450,
  investFlow: 360,
  montage: 210,
  docsSecurity: 460,
} as const;

/** Convenience: seconds to frames */
export const s = (seconds: number) => Math.round(seconds * FPS);
