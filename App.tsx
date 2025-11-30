import React, { useState, useMemo } from 'react';
import { Drafts, CalculatedShipState, TankCalculationResult } from './types';
import { MOCK_TANKS } from './constants';
import { calculateShipState } from './utils/calculations';
import DraftInput from './components/DraftInput';
import StateVisualizer from './components/StateVisualizer';
import TankCalculator from './components/TankCalculator';
import ReportView from './components/ReportView';
import { Waves, Download, Droplet, Fuel, RotateCcw } from 'lucide-react';

const INITIAL_DRAFTS: Drafts = {
  aftP: 6.78,
  aftS: 6.84,
  midP: 5.85,
  midS: 6.47,
  foreP: 5.55,
  foreS: 5.59,
};

const App: React.FC = () => {
  const [drafts, setDrafts] = useState<Drafts>(INITIAL_DRAFTS);
  const [results, setResults] = useState<{ [tankId: string]: TankCalculationResult }>({});
  const [showReport, setShowReport] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [vesselName, setVesselName] = useState<string>('LOWLANDS HOPE');
  const [reportDate, setReportDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10) // yyyy-mm-dd
  );

  const shipState: CalculatedShipState = useMemo(() => {
    return calculateShipState(drafts);
  }, [drafts]);

  const handleDraftChange = (key: keyof Drafts, value: number) => {
    setDrafts(prev => ({ ...prev, [key]: value }));
  };

  const handleTankUpdate = (result: TankCalculationResult) => {
    setResults(prev => ({
      ...prev,
      [result.tankId]: result,
    }));
  };

  const handleReset = () => {
    if (window.confirm('Reset all values to default?')) {
      setDrafts(INITIAL_DRAFTS);
      setResults({});
      setResetKey(prev => prev + 1);
    }
  };

  // Compute totals for FO and DO in one pass
  const {
    totalFoWeight,
    totalFoVolume,
    totalDoWeight,
    totalDoVolume,
  } = useMemo(() => {
    let totals = {
      totalFoWeight: 0,
      totalFoVolume: 0,
      totalDoWeight: 0,
      totalDoVolume: 0,
    };

    for (const r of Object.values(results)) {
      if (r.category === 'Fuel Oil') {
        totals.totalFoWeight += r.weight;
        totals.totalFoVolume += r.volume;
      } else if (r.category === 'Diesel Oil') {
        totals.totalDoWeight += r.weight;
        totals.totalDoVolume += r.volume;
      }
    }

    return totals;
  }, [results]);

  const foTanks = MOCK_TANKS.filter(t => t.category === 'Fuel Oil');
  const doTanks = MOCK_TANKS.filter(t => t.category === 'Diesel Oil');

  const formatNumber = (value: number) =>
    Number.isFinite(value) ? value.toFixed(2) : '0.00';

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans text-slate-900">
      {showReport && (
        <ReportView
          drafts={drafts}
          tanks={MOCK_TANKS}
          results={results}
          vesselName={vesselName}
          reportDate={reportDate}
          onClose={() => setShowReport(false)}
        />
      )}

      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                NaviSound<span className="text-blue-400">.Pro</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Ship Stability &amp; Sounding
              </p>
            </div>
          </div>

          {/* Right: Vessel, Date, Totals, Buttons */}
          <div className="flex items-center gap-6">
            {/* Vessel name */}
            <div className="hidden md:block">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                Vessel Name
              </div>
              <input
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs w-40"
                value={vesselName}
                onChange={e => setVesselName(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="hidden md:block">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                Date
              </div>
              <input
                type="date"
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
              />
            </div>

            {/* Totals + buttons */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                  FO Total
                </div>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {formatNumber(totalFoWeight)} MT
                </div>
              </div>
              <div className="text-right border-l border-slate-700 pl-6 mr-4">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                  DO Total
                </div>
                <div className="font-mono font-bold text-yellow-400 text-sm">
                  {formatNumber(totalDoWeight)} MT
                </div>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700 font-medium text-slate-300"
                title="Reset all values"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-900/50"
              >
                <Download size={16} />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-20 print:hidden">
        {/* Drafts + State visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            <DraftInput drafts={drafts} onChange={handleDraftChange} />
          </div>
          <div className="lg:col-span-1">
            <StateVisualizer state={shipState} />
          </div>
        </div>

        {/* Fuel Oil Tanks */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Fuel className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Fuel Oil Tanks</h2>
              <p className="text-xs text-slate-500">Heavy Fuel Oil (HFO) bunkers</p>
            </div>
            <div className="ml-auto flex gap-4 text-sm">
              <div className="hidden md:block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-mono">
                Vol: {formatNumber(totalFoVolume)} m³
              </div>
              <div className="px-3 py-1 bg-slate-800 text-white rounded-md font-mono font-bold">
                {formatNumber(totalFoWeight)} MT
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {foTanks.map(tank => (
              <TankCalculator
                key={`${tank.id}-${resetKey}`}
                tank={tank}
                shipState={shipState}
                onUpdate={handleTankUpdate}
              />
            ))}
          </div>
        </div>

        {/* Diesel Oil Tanks */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Droplet className="text-yellow-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Diesel Oil Tanks</h2>
              <p className="text-xs text-slate-500">Marine Diesel Oil (MDO/MGO)</p>
            </div>
            <div className="ml-auto flex gap-4 text-sm">
              <div className="hidden md:block px-3 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-100 font-mono">
                Vol: {formatNumber(totalDoVolume)} m³
              </div>
              <div className="px-3 py-1 bg-slate-800 text-white rounded-md font-mono font-bold">
                {formatNumber(totalDoWeight)} MT
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {doTanks.map(tank => (
              <TankCalculator
                key={`${tank.id}-${resetKey}`}
                tank={tank}
                shipState={shipState}
                onUpdate={handleTankUpdate}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
