import React, { useMemo } from 'react';
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

const ReportView: React.FC<ReportViewProps> = ({
  drafts,
  tanks,
  results,
  vesselName,
  reportDate,
  onClose,
}) => {
  const draftAverages = useMemo(() => {
    const aftAvg = (drafts.aftP + drafts.aftS) / 2;
    const midAvg = (drafts.midP + drafts.midS) / 2;
    const foreAvg = (drafts.foreP + drafts.foreS) / 2;
    return { aftAvg, midAvg, foreAvg };
  }, [drafts]);

  const foTanks = useMemo(
    () => tanks.filter(t => t.category === 'Fuel Oil'),
    [tanks]
  );
  const doTanks = useMemo(
    () => tanks.filter(t => t.category === 'Diesel Oil'),
    [tanks]
  );

  const buildRows = (list: TankData[]) =>
    list.map((tank, index) => {
      const res = results[tank.id];
      return {
        sNo: index + 1,
        tank: tank.name ?? tank.id,
        sounding: res?.measuredSounding ?? null,
        correctedSounding: res?.correctedSounding ?? null,
        volume: res?.volume ?? null,
        temperature: res?.temperature ?? null,
        sg: res?.specificGravity ?? null,
        correctedSg: (res as any)?.correctedSpecificGravity ?? null, // if you have this
        weight: res?.weight ?? null,
      };
    });

  const foRows = buildRows(foTanks);
  const doRows = buildRows(doTanks);

  const sumTotals = (rows: typeof foRows) =>
    rows.reduce(
      (acc, r) => {
        if (r.volume != null) acc.totalVolume += r.volume;
        if (r.weight != null) acc.totalWeight += r.weight;
        return acc;
      },
      { totalVolume: 0, totalWeight: 0 }
    );

  const foTotals = sumTotals(foRows);
  const doTotals = sumTotals(doRows);

  const fmt = (v: number | null, decimals: number = 2) =>
    v == null || !Number.isFinite(v) ? '' : v.toFixed(decimals);

  // ---------- PDF: one doc, all tables ----------
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const title = `Bunker Sounding Report - ${vesselName || 'Vessel'}`;

    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${reportDate || ''}`, 14, 21);

    // Drafts
    autoTable(doc, {
      startY: 26,
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
      styles: { fontSize: 8 },
      headStyles: { fillColor: [230, 230, 230] },
    });

    let y = (doc as any).lastAutoTable.finalY + 8;

    // FO Tanks
    doc.setFontSize(10);
    doc.text('FO Tanks', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [[
        'S.No',
        'Tank',
        'Sounding (m)',
        'Corrected Sounding',
        'm³',
        'Temp (°C)',
        'Specific Gravity',
        'Corrected S.G.',
        'M.T.',
      ]],
      body: foRows.map(r => [
        r.sNo,
        r.tank,
        fmt(r.sounding, 3),
        fmt(r.correctedSounding, 3),
        fmt(r.volume, 2),
        fmt(r.temperature, 1),
        fmt(r.sg, 4),
        fmt(r.correctedSg, 4),
        fmt(r.weight, 2),
      ]),
      foot: [[
        '',
        '',
        '',
        'TOTAL',
        fmt(foTotals.totalVolume, 2),
        '',
        '',
        '',
        fmt(foTotals.totalWeight, 2),
      ]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 240, 240] },
      footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // DO Tanks
    doc.setFontSize(10);
    doc.text('DO Tanks', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [[
        'S.No',
        'Tank',
        'Sounding (m)',
        'Corrected Sounding',
        'm³',
        'Temp (°C)',
        'Specific Gravity',
        'Corrected S.G.',
        'M.T.',
      ]],
      body: doRows.map(r => [
        r.sNo,
        r.tank,
        fmt(r.sounding, 3),
        fmt(r.correctedSounding, 3),
        fmt(r.volume, 2),
        fmt(r.temperature, 1),
        fmt(r.sg, 4),
        fmt(r.correctedSg, 4),
        fmt(r.weight, 2),
      ]),
      foot: [[
        '',
        '',
        '',
        'TOTAL',
        fmt(doTotals.totalVolume, 2),
        '',
        '',
        '',
        fmt(doTotals.totalWeight, 2),
      ]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 240, 240] },
      footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
    });

    const fileName = `bunker-report-${(vesselName || 'vessel').replace(
      /\s+/g,
      '-'
    )}.pdf`;
    doc.save(fileName);
  };

  // ---------- Excel: one sheet, all tables ----------
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const sheetData: (string | number)[][] = [];

    // Title + header info
    sheetData.push([`Bunker Sounding Report`]);
    sheetData.push([
      'Vessel', vesselName || '',
      '',
      'Date', reportDate || '',
    ]);
    sheetData.push([]); // blank

    // Drafts block
    sheetData.push(['', 'Aft', 'Midship', 'Fore']);
    sheetData.push(['Draft P', drafts.aftP, drafts.midP, drafts.foreP]);
    sheetData.push(['Draft S', drafts.aftS, drafts.midS, drafts.foreS]);
    sheetData.push([
      'Draft Average',
      draftAverages.aftAvg,
      draftAverages.midAvg,
      draftAverages.foreAvg,
    ]);

    sheetData.push([]);
    sheetData.push(['FO Tanks']);
    sheetData.push([
      'S.No',
      'Tank',
      'Sounding (m)',
      'Corrected Sounding',
      'm³',
      'Temp (°C)',
      'Specific Gravity',
      'Corrected S.G.',
      'M.T.',
    ]);
    foRows.forEach(r => {
      sheetData.push([
        r.sNo,
        r.tank,
        r.sounding ?? '',
        r.correctedSounding ?? '',
        r.volume ?? '',
        r.temperature ?? '',
        r.sg ?? '',
        r.correctedSg ?? '',
        r.weight ?? '',
      ]);
    });
    sheetData.push([
      '',
      '',
      '',
      'TOTAL',
      foTotals.totalVolume,
      '',
      '',
      '',
      foTotals.totalWeight,
    ]);

    sheetData.push([]);
    sheetData.push(['DO Tanks']);
    sheetData.push([
      'S.No',
      'Tank',
      'Sounding (m)',
      'Corrected Sounding',
      'm³',
      'Temp (°C)',
      'Specific Gravity',
      'Corrected S.G.',
      'M.T.',
    ]);
    doRows.forEach(r => {
      sheetData.push([
        r.sNo,
        r.tank,
        r.sounding ?? '',
        r.correctedSounding ?? '',
        r.volume ?? '',
        r.temperature ?? '',
        r.sg ?? '',
        r.correctedSg ?? '',
        r.weight ?? '',
      ]);
    });
    sheetData.push([
      '',
      '',
      '',
      'TOTAL',
      doTotals.totalVolume,
      '',
      '',
      '',
      doTotals.totalWeight,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const fileName = `bunker-report-${(vesselName || 'vessel').replace(
      /\s+/g,
      '-'
    )}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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
                Bunker Sounding Report
              </h2>
              <p className="text-xs text-slate-500">
                Vessel: {vesselName || 'N/A'} &nbsp; | &nbsp; Date: {reportDate || 'N/A'}
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

        {/* Body – same format as Excel sample, with FO + DO */}
        <div className="flex-1 overflow-auto px-6 py-4 text-xs">
          {/* Draft table */}
          <div className="mb-6">
            <table className="border border-slate-300 text-xs">
              <thead>
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

          {/* FO Tanks */}
          <div className="mb-6">
            <div className="mb-2 font-semibold text-slate-800 text-xs">
              FO Tanks
            </div>
            <table className="w-full border border-slate-300 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 px-1 py-1 text-center w-10">
                    S.No
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Tank
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Sounding (m)
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Corrected Sounding
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    m³
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Temp (°C)
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Specific Gravity
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Corrected Specific Gravity
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    M.T.
                  </th>
                </tr>
              </thead>
              <tbody>
                {foRows.map(row => (
                  <tr key={row.sNo}>
                    <td className="border border-slate-300 px-1 py-1 text-center">
                      {row.sNo}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-center">
                      {row.tank}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(row.sounding, 3)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.correctedSounding, 3)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.volume, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(row.temperature, 1)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(row.sg, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.correctedSg, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.weight, 2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-semibold">
                  <td className="border border-slate-300 px-1 py-1" colSpan={4}>
                    TOTAL
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(foTotals.totalVolume, 2)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(foTotals.totalWeight, 2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DO Tanks */}
          <div>
            <div className="mb-2 font-semibold text-slate-800 text-xs">
              DO Tanks
            </div>
            <table className="w-full border border-slate-300 text-[11px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 px-1 py-1 text-center w-10">
                    S.No
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Tank
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Sounding (m)
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Corrected Sounding
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    m³
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Temp (°C)
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Specific Gravity
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    Corrected Specific Gravity
                  </th>
                  <th className="border border-slate-300 px-1 py-1 text-center">
                    M.T.
                  </th>
                </tr>
              </thead>
              <tbody>
                {doRows.map(row => (
                  <tr key={row.sNo}>
                    <td className="border border-slate-300 px-1 py-1 text-center">
                      {row.sNo}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-center">
                      {row.tank}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(row.sounding, 3)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.correctedSounding, 3)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.volume, 2)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(row.temperature, 1)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right text-blue-700">
                      {fmt(row.sg, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.correctedSg, 4)}
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-right">
                      {fmt(row.weight, 2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-semibold">
                  <td className="border border-slate-300 px-1 py-1" colSpan={4}>
                    TOTAL
                  </td>
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(doTotals.totalVolume, 2)}
                  </td>
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1" />
                  <td className="border border-slate-300 px-1 py-1 text-right">
                    {fmt(doTotals.totalWeight, 2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
