export interface Drafts {
  foreP: number;
  foreS: number;
  midP: number;
  midS: number;
  aftP: number;
  aftS: number;
}

export interface CalculatedShipState {
  trim: number; // Meters
  heel: number; // Degrees, positive is Starboard
  list: 'Port' | 'Starboard' | 'Even';
  trimState: 'By Head' | 'By Stern' | 'Even';
}

export interface HeelCorrectionRow {
  sounding: number; // Meters
  corrections: { [angle: string]: number }; // angle string key (e.g. "-2.0", "1.5") -> correction in cm or m
}

export interface SoundingRow {
  sounding: number; // Meters
  volumes: { [trim: string]: number }; // trim string key (e.g., "-1.0", "2.0") -> volume in m3
}

export interface TankData {
  id: string;
  name: string;
  category: 'Fuel Oil' | 'Diesel Oil';
  type: 'Sounding' | 'Manual';
  maxVolume: number;
  density: number; // Standard density
  heelTable: HeelCorrectionRow[];
  soundingTable: SoundingRow[];
  ullageReference: number; // Total pipe length
}

export interface TankCalculationResult {
  tankId: string;
  category: 'Fuel Oil' | 'Diesel Oil';
  measuredSounding: number;
  heelCorrection: number;
  correctedSounding: number;
  volume: number;
  weight: number;
  temperature: number;
  specificGravity: number;
  correctedSpecificGravity: number;
}