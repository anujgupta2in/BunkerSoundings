import React, { useMemo, useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Drafts, TankData, TankCalculationResult } from '../types';

interface ReportViewProps {
  drafts: Drafts;
  tanks: TankData[];
  results: { [tankId: string]: TankCalculationResult };
  vesselName: string;
  reportDate: string;
  onClose: () => void;
}

// helper to format numbers
const fmt = (v: number | null | undefined, decimals = 2) =>
  v == null || !Number.isFinite(v) ? '' : v.toFixed(decimals);

type Row = {
  tankId: string;
  sNo: number;
  tankName: string;
  capacity: number | null;
  maxSounding: number | null;
  sounding: number | null;
  ullage: number | null;
  volume: number | null;
  temperature: number | null;
  sg15: number | null;
  sgCorrect: number | null;
  mt: number | null;
  presentPct: number | null;
  remark: string | null;
};

const ReportView: React.FC<ReportViewProps> = ({
  drafts,
  tanks,
  results,
  vesselName,
  reportDate,
  onClose,
}) => {
  // manual log book & general remarks
  const [hfoLogInput, setHfoLogInput] = useState<string>('');
  const [mgoLogInput, setMgoLogInput] = useState<string>('');
  const [generalRemarks, setGeneralRemarks] = useState<string>('');

  // per-tank remarks (editable in table)
  const [remarks, setRemarks] = useState<{ [tankId: string]: string }>({});

  // draft averages
  const draftAverages = useMemo(() => {
    const aftAvg = (drafts.aftP + drafts.aftS) / 2;
    const midAvg = (drafts.midP + drafts.midS) / 2;
    const foreAvg = (drafts.foreP + drafts.foreS) / 2;
    return { aftAvg, midAvg, foreAvg };
  }, [drafts]);

  // split tanks by category
  const hfoTanks = useMemo(
    () => tanks.filter(t => t.category === 'Fuel Oil'),
    [tanks]
  );
  const mgoTanks = useMemo(
    () => tanks.filter(t => t.category === 'Diesel Oil'),
    [tanks]
  );

  // ---- Build rows (auto capacity, max sounding, ullage, present %, remarks) ----
  const buildRows = (list: TankData[]): Row[] =>
    list.map((tank, index) => {
      const res = results[tank.id];

      const capacity: number | null =
        typeof tank.maxVolume === 'number' ? tank.maxVolume : null;

      const maxSounding: number | null =
        typeof tank.ullageReference === 'number'
          ? tank.ullageReference
          : null;

      const sounding = res?.measuredSounding ?? null;

      // ULLAGE = Max HM - Sounding
      const ullage =
        maxSounding != null && sounding != null
          ? maxSounding - sounding
          : null;

      const volume = res?.volume ?? null;
      const temperature = res?.temperature ?? null;

      const sg15 =
        typeof (res as any)?.sgAt15 === 'number'
          ? (res as any).sgAt15
          : res?.specificGravity ?? null;

      const sgCorrect =
        typeof (res as any)?.correctedSpecificGravity === 'number'
          ? (res as any).correctedSpecificGravity
          : res?.specificGravity ?? null;

      const mt = res?.weight ?? null;

      // PRESENT % = Volume / Capacity * 100
      const presentPct =
        capacity != null && capacity > 0 && volume != null
          ? (volume / capacity) * 100
          : null;

      const anyTank = tank as any;

      // precedence: manual remark (state) → tank.remark → result.remark
      const manualRemark = remarks[tank.id];
      const remarkFromTank =
        typeof anyTank.remark === 'string' ? anyTank.remark : null;
      const remarkFromResult =
        (res as any)?.remark && typeof (res as any).remark === 'string'
          ? (res as any).remark
          : null;

      const remark: string | null =
        manualRemark != null
          ? manualRemark
          : remarkFromTank ?? remarkFromResult;

      return {
        tankId: tank.id,
        sNo: index + 1,
        tankName: tank.name ?? tank.id,
        capacity,
        maxSounding,
        sounding,
        ullage,
        volume,
        temperature,
        sg15,
        sgCorrect,
        mt,
        presentPct,
        remark,
      };
    });

  const hfoRows = buildRows(hfoTanks);
  const mgoRows = buildRows(mgoTanks);

  const sumTotals = (rows: Row[]) =>
    rows.reduce(
      (acc, r) => {
        if (r.capacity != null) acc.totalCapacity += r.capacity;
        if (r.volume != null) acc.totalVolume += r.volume;
        if (r.mt != null) acc.totalMt += r.mt;
        return acc;
      },
      { totalCapacity: 0, totalVolume: 0, totalMt: 0 }
    );

  const hfoTotals = sumTotals(hfoRows);
  const mgoTotals = sumTotals(mgoRows);

  // parse manual log book values (if given)
  const parsedHfoLog =
    hfoLogInput.trim() !== '' && !Number.isNaN(Number(hfoLogInput))
      ? Number(hfoLogInput)
      : null;

  const parsedMgoLog =
    mgoLogInput.trim() !== '' && !Number.isNaN(Number(mgoLogInput))
      ? Number(mgoLogInput)
      : null;

  // Log = manual (if entered) else auto total
  const hfoLog = parsedHfoLog ?? hfoTotals.totalMt;
  const hfoDiff = hfoTotals.totalMt - hfoLog;

  const mgoLog = parsedMgoLog ?? mgoTotals.totalMt;
  const mgoDiff = mgoTotals.totalMt - mgoLog;

  // ---------------- PDF EXPORT (one doc, HFO + MGO) ----------------
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Bunker Report - ${vesselName || 'Vessel'}`,
      105,
      12,
      { align: 'center' }
    );

    doc.setFontSize(9);
    doc.text(`Date: ${reportDate || ''}`, 14, 18);

    // Drafts block
    autoTable(doc, {
      startY: 22,
      head: [['', 'Aft', 'Midship', 'Fore']],
      body: [
        ['Draft P', drafts.aftP, drafts.midP, drafts.foreP],
        ['Draft S', drafts.aftS, drafts.midS, drafts.foreS],
        [
          'Draft Average',
          draftAverages.aftAvg.toFixed(2),
          draftAverages.midAvg.toFixed(2),
          draftAverages.foreAvg.toFixed(2),
        ],
      ],
      styles: { fontSize: 7, textColor: [40, 40, 40] },
      headStyles: {
        fillColor: [210, 210, 210],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
    });

    let y = (doc as any).lastAutoTable.finalY + 6;

    // HFO TABLE
    doc.setFontSize(11);
    doc.text('H.F.O', 105, y, { align: 'center' });
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [[
        'TANK No.',
        'CAPACITY (m³)',
        'Max HM',
        'Sounding',
        'Ullage',
        'm³',
        'temp °C',
        'S.G@15°C',
        'Correct',
        'M.T.',
        'PRESENT %',
        'REMARK',
      ]],
      body: hfoRows.map(r => [
        r.tankName,
        fmt(r.capacity, 0),
        fmt(r.maxSounding, 2),
        fmt(r.sounding, 2),
        fmt(r.ullage, 2),
        fmt(r.volume, 2),
        fmt(r.temperature, 1),
        fmt(r.sg15, 4),
        fmt(r.sgCorrect, 4),
        fmt(r.mt, 2),
        r.presentPct != null ? `${fmt(r.presentPct, 2)}%` : '',
        r.remark ?? '',
      ]),
      foot: [[
        'TOTAL',
        fmt(hfoTotals.totalCapacity, 0),
        '',
        '',
        '',
        fmt(hfoTotals.totalVolume, 2),
        '',
        '',
        '',
        fmt(hfoTotals.totalMt, 2),
        '',
        '',
      ]],
      styles: { fontSize: 7, textColor: [40, 40, 40] },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [220, 220, 220],
        fontStyle: 'bold',
        textColor: [0, 0, 0],
      },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    // HFO Log / Diff
    doc.setFontSize(8);
    doc.text(`Total: ${fmt(hfoTotals.totalMt, 3)} MT`, 150, y);
    y += 4;
    doc.text(`Log.: ${fmt(hfoLog, 3)} MT`, 150, y);
    y += 4;
    doc.text(`Diffo.: ${fmt(hfoDiff, 3)} MT`, 150, y);
    y += 8;

    // MGO TABLE
    doc.setFontSize(11);
    doc.text('M.G.O', 105, y, { align: 'center' });
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [[
        'TANK No.',
        'CAPACITY (m³)',
        'Max HM',
        'Sounding',
        'Ullage',
        'm³',
        'temp °C',
        'S.G@15°C',
        'Correct',
        'M.T.',
        'PRESENT %',
        'REMARK',
      ]],
      body: mgoRows.map(r => [
        r.tankName,
        fmt(r.capacity, 0),
        fmt(r.maxSounding, 2),
        fmt(r.sounding, 2),
        fmt(r.ullage, 2),
        fmt(r.volume, 2),
        fmt(r.temperature, 1),
        fmt(r.sg15, 4),
        fmt(r.sgCorrect, 4),
        fmt(r.mt, 2),
        r.presentPct != null ? `${fmt(r.presentPct, 2)}%` : '',
        r.remark ?? '',
      ]),
      foot: [[
        'TOTAL',
        fmt(mgoTotals.totalCapacity, 0),
        '',
        '',
        '',
        fmt(mgoTotals.totalVolume, 2),
        '',
        '',
        '',
        fmt(mgoTotals.totalMt, 2),
        '',
        '',
      ]],
      styles: { fontSize: 7, textColor: [40, 40, 40] },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [220, 220, 220],
        fontStyle: 'bold',
        textColor: [0, 0, 0],
      },
    });

    y = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(8);
    doc.text(`Total: ${fmt(mgoTotals.totalMt, 3)} MT`, 150, y);
    y += 4;
    doc.text(`Log.: ${fmt(mgoLog, 3)} MT`, 150, y);
    y += 4;
    doc.text(`Diffo.: ${fmt(mgoDiff, 3)} MT`, 150, y);
    y += 6;

    // General remarks (if any)
    if (generalRemarks.trim()) {
      doc.setFontSize(8);
      doc.text('Remarks:', 14, y);
      const wrapped = doc.splitTextToSize(generalRemarks, 180);
      doc.text(wrapped, 32, y);
    }

    const fileName = `bunker-report-${(vesselName || 'vessel').replace(
      /\s+/g,
      '-'
    )}.pdf`;
    doc.save(fileName);
  };

  // ---------------- EXCEL EXPORT (one sheet, HFO + MGO) ----------------
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheet: (string | number)[][] = [];

    // Title and header info
    sheet.push([`Bunker Report`]);
    sheet.push([
      'Vessel', vesselName || '',
      '',
      'Date', reportDate || '',
    ]);
    sheet.push([]);

    // Drafts block
    sheet.push(['', 'Aft', 'Midship', 'Fore']);
    sheet.push(['Draft P', drafts.aftP, drafts.midP, drafts.foreP]);
    sheet.push(['Draft S', drafts.aftS, drafts.midS, drafts.foreS]);
    sheet.push([
      'Draft Average',
      draftAverages.aftAvg,
      draftAverages.midAvg,
      draftAverages.foreAvg,
    ]);
    sheet.push([]);

    // HFO
    sheet.push(['H.F.O']);
    sheet.push([
      'TANK No.',
      'CAPACITY (m³)',
      'Max HM',
      'Sounding',
      'Ullage',
      'm³',
      'temp °C',
      'S.G@15°C',
      'Correct',
      'M.T.',
      'PRESENT %',
      'REMARK',
    ]);

    hfoRows.forEach(r => {
      sheet.push([
        r.tankName,
        r.capacity ?? '',
        r.maxSounding ?? '',
        r.sounding ?? '',
        r.ullage ?? '',
        r.volume ?? '',
        r.temperature ?? '',
        r.sg15 ?? '',
        r.sgCorrect ?? '',
        r.mt ?? '',
        r.presentPct ?? '',
        r.remark ?? '',
      ]);
    });

    sheet.push([
      'TOTAL',
      hfoTotals.totalCapacity,
      '',
      '',
      '',
      hfoTotals.totalVolume,
      '',
      '',
      '',
      hfoTotals.totalMt,
      '',
      '',
    ]);

    sheet.push([]);
    sheet.push(['Total (MT)', hfoTotals.totalMt]);
    sheet.push(['Log. (MT)', hfoLog]);
    sheet.push(['Diffo. (MT)', hfoDiff]);
    sheet.push([]);

    // MGO
    sheet.push(['M.G.O']);
    sheet.push([
      'TANK No.',
      'CAPACITY (m³)',
      'Max HM',
      'Sounding',
      'Ullage',
      'm³',
      'temp °C',
      'S.G@15°C',
      'Correct',
      'M.T.',
      'PRESENT %',
      'REMARK',
    ]);

    mgoRows.forEach(r => {
      sheet.push([
        r.tankName,
        r.capacity ?? '',
        r.maxSounding ?? '',
        r.sounding ?? '',
        r.ullage ?? '',
        r.volume ?? '',
        r.temperature ?? '',
        r.sg15 ?? '',
        r.sgCorrect ?? '',
        r.mt ?? '',
        r.presentPct ?? '',
        r.remark ?? '',
      ]);
    });

    sheet.push([
      'TOTAL',
      mgoTotals.totalCapacity,
      '',
      '',
      '',
      mgoTotals.totalVolume,
      '',
      '',
      '',
      mgoTotals.totalMt,
      '',
      '',
    ]);

    sheet.push([]);
    sheet.push(['Total (MT)', mgoTotals.totalMt]);
    sheet.push(['Log. (MT)', mgoLog]);
    sheet.push(['Diffo. (MT)', mgoDiff]);
    sheet.push([]);
    sheet.push(['Remarks', generalRemarks || '']);

    const ws = XLSX.utils.aoa_to_sheet(sheet);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const fileName = `bunker-report-${(vesselName || 'vessel').replace(
      /\s+/g,
      '-'
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ---------------- RENDER ----------------
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Bunker Report
              </h2>
              <p className="text-xs text-slate-500">
                Vessel: {vesselName || 'N/A'} &nbsp; | &nbsp; Date:{' '}
                {reportDate || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Download className="w-3 h-3" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Download className="w-3 h-3" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-4 text-xs">
          {/* Manual log inputs + general remarks */}
          <div className="mb-4 flex flex-wrap gap-4 items-end text-[11px]">
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-slate-700">
                HFO Log Book (MT)
              </label>
              <input
                type="number"
                step="0.001"
                value={hfoLogInput}
                onChange={e => setHfoLogInput(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 w-32 text-right"
                placeholder={hfoTotals.totalMt.toFixed(3)}
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-slate-700">
                MGO Log Book (MT)
              </label>
              <input
                type="number"
                step="0.001"
                value={mgoLogInput}
                onChange={e => setMgoLogInput(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 w-32 text-right"
                placeholder={mgoTotals.totalMt.toFixed(3)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 font-semibold text-slate-700">
                Remarks
              </label>
              <textarea
                rows={2}
                value={generalRemarks}
                onChange={e => setGeneralRemarks(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1"
                placeholder="Any additional remarks for the report / log book…"
              />
            </div>
          </div>

          {/* Drafts table */}
          <div className="mb-4">
            <table className="border border-slate-300 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 px-2 py-1"></th>
                  <th className="border border-slate-300 px-4 py-1 text-center">
                    Aft
                  </th>
                  <th className="border border-slate-300 px-4 py-1 text-center">
                    Midship
                  </th>
                  <th className="border border-slate-300 px-4 py-1 text-center">
                    Fore
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">Draft P</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {drafts.aftP.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {drafts.midP.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {drafts.foreP.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1">Draft S</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {drafts.aftS.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {drafts.midS.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {drafts.foreS.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-yellow-100">
                  <td className="border border-slate-300 px-2 py-1">
                    Draft Average
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                    {draftAverages.aftAvg.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                    {draftAverages.midAvg.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                    {draftAverages.foreAvg.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* HFO table */}
          <div className="mb-6">
            <div className="text-center font-bold text-sm mb-1">H.F.O</div>
            <table className="w-full border border-slate-300 text-[11px]">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    TANK No.
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    CAPACITY (m³)
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Max HM
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Sounding
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Ullage
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    m³
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    temp °C
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    S.G@15°C
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Correct
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    M.T.
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    PRESENT %
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    REMARK
                  </th>
                </tr>
              </thead>
              <tbody>
                {hfoRows.map(r => (
                  <tr key={r.sNo}>
                    <td className="border border-slate-300 px-1 py-1 text-left">
                      {r.tankName}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(r.capacity, 0)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(r.maxSounding, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(r.sounding, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(r.ullage, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.volume, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.temperature, 1)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.sg15, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.sgCorrect, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.mt, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {r.presentPct != null ? `${fmt(r.presentPct, 2)}%` : ''}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-left">
                      <input
                        className="w-full border border-slate-200 rounded px-1 py-0.5 text-[11px]"
                        value={remarks[r.tankId] ?? ''}
                        onChange={e =>
                          setRemarks(prev => ({
                            ...prev,
                            [r.tankId]: e.target.value,
                          }))
                        }
                        placeholder=""
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-semibold">
                  <td className="border border-slate-300 px-1 py-1 text-left">
                    TOTAL
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(hfoTotals.totalCapacity, 0)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(hfoTotals.totalVolume, 2)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(hfoTotals.totalMt, 2)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                </tr>
              </tbody>
            </table>

            {/* HFO total / log / diff */}
            <div className="mt-2 text-[11px] flex flex-col items-end gap-1">
              <div> Total: {fmt(hfoTotals.totalMt, 3)} MT</div>
              <div> Log.: {fmt(hfoLog, 3)} MT</div>
              <div> Diffo.: {fmt(hfoDiff, 3)} MT</div>
            </div>
          </div>

          {/* MGO table */}
          <div>
            <div className="text-center font-bold text-sm mb-1">M.G.O</div>
            <table className="w-full border border-slate-300 text-[11px]">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    TANK No.
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    CAPACITY (m³)
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Max HM
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Sounding
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Ullage
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    m³
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    temp °C
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    S.G@15°C
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Correct
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    M.T.
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    PRESENT %
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    REMARK
                  </th>
                </tr>
              </thead>
              <tbody>
                {mgoRows.map(r => (
                  <tr key={r.sNo}>
                    <td className="border border-slate-300 px-1 py-1 text-left">
                      {r.tankName}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(r.capacity, 0)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(r.maxSounding, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(r.sounding, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(r.ullage, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.volume, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.temperature, 1)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.sg15, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.sgCorrect, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right bg-green-50">
                      {fmt(r.mt, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {r.presentPct != null ? `${fmt(r.presentPct, 2)}%` : ''}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-left">
                      <input
                        className="w-full border border-slate-200 rounded px-1 py-0.5 text-[11px]"
                        value={remarks[r.tankId] ?? ''}
                        onChange={e =>
                          setRemarks(prev => ({
                            ...prev,
                            [r.tankId]: e.target.value,
                          }))
                        }
                        placeholder=""
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-semibold">
                  <td className="border border-slate-300 px-1 py-1 text-left">
                    TOTAL
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(mgoTotals.totalCapacity, 0)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(mgoTotals.totalVolume, 2)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(mgoTotals.totalMt, 2)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                </tr>
              </tbody>
            </table>

            <div className="mt-2 text-[11px] flex flex-col items-end gap-1">
              <div> Total: {fmt(mgoTotals.totalMt, 3)} MT</div>
              <div> Log.: {fmt(mgoLog, 3)} MT</div>
              <div> Diffo.: {fmt(mgoDiff, 3)} MT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
