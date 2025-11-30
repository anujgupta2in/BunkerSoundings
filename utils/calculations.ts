
import { Drafts, CalculatedShipState, TankData, HeelCorrectionRow, SoundingRow } from '../types';
import { SHIP_BREADTH, TRIM_FACTOR } from '../constants';

export const calculateShipState = (drafts: Drafts): CalculatedShipState => {
  const meanDraftFore = (drafts.foreP + drafts.foreS) / 2;
  const meanDraftAft = (drafts.aftP + drafts.aftS) / 2;
  const meanDraftMid = (drafts.midP + drafts.midS) / 2;

  // Simple Trim calculation (from PDF)
  // Trim = (da - df) * 1.0829
  // da > df -> Positive Trim (By Stern)
  // da < df -> Negative Trim (By Head)
  const trim = (meanDraftAft - meanDraftFore) * TRIM_FACTOR;

  // Heel calculation
  // Heel angle = (Starboard draft - Port draft) / Ship breadth * 57.3
  // Positive heel = Starboard list
  const draftDiff = drafts.midS - drafts.midP;
  const heel = (draftDiff / SHIP_BREADTH) * 57.3;

  return {
    trim: parseFloat(trim.toFixed(3)),
    heel: parseFloat(heel.toFixed(3)),
    list: heel > 0.05 ? 'Starboard' : heel < -0.05 ? 'Port' : 'Even',
    trimState: trim > 0.05 ? 'By Stern' : trim < -0.05 ? 'By Head' : 'Even'
  };
};

/**
 * Linear Interpolation
 */
const lerp = (x: number, x0: number, x1: number, y0: number, y1: number): number => {
  if (Math.abs(x1 - x0) < 0.00001) return y0;
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
};

/**
 * Get Heel Correction from Table using Bilinear Interpolation
 */
export const calculateHeelCorrection = (sounding: number, heel: number, table: HeelCorrectionRow[]): number => {
  if (table.length === 0) return 0;
  
  // 1. Find Sounding rows (above and below)
  let lowerRow = table[0];
  let upperRow = table[table.length - 1];

  // Clamp sounding
  if (sounding <= table[0].sounding) {
      upperRow = table[0]; 
  } else if (sounding >= table[table.length - 1].sounding) {
      lowerRow = table[table.length - 1];
  } else {
      for (let i = 0; i < table.length - 1; i++) {
        if (sounding >= table[i].sounding && sounding <= table[i+1].sounding) {
          lowerRow = table[i];
          upperRow = table[i+1];
          break;
        }
      }
  }

  // 2. Extract corrections for the specific heel angle from both rows
  // Helper to safely get correction at a specific angle, handling 0.0 automatically
  const getCorrectionAtAngle = (row: HeelCorrectionRow, targetHeel: number): number => {
      const angles = Object.keys(row.corrections).map(parseFloat).sort((a, b) => a - b);
      
      // If table doesn't have 0.0, assume 0 correction at 0 heel
      // We inject 0.0 into the interpolation range logic
      let searchAngles = [...angles];
      if (!searchAngles.includes(0)) {
          searchAngles.push(0);
          searchAngles.sort((a, b) => a - b);
      }

      if (targetHeel < searchAngles[0]) return row.corrections[angles[0].toFixed(1)] || 0;
      if (targetHeel > searchAngles[searchAngles.length - 1]) return row.corrections[angles[angles.length - 1].toFixed(1)] || 0;

      let lowerA = searchAngles[0];
      let upperA = searchAngles[searchAngles.length - 1];

      for (let i = 0; i < searchAngles.length - 1; i++) {
          if (targetHeel >= searchAngles[i] && targetHeel <= searchAngles[i+1]) {
              lowerA = searchAngles[i];
              upperA = searchAngles[i+1];
              break;
          }
      }

      const valLow = lowerA === 0 ? 0 : (row.corrections[lowerA.toFixed(1)] || 0);
      const valHigh = upperA === 0 ? 0 : (row.corrections[upperA.toFixed(1)] || 0);

      return lerp(targetHeel, lowerA, upperA, valLow, valHigh);
  };

  const corrLower = getCorrectionAtAngle(lowerRow, heel);
  const corrUpper = getCorrectionAtAngle(upperRow, heel);

  // 3. Interpolate between the two soundings
  return lerp(sounding, lowerRow.sounding, upperRow.sounding, corrLower, corrUpper);
};

/**
 * Get Volume from Table using Bilinear Interpolation
 */
export const calculateVolume = (correctedSounding: number, trim: number, table: SoundingRow[]): number => {
    if (table.length === 0) return 0;

    // 1. Find Sounding Rows
    let lowerRow = table[0];
    let upperRow = table[table.length - 1];

    if (correctedSounding <= table[0].sounding) {
        if (correctedSounding < 0) return 0;
        upperRow = table[0];
        lowerRow = table[0]; 
    } else if (correctedSounding >= table[table.length - 1].sounding) {
        lowerRow = table[table.length - 1];
        upperRow = table[table.length - 1];
    } else {
        for (let i = 0; i < table.length - 1; i++) {
            if (correctedSounding >= table[i].sounding && correctedSounding <= table[i+1].sounding) {
                lowerRow = table[i];
                upperRow = table[i+1];
                break;
            }
        }
    }

    // 2. Interpolate Trim
    const getVolAtTrim = (row: SoundingRow, t: number): number => {
        const trims = Object.keys(row.volumes).map(parseFloat).sort((a, b) => a - b);
        
        // Clamp trim
        if (t <= trims[0]) return row.volumes[trims[0].toFixed(1)];
        if (t >= trims[trims.length - 1]) return row.volumes[trims[trims.length - 1].toFixed(1)];

        let lowerT = trims[0];
        let upperT = trims[trims.length - 1];

        for (let i = 0; i < trims.length - 1; i++) {
            if (t >= trims[i] && t <= trims[i+1]) {
                lowerT = trims[i];
                upperT = trims[i+1];
                break;
            }
        }

        const valLow = row.volumes[lowerT.toFixed(1)] || 0;
        const valHigh = row.volumes[upperT.toFixed(1)] || 0;
        
        return lerp(t, lowerT, upperT, valLow, valHigh);
    };

    const volLower = getVolAtTrim(lowerRow, trim);
    const volUpper = getVolAtTrim(upperRow, trim);

    return lerp(correctedSounding, lowerRow.sounding, upperRow.sounding, volLower, volUpper);
};
