
import { TankData } from './types';
import { 
  HEEL_NO1_P, SND_NO1_P, 
  HEEL_NO1_S, SND_NO1_S, 
  HEEL_NO2_P, SND_NO2_P,
  HEEL_NO2_S, SND_NO2_S,
  HEEL_NO3_P, SND_NO3_P,
  HEEL_NO3_S, SND_NO3_S,
  HEEL_NO4_S, SND_NO4_S,
  HEEL_FO_OVERFLOW, SND_FO_OVERFLOW 
} from './data/fo_data';

import { 
  HEEL_DO_P, SND_DO_P, 
  HEEL_DO_S, SND_DO_S 
} from './data/do_data';

export const SHIP_BREADTH = 32.26; // meters
export const TRIM_FACTOR = 1.0829; // Simple calculation method factor

export const MOCK_TANKS: TankData[] = [
  // --- FUEL OIL TANKS ---
  { id: '1P', name: 'NO.1 FUEL OIL TANK (P)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 390.2, density: 0.9887, ullageReference: 21.01, heelTable: HEEL_NO1_P, soundingTable: SND_NO1_P },
  { id: '1S', name: 'NO.1 FUEL OIL TANK (S)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 406.5, density: 0.9887, ullageReference: 21.01, heelTable: HEEL_NO1_S, soundingTable: SND_NO1_S },
  { id: '2P', name: 'NO.2 FUEL OIL TANK (P)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 260.0, density: 0.9887, ullageReference: 20.361, heelTable: HEEL_NO2_P, soundingTable: SND_NO2_P },
  { id: '2S', name: 'NO.2 FUEL OIL TANK (S)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 260.0, density: 0.9887, ullageReference: 20.512, heelTable: HEEL_NO2_S, soundingTable: SND_NO2_S },
  { id: '3P', name: 'NO.3 FUEL OIL TANK (P)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 162.0, density: 0.9818, ullageReference: 20.368, heelTable: HEEL_NO3_P, soundingTable: SND_NO3_P },
  { id: '3S', name: 'NO.3 FUEL OIL TANK (S)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 162.0, density: 0.9818, ullageReference: 20.379, heelTable: HEEL_NO3_S, soundingTable: SND_NO3_S },
  { id: '4S', name: 'NO.4 FUEL OIL TANK (S)', category: 'Fuel Oil', type: 'Sounding', maxVolume: 158.8, density: 0.9818, ullageReference: 3.77, heelTable: HEEL_NO4_S, soundingTable: SND_NO4_S },
  { id: 'FO_OVER', name: 'F.O. OVERFLOW TANK', category: 'Fuel Oil', type: 'Sounding', maxVolume: 22.3, density: 0.9887, ullageReference: 3.872, heelTable: HEEL_FO_OVERFLOW, soundingTable: SND_FO_OVERFLOW },
  
  // --- FUEL OIL MANUAL TANKS ---
  { id: 'SETT', name: 'F.O. SETTLING TANK', category: 'Fuel Oil', type: 'Manual', maxVolume: 30.0, density: 0.9887, ullageReference: 0, heelTable: [], soundingTable: [] },
  { id: 'SER1', name: 'F.O. SERVICE TANK 1', category: 'Fuel Oil', type: 'Manual', maxVolume: 20.0, density: 0.9887, ullageReference: 0, heelTable: [], soundingTable: [] },
  { id: 'SER2', name: 'F.O. SERVICE TANK 2', category: 'Fuel Oil', type: 'Manual', maxVolume: 20.0, density: 0.9887, ullageReference: 0, heelTable: [], soundingTable: [] },

  // --- DIESEL OIL TANKS ---
  { id: 'DOP', name: 'DIESEL OIL TANK (P)', category: 'Diesel Oil', type: 'Sounding', maxVolume: 242.4, density: 0.9000, ullageReference: 3.761, heelTable: HEEL_DO_P, soundingTable: SND_DO_P },
  { id: 'DOS', name: 'DIESEL OIL TANK (S)', category: 'Diesel Oil', type: 'Sounding', maxVolume: 83.6, density: 0.9000, ullageReference: 3.755, heelTable: HEEL_DO_S, soundingTable: SND_DO_S },
  
  // --- DIESEL OIL MANUAL TANKS ---
  { id: 'DO_SETT', name: 'D.O. SETTLING TANK', category: 'Diesel Oil', type: 'Manual', maxVolume: 15.0, density: 0.9000, ullageReference: 0, heelTable: [], soundingTable: [] },
  { id: 'DO_SERV', name: 'D.O. SERVICE TANK', category: 'Diesel Oil', type: 'Manual', maxVolume: 15.0, density: 0.9000, ullageReference: 0, heelTable: [], soundingTable: [] },
];
