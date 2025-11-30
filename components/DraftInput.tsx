import React from 'react';
import { Drafts } from '../types';
import { Ship, Anchor } from 'lucide-react';

interface DraftInputProps {
  drafts: Drafts;
  onChange: (key: keyof Drafts, value: number) => void;
}

const DraftInput: React.FC<DraftInputProps> = ({ drafts, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Drafts) => {
    const val = parseFloat(e.target.value);
    onChange(key, isNaN(val) ? 0 : val);
  };

  const inputClass = "w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 text-center font-mono";
  const labelClass = "block mb-1 text-xs font-medium text-slate-500 uppercase tracking-wider text-center";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        <Anchor className="text-blue-600 w-5 h-5" />
        <h2 className="text-lg font-semibold text-slate-800">Vessel Drafts (meters)</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* AFT */}
        <div className="space-y-3">
           <h3 className="text-center font-bold text-slate-700 bg-slate-100 py-1 rounded">AFT</h3>
           <div>
              <label className={labelClass}>Port</label>
              <input 
                type="number" step="0.01" 
                value={drafts.aftP} 
                onChange={(e) => handleChange(e, 'aftP')}
                className={inputClass} 
              />
           </div>
           <div>
              <label className={labelClass}>Starboard</label>
              <input 
                type="number" step="0.01" 
                value={drafts.aftS} 
                onChange={(e) => handleChange(e, 'aftS')}
                className={inputClass} 
              />
           </div>
        </div>

        {/* MIDSHIP */}
        <div className="space-y-3">
           <h3 className="text-center font-bold text-slate-700 bg-slate-100 py-1 rounded">MIDSHIP</h3>
           <div>
              <label className={labelClass}>Port</label>
              <input 
                type="number" step="0.01" 
                value={drafts.midP} 
                onChange={(e) => handleChange(e, 'midP')}
                className={inputClass} 
              />
           </div>
           <div>
              <label className={labelClass}>Starboard</label>
              <input 
                type="number" step="0.01" 
                value={drafts.midS} 
                onChange={(e) => handleChange(e, 'midS')}
                className={inputClass} 
              />
           </div>
        </div>

        {/* FORE */}
        <div className="space-y-3">
           <h3 className="text-center font-bold text-slate-700 bg-slate-100 py-1 rounded">FORE</h3>
           <div>
              <label className={labelClass}>Port</label>
              <input 
                type="number" step="0.01" 
                value={drafts.foreP} 
                onChange={(e) => handleChange(e, 'foreP')}
                className={inputClass} 
              />
           </div>
           <div>
              <label className={labelClass}>Starboard</label>
              <input 
                type="number" step="0.01" 
                value={drafts.foreS} 
                onChange={(e) => handleChange(e, 'foreS')}
                className={inputClass} 
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default DraftInput;