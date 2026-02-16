/** All durations in frames at 30fps */
export const FPS = 30;

/** Transition duration between acts (frames) */
export const ACT_TRANSITION = 15;

/**
 * Act durations (frames).
 * Total composition = sum - (4 transitions * 15) = 2310 - 60 = 2250 frames = 75s
 */
export const ACT_FRAMES = {
  I: 180,
  II: 210,
  III: 1350,
  IV: 360,
  V: 210,
} as const;

/** Act III sub-sequence durations (frames) — must sum to 1350 */
export const ACT_III_FRAMES = {
  landing: 210,
  auth: 180,
  portfolio: 300,
  poolBrowsing: 240,
  investFlow: 210,
  montage: 210,
} as const;

/** Convenience: seconds to frames */
export const s = (seconds: number) => Math.round(seconds * FPS);
