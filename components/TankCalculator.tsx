import React, { useState, useEffect } from 'react';
import { TankData, CalculatedShipState, TankCalculationResult } from '../types';
import { calculateHeelCorrection, calculateVolume } from '../utils/calculations';
import { Database, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';

interface Props {
  tank: TankData;
  shipState: CalculatedShipState;
  onUpdate: (result: TankCalculationResult) => void;
}

const TankCalculator: React.FC<Props> = ({ tank, shipState, onUpdate }) => {
  const [sounding, setSounding] = useState<number>(0); // Used as Volume for Manual type
  const [temperature, setTemperature] = useState<number>(15);
  const [specificGravity, setSpecificGravity] = useState<number>(tank.density);
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate whenever inputs or ship state changes
  useEffect(() => {
    let vol = 0;
    let heelCorr = 0;
    let correctedSounding = 0;

    if (tank.type === 'Manual') {
        // In manual mode, 'sounding' state holds the Volume directly
        vol = sounding;
        correctedSounding = 0;
        heelCorr = 0;
    } else {
        // 1. Get Heel Correction
        heelCorr = calculateHeelCorrection(sounding, shipState.heel, tank.heelTable);
        
        // 2. Apply Correction
        correctedSounding = sounding + heelCorr;
        
        // Clamp to valid range
        if (correctedSounding < 0) correctedSounding = 0;

        // 3. Look up Volume with Trim
        vol = calculateVolume(correctedSounding, shipState.trim, tank.soundingTable);
    }

    // 4. Calculate Weight
    // Temp correction factor (ASTM): approx -0.00064 per deg C diff from 15C
    const tempDiff = temperature - 15;
    const correctedSpecificGravity = specificGravity - (tempDiff * 0.00064);
    const weight = vol * correctedSpecificGravity;

    onUpdate({
        tankId: tank.id,
        category: tank.category,
        measuredSounding: tank.type === 'Manual' ? 0 : sounding,
        heelCorrection: heelCorr,
        correctedSounding: correctedSounding,
        volume: vol,
        weight: weight,
        temperature,
        specificGravity,
        correctedSpecificGravity
    });
  }, [sounding, temperature, specificGravity, shipState, tank, onUpdate]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Header Row */}
        <div 
            className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 border-b border-slate-100"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                    {tank.type === 'Manual' ? <Edit3 size={18} /> : <Database size={18} />}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">{tank.name}</h3>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {tank.category} • Max: {tank.maxVolume} m³
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 {/* Mini Summary when collapsed */}
                 {!isExpanded && (
                    <div className="hidden md:flex gap-4 text-sm">
                        <span className="font-mono text-slate-600">
                             <span className="text-slate-400">Vol:</span> 
                             {(tank.type === 'Manual' ? sounding : calculateVolume(sounding + calculateHeelCorrection(sounding, shipState.heel, tank.heelTable), shipState.trim, tank.soundingTable)).toFixed(2)}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                             <span className="text-slate-400 font-normal">Wgt:</span> 
                             {((tank.type === 'Manual' ? sounding : calculateVolume(sounding + calculateHeelCorrection(sounding, shipState.heel, tank.heelTable), shipState.trim, tank.soundingTable)) * (specificGravity - ((temperature - 15) * 0.00064))).toFixed(2)}
                        </span>
                    </div>
                 )}
                 <button className="text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                 </button>
            </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Inputs */}
                <div className="md:col-span-3 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            {tank.type === 'Manual' ? 'Volume (m³)' : 'Sounding (m)'}
                        </label>
                        <input 
                            type="number" step="0.001"
                            className="w-full border border-blue-300 rounded-md p-2 text-lg font-mono text-blue-800 font-bold bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={sounding || ''}
                            onChange={(e) => setSounding(parseFloat(e.target.value) || 0)}
                            placeholder="0.000"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Temp (°C)</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-200 rounded p-1.5 text-sm font-mono text-slate-700"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Density</label>
                            <input 
                                type="number" step="0.0001"
                                className="w-full border border-slate-200 rounded p-1.5 text-sm font-mono text-slate-700"
                                value={specificGravity}
                                onChange={(e) => setSpecificGravity(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Calculations Grid */}
                <div className="md:col-span-9 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full items-center">
                        
                        {/* Heel Corr - Hide if Manual */}
                        {tank.type !== 'Manual' && (
                            <div className="text-center p-2 border-r border-slate-200 last:border-0">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Heel Corr.</span>
                                <div className="font-mono text-lg text-slate-600">
                                    {calculateHeelCorrection(sounding, shipState.heel, tank.heelTable).toFixed(3)} <span className="text-xs text-slate-400">m</span>
                                </div>
                            </div>
                        )}

                        {/* Corrected Sounding - Hide if Manual */}
                        {tank.type !== 'Manual' && (
                            <div className="text-center p-2 border-r border-slate-200 md:border-r-0 lg:border-r">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Corr. Sounding</span>
                                <div className="font-mono text-lg font-semibold text-slate-800">
                                    {(sounding + calculateHeelCorrection(sounding, shipState.heel, tank.heelTable)).toFixed(3)} <span className="text-xs text-slate-400">m</span>
                                </div>
                            </div>
                        )}

                        {/* Volume */}
                        <div className={`text-center p-2 border-r border-slate-200 ${tank.type === 'Manual' ? 'col-span-2 border-r-0 md:border-r' : ''}`}>
                            <span className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Net Volume</span>
                            <div className="font-mono text-xl font-bold text-blue-600">
                                {(tank.type === 'Manual' ? sounding : calculateVolume(sounding + calculateHeelCorrection(sounding, shipState.heel, tank.heelTable), shipState.trim, tank.soundingTable)).toFixed(2)} <span className="text-xs text-blue-400">m³</span>
                            </div>
                        </div>

                        {/* Weight */}
                        <div className={`text-center p-2 bg-white rounded-lg shadow-sm border border-slate-100 ${tank.type === 'Manual' ? 'col-span-2' : ''}`}>
                            <span className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Weight (MT)</span>
                            <div className="font-mono text-xl font-bold text-emerald-700">
                                {((tank.type === 'Manual' ? sounding : calculateVolume(sounding + calculateHeelCorrection(sounding, shipState.heel, tank.heelTable), shipState.trim, tank.soundingTable)) * (specificGravity - ((temperature - 15) * 0.00064))).toFixed(2)}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        )}
    </div>
  );
};

export default TankCalculator;