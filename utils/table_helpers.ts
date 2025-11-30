
import { HeelCorrectionRow, SoundingRow } from '../types';

// S: Sounding Row Builder
// Maps array indices to Trim: 0=Even, 1=-2.0, 2=-1.0, 3=1.0, 4=2.0, 5=3.0, 6=4.0, 7=5.0
export const s = (depth: number, v: number[]): SoundingRow => ({
  sounding: depth,
  volumes: {
    "0.0": v[0],  // EVEN
    "-2.0": v[1],
    "-1.0": v[2],
    "1.0": v[3],
    "2.0": v[4],
    "3.0": v[5],
    "4.0": v[6],
    "5.0": v[7]
  }
});

// H: Heel Row Builder
// Maps array indices to Angle: -2.0, -1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2.0
export const h = (depth: number, c: number[]): HeelCorrectionRow => ({
  sounding: depth,
  corrections: {
    "-2.0": c[0]/100, "-1.5": c[1]/100, "-1.0": c[2]/100, "-0.5": c[3]/100,
    "0.5": c[4]/100, "1.0": c[5]/100, "1.5": c[6]/100, "2.0": c[7]/100
  }
});
