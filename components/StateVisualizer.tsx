import React from 'react';
import { CalculatedShipState } from '../types';
import { Gauge, Compass } from 'lucide-react';

interface Props {
  state: CalculatedShipState;
}

const StateVisualizer: React.FC<Props> = ({ state }) => {
  return (
    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-600 pb-3">
        <Compass className="text-sky-400 w-5 h-5" />
        <h2 className="text-lg font-semibold">Hydrostatic Status</h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Trim Display */}
        <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Total Trim</span>
            <div className="text-3xl font-bold font-mono text-sky-400">
                {state.trim.toFixed(3)} <span className="text-sm text-slate-400">m</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded mt-2 font-semibold ${
                state.trimState === 'By Head' ? 'bg-red-900 text-red-200' :
                state.trimState === 'By Stern' ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-700'
            }`}>
                {state.trimState}
            </span>
        </div>

        {/* Heel Display */}
        <div className="flex flex-col items-center border-l border-slate-600">
            <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Heel Angle</span>
            <div className="text-3xl font-bold font-mono text-sky-400">
                {Math.abs(state.heel).toFixed(2)}°
            </div>
            <span className={`text-xs px-2 py-1 rounded mt-2 font-semibold ${
                state.list === 'Port' ? 'bg-orange-900 text-orange-200' :
                state.list === 'Starboard' ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-700'
            }`}>
                {state.list}
            </span>
        </div>
      </div>
      
      {/* Visual Bar representation */}
      <div className="mt-6">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
           <span>PORT LIST</span>
           <span>STBD LIST</span>
        </div>
        <div className="relative h-2 bg-slate-700 rounded-full w-full overflow-hidden">
             <div 
                className="absolute top-0 bottom-0 w-1 bg-white z-10 transition-all duration-500"
                style={{ left: `${50 + (state.heel * 5)}%` }} // Scaling factor for visibility
             />
             <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-500" />
        </div>
      </div>
    </div>
  );
};

export default StateVisualizer;