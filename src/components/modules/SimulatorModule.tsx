import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Sparkles,
  Sliders,
  TrendingUp,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { ProjectState, CoefficientRow } from '../../types/logit';
import { predictProbability } from '../../utils/logisticRegression';

interface SimulatorModuleProps {
  projectState: ProjectState;
}

export const SimulatorModule: React.FC<SimulatorModuleProps> = ({ projectState }) => {
  const coefficients = projectState.coefficients || [];
  const threshold = projectState.classificationThreshold ?? 0.5;
  const activeFeatures = coefficients
    .filter((c) => c.variable !== '(Intercepto)')
    .map((c) => c.variable);

  // Compute medians / defaults for features
  const defaultValues = React.useMemo(() => {
    const vals: Record<string, number> = {};
    activeFeatures.forEach((feat) => {
      const nums = projectState.rawRows.map((r) => Number(r[feat])).filter((v) => !isNaN(v));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        vals[feat] = nums[Math.floor(nums.length / 2)];
      } else {
        vals[feat] = 0;
      }
    });
    return vals;
  }, [activeFeatures, projectState.rawRows]);

  const [inputValues, setInputValues] = useState<Record<string, number>>(defaultValues);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState<number>(0);
  const [sensitivityVar, setSensitivityVar] = useState<string>(activeFeatures[0] || '');

  // Batch scoring state
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [isScoringBatch, setIsScoringBatch] = useState(false);

  // Load existing observation from rawRows
  const handleLoadRecord = (idx: number) => {
    setSelectedRecordIdx(idx);
    const row = projectState.rawRows[idx];
    if (!row) return;
    const newVals: Record<string, number> = {};
    activeFeatures.forEach((feat) => {
      newVals[feat] = Number(row[feat]) || 0;
    });
    setInputValues(newVals);
  };

  // Score current input values
  const currentZ = React.useMemo(() => {
    let z = 0;
    for (const c of coefficients) {
      if (c.variable === '(Intercepto)') z += c.coef;
      else if (inputValues[c.variable] !== undefined) {
        z += c.coef * inputValues[c.variable];
      }
    }
    return z;
  }, [coefficients, inputValues]);

  const currentProb = 1.0 / (1.0 + Math.exp(-Math.max(-25, Math.min(25, currentZ))));
  const currentOdds = currentProb / (1.0 - currentProb);
  const currentDecision = currentProb >= threshold ? 1 : 0;

  // Sensitivity curve for selected variable
  const sensitivityCurve = React.useMemo(() => {
    if (!sensitivityVar || coefficients.length === 0) return [];
    const nums = projectState.rawRows.map((r) => Number(r[sensitivityVar])).filter((v) => !isNaN(v));
    if (nums.length === 0) return [];
    const minVal = Math.min(...nums);
    const maxVal = Math.max(...nums);
    const step = (maxVal - minVal) / 20 || 1;

    const points: { val: number; prob: number }[] = [];
    for (let x = minVal; x <= maxVal; x += step) {
      const testInputs = { ...inputValues, [sensitivityVar]: x };
      const p = predictProbability(coefficients, testInputs);
      points.push({ val: x, prob: p });
    }
    return points;
  }, [sensitivityVar, inputValues, coefficients, projectState.rawRows]);

  // Batch scoring upload handler
  const handleBatchFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScoringBatch(true);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data as Record<string, any>[];
        const scored = rows.map((r, i) => {
          const featObj: Record<string, number> = {};
          activeFeatures.forEach((f) => {
            featObj[f] = Number(r[f]) || 0;
          });
          const p = predictProbability(coefficients, featObj);
          const decision = p >= threshold ? 1 : 0;
          const tier =
            p >= 0.7 ? 'Muy Alto' : p >= 0.4 ? 'Alto' : p >= 0.2 ? 'Medio' : 'Bajo';
          return {
            ID: r.ID || r.id || `REG-${i + 1}`,
            ...r,
            Probabilidad_Estimada: parseFloat((p * 100).toFixed(2)),
            Clasificacion_Decision: decision,
            Nivel_Riesgo: tier,
            Umbral_Aplicado: threshold,
          };
        });
        setBatchResults(scored);
        setIsScoringBatch(false);
      },
      error: () => setIsScoringBatch(false),
    });
  };

  const handleDownloadBatch = () => {
    if (!batchResults || batchResults.length === 0) return;
    const csv = Papa.unparse(batchResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicciones_scoring_umbral_${threshold.toFixed(2)}.csv`;
    a.click();
  };

  // SVG Sensitivity Chart
  const svgW = 380;
  const svgH = 200;
  const pad = 35;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Simulador de Probabilidades y Predicción Masiva
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Cálculo exacto de log-odds (z), odds y probabilidad estimada p̂ para registros individuales o en lote (Batch Scoring).
        </p>
      </div>

      {/* Main Single Simulator Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
              Simulador Interactivo de Casos Individuales (Módulo 9)
            </h2>
            <p className="text-xs text-slate-500">
              Modifique los valores de entrada y observe la respuesta instantánea del predictor lineal y la probabilidad.
            </p>
          </div>

          {/* Record picker from dataset */}
          {projectState.rawRows.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Cargar fila:</span>
              <select
                value={selectedRecordIdx}
                onChange={(e) => handleLoadRecord(parseInt(e.target.value))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                {projectState.rawRows.slice(0, 30).map((r, i) => (
                  <option key={i} value={i}>
                    Registro #{i + 1} ({projectState.targetVariable} = {r[projectState.targetVariable]})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Real-Time Outcome Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Predictor Lineal (z)</span>
            <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
              {currentZ >= 0 ? `+${currentZ.toFixed(3)}` : currentZ.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Log-Odds del evento</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Odds (Razón de Momios)</span>
            <span className="font-mono-numbers text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {currentOdds < 100 ? currentOdds.toFixed(2) : '>100'} : 1
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">e^z</span>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
              Probabilidad Estimada (p̂)
            </span>
            <span className="font-mono-numbers text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {(currentProb * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-emerald-600/80 block mt-0.5">
              p̂ = 1 / (1 + e^-z)
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${
            currentDecision === 1
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
          }`}>
            <span className="text-[11px] block">Decisión (Umbral τ = {threshold.toFixed(2)})</span>
            <span className="font-bold text-lg block my-0.5">
              {currentDecision === 1 ? projectState.positiveClassLabel : projectState.negativeClassLabel}
            </span>
            <span className="text-[10px] opacity-80">
              {currentDecision === 1 ? 'Clasificado Positivo (Y=1)' : 'Clasificado Base (Y=0)'}
            </span>
          </div>
        </div>

        {/* Input Sliders / Numbers */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Ajustar Variables de Entrada (Features):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFeatures.map((feat) => {
              const val = inputValues[feat] ?? 0;
              const coeffRow = coefficients.find((c) => c.variable === feat);
              const beta = coeffRow ? coeffRow.coef : 0;

              return (
                <div key={feat} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {feat}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      β = {beta >= 0 ? `+${beta.toFixed(2)}` : beta.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={val}
                    onChange={(e) =>
                      setInputValues({
                        ...inputValues,
                        [feat]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-semibold"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sensitivity Curve Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Curva de Sensibilidad Unidimensional
            </h2>
            <p className="text-xs text-slate-500">
              Evolución de la probabilidad p̂ al variar una variable continua manteniendo todas las demás en sus valores actuales.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Variable:</span>
            <select
              value={sensitivityVar}
              onChange={(e) => setSensitivityVar(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              {activeFeatures.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SVG Sensitivity Curve */}
        <div className="flex flex-col items-center">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-lg h-52">
            {/* Axes */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Threshold horizontal line */}
            {(() => {
              const thY = svgH - pad - threshold * (svgH - 2 * pad);
              return (
                <line
                  x1={pad}
                  y1={thY}
                  x2={svgW - pad}
                  y2={thY}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })()}

            {/* Curve path */}
            {sensitivityCurve.length > 0 && (() => {
              const minX = sensitivityCurve[0].val;
              const maxX = sensitivityCurve[sensitivityCurve.length - 1].val;
              const rangeX = maxX - minX || 1;

              const pathStr = sensitivityCurve
                .map((pt, idx) => {
                  const x = pad + ((pt.val - minX) / rangeX) * (svgW - 2 * pad);
                  const y = svgH - pad - pt.prob * (svgH - 2 * pad);
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ');

              return <path d={pathStr} fill="none" stroke="#4f46e5" strokeWidth="2.5" />;
            })()}

            {/* Labels */}
            <text x={pad} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">
              {sensitivityCurve[0]?.val.toFixed(0) || 'Min'}
            </text>
            <text x={svgW - pad - 20} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">
              {sensitivityCurve[sensitivityCurve.length - 1]?.val.toFixed(0) || 'Max'}
            </text>
            <text x={svgW / 2 - 30} y={svgH - 12} className="text-[10px] fill-slate-500 font-medium">{sensitivityVar}</text>
            <text x={10} y={pad + 10} className="text-[10px] fill-slate-400 font-mono">1.0</text>
            <text x={10} y={svgH / 2} className="text-[10px] fill-slate-500 font-medium" transform={`rotate(-90 10 ${svgH / 2})`}>Probabilidad p̂</text>
          </svg>
          <span className="text-[11px] text-slate-400">
            Línea discontinua roja: umbral de corte (τ = {threshold.toFixed(2)}).
          </span>
        </div>
      </div>

      {/* Batch Scoring Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Scoring y Predicciones Masivas (Módulo 18)
            </h2>
            <p className="text-xs text-slate-500">
              Cargue un archivo CSV con nuevas observaciones para estimar probabilidades en lote y descargar resultados con categoría de riesgo.
            </p>
          </div>

          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar Archivo para Scoring</span>
            <input type="file" accept=".csv" onChange={handleBatchFile} className="hidden" />
          </label>
        </div>

        {batchResults && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Se calificaron {batchResults.length.toLocaleString()} registros con el modelo activo.
              </span>
              <button
                onClick={handleDownloadBatch}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV con Predicciones</span>
              </button>
            </div>

            {/* Preview of batch scored rows */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2 font-semibold font-mono">ID</th>
                    <th className="px-3 py-2 font-semibold text-right">Probabilidad (%)</th>
                    <th className="px-3 py-2 font-semibold text-center">Clasificación</th>
                    <th className="px-3 py-2 font-semibold text-center">Nivel de Riesgo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {batchResults.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2 font-mono text-slate-500">{r.ID}</td>
                      <td className="px-3 py-2 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                        {r.Probabilidad_Estimada}%
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.Clasificacion_Decision === 1 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {r.Clasificacion_Decision}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-indigo-600">
                        {r.Nivel_Riesgo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
