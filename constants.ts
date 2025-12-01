import { TankData, SoundingRow } from './types';
import {
  HEEL_NO1_P, SND_NO1_P,
  HEEL_NO1_S, SND_NO1_S,
  HEEL_NO2_P, SND_NO2_P,
  HEEL_NO2_S, SND_NO2_S,
  HEEL_NO3_P, SND_NO3_P,
  HEEL_NO3_S, SND_NO3_S,
  HEEL_NO4_S, SND_NO4_S,
  HEEL_FO_OVERFLOW, SND_FO_OVERFLOW,
} from './data/fo_data';

import {
  HEEL_DO_P, SND_DO_P,
  HEEL_DO_S, SND_DO_S,
} from './data/do_data';

export const SHIP_BREADTH = 32.26; // meters
export const TRIM_FACTOR = 1.0829; // Simple calculation method factor

// -------------------------------------------------------
// Helpers to derive Capacity & Max Sounding from tables
// -------------------------------------------------------
const getMaxVolumeFromTable = (table: SoundingRow[]): number => {
  if (!table || table.length === 0) return 0;

  return table.reduce((max, row) => {
    // Prefer trim 0.0 (even keel); if missing, use max of any trim
    const v0 =
      row.volumes['0.0'] ??
      Math.max(...Object.values(row.volumes));

    return v0 > max ? v0 : max;
  }, 0);
};

const getMaxSoundingFromTable = (table: SoundingRow[]): number => {
  if (!table || table.length === 0) return 0;

  return table.reduce(
    (max, row) => (row.sounding > max ? row.sounding : max),
    0
  );
};

// -------------------------------------------------------
// TANK DEFINITIONS
// -------------------------------------------------------
export const MOCK_TANKS: TankData[] = [
  // --- FUEL OIL TANKS (Sounding) ---
  {
    id: '1P',
    name: 'NO.1 FUEL OIL TANK (P)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO1_P),          // capacity m³
    density: 0.9887,
    ullageReference: getMaxSoundingFromTable(SND_NO1_P),  // Max HM / pipe length
    heelTable: HEEL_NO1_P,
    soundingTable: SND_NO1_P,
  },
  {
    id: '1S',
    name: 'NO.1 FUEL OIL TANK (S)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO1_S),
    density: 0.9887,
    ullageReference: getMaxSoundingFromTable(SND_NO1_S),
    heelTable: HEEL_NO1_S,
    soundingTable: SND_NO1_S,
  },
  {
    id: '2P',
    name: 'NO.2 FUEL OIL TANK (P)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO2_P),
    density: 0.9887,
    ullageReference: getMaxSoundingFromTable(SND_NO2_P),
    heelTable: HEEL_NO2_P,
    soundingTable: SND_NO2_P,
  },
  {
    id: '2S',
    name: 'NO.2 FUEL OIL TANK (S)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO2_S),
    density: 0.9887,
    ullageReference: getMaxSoundingFromTable(SND_NO2_S),
    heelTable: HEEL_NO2_S,
    soundingTable: SND_NO2_S,
  },
  {
    id: '3P',
    name: 'NO.3 FUEL OIL TANK (P)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO3_P),
    density: 0.9818,
    ullageReference: getMaxSoundingFromTable(SND_NO3_P),
    heelTable: HEEL_NO3_P,
    soundingTable: SND_NO3_P,
  },
  {
    id: '3S',
    name: 'NO.3 FUEL OIL TANK (S)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO3_S),
    density: 0.9818,
    ullageReference: getMaxSoundingFromTable(SND_NO3_S),
    heelTable: HEEL_NO3_S,
    soundingTable: SND_NO3_S,
  },
  {
    id: '4S',
    name: 'NO.4 FUEL OIL TANK (S)',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_NO4_S),
    density: 0.9818,
    ullageReference: getMaxSoundingFromTable(SND_NO4_S),
    heelTable: HEEL_NO4_S,
    soundingTable: SND_NO4_S,
  },
  {
    id: 'FO_OVER',
    name: 'F.O. OVERFLOW TANK',
    category: 'Fuel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_FO_OVERFLOW),
    density: 0.9887,
    ullageReference: getMaxSoundingFromTable(SND_FO_OVERFLOW),
    heelTable: HEEL_FO_OVERFLOW,
    soundingTable: SND_FO_OVERFLOW,
  },

  // --- FUEL OIL MANUAL TANKS (Gauge only) ---
  {
    id: 'SETT',
    name: 'F.O. SETTLING TANK',
    category: 'Fuel Oil',
    type: 'Manual',
    maxVolume: 30.0,           // given by design
    density: 0.9887,
    ullageReference: 0,        // gauge – ullage not used from table
    heelTable: [],
    soundingTable: [],
  },
  {
    id: 'SER1',
    name: 'F.O. SERVICE TANK 1',
    category: 'Fuel Oil',
    type: 'Manual',
    maxVolume: 20.0,
    density: 0.9887,
    ullageReference: 0,
    heelTable: [],
    soundingTable: [],
  },
  {
    id: 'SER2',
    name: 'F.O. SERVICE TANK 2',
    category: 'Fuel Oil',
    type: 'Manual',
    maxVolume: 20.0,
    density: 0.9887,
    ullageReference: 0,
    heelTable: [],
    soundingTable: [],
  },

  // --- DIESEL OIL TANKS (Sounding) ---
  {
    id: 'DOP',
    name: 'DIESEL OIL TANK (P)',
    category: 'Diesel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_DO_P),
    density: 0.9,
    ullageReference: getMaxSoundingFromTable(SND_DO_P),
    heelTable: HEEL_DO_P,
    soundingTable: SND_DO_P,
  },
  {
    id: 'DOS',
    name: 'DIESEL OIL TANK (S)',
    category: 'Diesel Oil',
    type: 'Sounding',
    maxVolume: getMaxVolumeFromTable(SND_DO_S),
    density: 0.9,
    ullageReference: getMaxSoundingFromTable(SND_DO_S),
    heelTable: HEEL_DO_S,
    soundingTable: SND_DO_S,
  },

  // --- DIESEL OIL MANUAL TANKS ---
  {
    id: 'DO_SETT',
    name: 'D.O. SETTLING TANK',
    category: 'Diesel Oil',
    type: 'Manual',
    maxVolume: 15.0,
    density: 0.9,
    ullageReference: 0,
    heelTable: [],
    soundingTable: [],
  },
  {
    id: 'DO_SERV',
    name: 'D.O. SERVICE TANK',
    category: 'Diesel Oil',
    type: 'Manual',
    maxVolume: 15.0,
    density: 0.9,
    ullageReference: 0,
    heelTable: [],
    soundingTable: [],
  },
];
