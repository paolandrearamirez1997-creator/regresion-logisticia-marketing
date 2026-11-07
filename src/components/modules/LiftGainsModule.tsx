import React, { useState } from 'react';
import {
  Percent,
  TrendingUp,
  DollarSign,
  BarChart3,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ProjectState, DecileLiftRow } from '../../types/logit';
import { calculateConfusionMatrix } from '../../utils/logisticRegression';

interface LiftGainsModuleProps {
  projectState: ProjectState;
  onUpdateEconomicParams: (params: {
    costPerContact: number;
    benefitPerPositive: number;
    costFalsePositive: number;
    costFalseNegative: number;
    totalBudget: number;
  }) => void;
  onApplyOptimalThreshold: (th: number) => void;
}

export const LiftGainsModule: React.FC<LiftGainsModuleProps> = ({
  projectState,
  onUpdateEconomicParams,
  onApplyOptimalThreshold,
}) => {
  const deciles: DecileLiftRow[] = projectState.decileLift || [];
  const probs = (projectState as any).predictedProbs || [];
  const targetCol = projectState.targetVariable;
  const actualY = projectState.rawRows.map((r) => (Number(r[targetCol]) === 1 ? 1 : 0));

  // Economic inputs state
  const [costContact, setCostContact] = useState<number>(projectState.costPerContact ?? 15);
  const [benefitTP, setBenefitTP] = useState<number>(projectState.benefitPerPositive ?? 250);
  const [costFP, setCostFP] = useState<number>(projectState.costFalsePositive ?? 30);
  const [costFN, setCostFN] = useState<number>(projectState.costFalseNegative ?? 180);
  const [budget, setBudget] = useState<number>(projectState.totalBudget ?? 10000);

  // Compute profit curve across threshold sweeps [0.05 ... 0.95]
  const economicCurve = React.useMemo(() => {
    if (probs.length === 0) return { points: [], maxProfit: 0, optTh: 0.5 };
    const thresholds: number[] = [];
    for (let t = 0.05; t <= 0.95; t += 0.02) {
      thresholds.push(parseFloat(t.toFixed(2)));
    }

    let maxProfit = -Infinity;
    let optTh = 0.5;

    const points = thresholds.map((th) => {
      const cm = calculateConfusionMatrix(probs, actualY, th);
      const totalContacted = cm.tp + cm.fp;
      const expectedCost = totalContacted * costContact + cm.fp * costFP;
      const grossBenefit = cm.tp * benefitTP;
      const penaltyFN = cm.fn * costFN;
      const netProfit = grossBenefit - expectedCost - penaltyFN;
      const roi = expectedCost > 0 ? (netProfit / expectedCost) * 100 : 0;

      if (netProfit > maxProfit) {
        maxProfit = netProfit;
        optTh = th;
      }

      return {
        threshold: th,
        tp: cm.tp,
        fp: cm.fp,
        fn: cm.fn,
        totalContacted,
        expectedCost,
        grossBenefit,
        netProfit,
        roi,
      };
    });

    return { points, maxProfit, optTh };
  }, [probs, actualY, costContact, benefitTP, costFP, costFN]);

  const currentEconomicResult = React.useMemo(() => {
    const curTh = projectState.classificationThreshold ?? 0.5;
    const cm = calculateConfusionMatrix(probs, actualY, curTh);
    const totalContacted = cm.tp + cm.fp;
    const expectedCost = totalContacted * costContact + cm.fp * costFP;
    const grossBenefit = cm.tp * benefitTP;
    const penaltyFN = cm.fn * costFN;
    const netProfit = grossBenefit - expectedCost - penaltyFN;
    const roi = expectedCost > 0 ? (netProfit / expectedCost) * 100 : 0;
    return {
      threshold: curTh,
      tp: cm.tp,
      fp: cm.fp,
      fn: cm.fn,
      totalContacted,
      expectedCost,
      grossBenefit,
      netProfit,
      roi,
    };
  }, [probs, actualY, projectState.classificationThreshold, costContact, benefitTP, costFP, costFN]);

  // SVG dimensions
  const svgW = 340;
  const svgH = 200;
  const pad = 35;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Curvas Lift, Ganancias Acumuladas (Gains) y Optimización Financiera
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Metodología de R (paquetes ROCR y lift): ranking por deciles de riesgo, tasa de captura y maximización de la ganancia neta mediante costos y beneficios del negocio.
        </p>
      </div>

      {/* Gains Chart and Lift Chart side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cumulative Gains Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                Curva de Ganancias Acumuladas (Gains Chart)
              </h2>
              <span className="text-xs text-slate-400">% de eventos positivos capturados vs % población</span>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600">
              Top 20% capta {deciles[1]?.cumCaptureRate.toFixed(1) || '0'}%
            </span>
          </div>

          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48">
              {/* Axes */}
              <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* 45 deg baseline (random selection) */}
              <line
                x1={pad}
                y1={svgH - pad}
                x2={svgW - pad}
                y2={pad}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Gains line */}
              {deciles.length > 0 && (
                <path
                  d={
                    `M ${pad} ${svgH - pad} ` +
                    deciles
                      .map((d) => {
                        const x = pad + (d.decile / 10) * (svgW - 2 * pad);
                        const y = svgH - pad - (d.cumCaptureRate / 100) * (svgH - 2 * pad);
                        return `L ${x} ${y}`;
                      })
                      .join(' ')
                  }
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
              )}

              {/* Labels */}
              <text x={pad} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">0%</text>
              <text x={svgW - pad - 15} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">100%</text>
              <text x={svgW / 2 - 35} y={svgH - 12} className="text-[10px] fill-slate-500 font-medium">% Contactado</text>
              <text x={10} y={pad + 10} className="text-[10px] fill-slate-400 font-mono">100%</text>
              <text x={10} y={svgH / 2} className="text-[10px] fill-slate-500 font-medium" transform={`rotate(-90 10 ${svgH / 2})`}>% Captura</text>
            </svg>
            <span className="text-[11px] text-slate-400 mt-1">
              La curva verde por encima de la diagonal gris cuantifica la eficiencia del modelo frente al azar.
            </span>
          </div>
        </div>

        {/* Cumulative Lift Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                Curva Lift Acumulada
              </h2>
              <span className="text-xs text-slate-400">Multiplicador de respuesta vs selección aleatoria</span>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-600">
              Decil 1 Lift: {deciles[0]?.cumLift.toFixed(2) || '1.0'}x
            </span>
          </div>

          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48">
              {/* Axes */}
              <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Baseline 1.0 */}
              {(() => {
                const maxLift = Math.max(3.5, deciles[0]?.cumLift || 2.5);
                const baseLineY = svgH - pad - (1.0 / maxLift) * (svgH - 2 * pad);
                return (
                  <line
                    x1={pad}
                    y1={baseLineY}
                    x2={svgW - pad}
                    y2={baseLineY}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                );
              })()}

              {/* Lift line */}
              {deciles.length > 0 && (() => {
                const maxLift = Math.max(3.5, deciles[0]?.cumLift || 2.5);
                const pathStr = deciles
                  .map((d, idx) => {
                    const x = pad + (d.decile / 10) * (svgW - 2 * pad);
                    const y = svgH - pad - (d.cumLift / maxLift) * (svgH - 2 * pad);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ');
                return <path d={pathStr} fill="none" stroke="#4f46e5" strokeWidth="3" />;
              })()}

              {/* Labels */}
              <text x={pad} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">D1</text>
              <text x={svgW - pad - 15} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">D10</text>
              <text x={svgW / 2 - 20} y={svgH - 12} className="text-[10px] fill-slate-500 font-medium">Deciles</text>
              <text x={10} y={svgH / 2} className="text-[10px] fill-slate-500 font-medium" transform={`rotate(-90 10 ${svgH / 2})`}>Lift Factor</text>
            </svg>
            <span className="text-[11px] text-slate-400 mt-1">
              Línea discontinua: Lift = 1.0 (selección aleatoria sin modelo predictivo).
            </span>
          </div>
        </div>
      </div>

      {/* Decile Ranking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
            Tabla de Deciles de Riesgo y Lift Acumulado
          </h2>
          <p className="text-xs text-slate-500">
            Población ordenada descendentemente por probabilidad estimada p̂ y dividida en 10 partes iguales.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2 font-semibold">Decil</th>
                <th className="px-3 py-2 font-semibold text-right">Observaciones</th>
                <th className="px-3 py-2 font-semibold text-right">Eventos Reales (Y=1)</th>
                <th className="px-3 py-2 font-semibold text-right">Tasa Respuesta (%)</th>
                <th className="px-3 py-2 font-semibold text-right">Ganancia Acumulada (%)</th>
                <th className="px-3 py-2 font-semibold text-right">Lift Acumulado</th>
                <th className="px-3 py-2 font-semibold text-right">Lift No Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {deciles.map((row) => (
                <tr key={row.decile} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                    Decil {row.decile}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-numbers text-slate-500">
                    {row.totalCount}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-numbers text-emerald-600 dark:text-emerald-400 font-semibold">
                    {row.positives}
                  </td>
                  <td className="px-3 py-2 text-right font-mono-numbers">
                    {row.responseRate.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                    {row.cumCaptureRate.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono-numbers font-bold text-indigo-600 dark:text-indigo-400">
                    {row.cumLift.toFixed(2)}x
                  </td>
                  <td className="px-3 py-2 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                    {row.nonCumLift.toFixed(2)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Economic ROI Optimization Model */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Modelo Económico y Optimización Financiera del Umbral
            </h2>
            <p className="text-xs text-slate-500">
              Configure la matriz de costos y beneficios para encontrar el umbral τ* que maximiza la rentabilidad neta esperada.
            </p>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Costo Contacto / Acción ($):
            </label>
            <input
              type="number"
              value={costContact}
              onChange={(e) => setCostContact(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
              Beneficio por TP Identificado ($):
            </label>
            <input
              type="number"
              value={benefitTP}
              onChange={(e) => setBenefitTP(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs font-mono font-semibold text-emerald-900 dark:text-emerald-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-rose-700 dark:text-rose-300 mb-1">
              Costo Falso Positivo (FP) ($):
            </label>
            <input
              type="number"
              value={costFP}
              onChange={(e) => setCostFP(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 text-xs font-mono font-semibold text-rose-900 dark:text-rose-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
              Costo Falso Negativo (FN) ($):
            </label>
            <input
              type="number"
              value={costFN}
              onChange={(e) => setCostFN(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 text-xs font-mono font-semibold text-amber-900 dark:text-amber-200"
            />
          </div>
        </div>

        {/* Current vs Optimal Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Current Threshold Economic Outcome */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Resultado con Umbral Actual (τ = {currentEconomicResult.threshold.toFixed(2)})
              </span>
              <span className="font-mono text-xs text-slate-400">
                Contactados: {currentEconomicResult.totalContacted}
              </span>
            </div>
            <div className="font-mono-numbers text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${currentEconomicResult.netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Costo: ${currentEconomicResult.expectedCost.toLocaleString()}</span>
              <span>·</span>
              <span>ROI: {currentEconomicResult.roi.toFixed(1)}%</span>
            </div>
          </div>

          {/* Optimal Threshold Economic Outcome */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                Umbral Económicamente Óptimo (τ* = {economicCurve.optTh.toFixed(2)})
              </span>
              <button
                onClick={() => onApplyOptimalThreshold(economicCurve.optTh)}
                className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px]"
              >
                Aplicar τ* Óptimo
              </button>
            </div>
            <div className="font-mono-numbers text-2xl font-bold text-indigo-900 dark:text-indigo-200">
              ${economicCurve.maxProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-700/80 dark:text-indigo-300/80">
              <span>
                Ganancia adicional vs actual: +$
                {Math.max(0, economicCurve.maxProfit - currentEconomicResult.netProfit).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
