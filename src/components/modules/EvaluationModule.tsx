import React, { useState } from 'react';
import {
  TableProperties,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ProjectState,
  ConfusionMatrixData,
  RocCurvePoint,
  PrecisionRecallPoint,
} from '../../types/logit';
import {
  calculateConfusionMatrix,
  calculateMetricsFromConfusion,
} from '../../utils/logisticRegression';

interface EvaluationModuleProps {
  projectState: ProjectState;
  onUpdateThreshold: (newThreshold: number) => void;
}

export const EvaluationModule: React.FC<EvaluationModuleProps> = ({
  projectState,
  onUpdateThreshold,
}) => {
  const currentThreshold = projectState.classificationThreshold ?? 0.5;
  const probs = projectState.fitMetrics ? (projectState as any).predictedProbs || [] : [];
  const targetCol = projectState.targetVariable;

  // Actual targets
  const actualY = projectState.rawRows.map((r) => (Number(r[targetCol]) === 1 ? 1 : 0));

  // Compute live confusion matrix based on currentThreshold
  const liveCM = React.useMemo(() => {
    if (probs.length > 0 && actualY.length > 0) {
      return calculateConfusionMatrix(probs, actualY, currentThreshold);
    }
    return projectState.confusionMatrix || { tp: 0, tn: 0, fp: 0, fn: 0, total: 0 };
  }, [probs, actualY, currentThreshold, projectState.confusionMatrix]);

  const liveMetrics = React.useMemo(() => {
    return calculateMetricsFromConfusion(liveCM);
  }, [liveCM]);

  const roc = projectState.rocCurve || [];
  const pr = projectState.prCurve || [];
  const auc = projectState.fitMetrics?.auc ?? 0.5;
  const ap = projectState.fitMetrics?.averagePrecision ?? 0.5;

  // Find optimal Youden's J threshold
  const optimalYoudenPoint = React.useMemo(() => {
    if (roc.length === 0) return null;
    let maxJ = -1;
    let bestPt = roc[0];
    for (const pt of roc) {
      if (pt.youdenJ > maxJ) {
        maxJ = pt.youdenJ;
        bestPt = pt;
      }
    }
    return bestPt;
  }, [roc]);

  // Cut-off comparison table (0.10 to 0.90)
  const cutoffTable = React.useMemo(() => {
    if (probs.length === 0) return [];
    const cuts = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    return cuts.map((th) => {
      const cm = calculateConfusionMatrix(probs, actualY, th);
      const m = calculateMetricsFromConfusion(cm);
      return {
        threshold: th,
        accuracy: m.accuracy,
        precision: m.precision,
        recall: m.recall,
        specificity: m.specificity,
        f1: m.f1,
        tp: cm.tp,
        fp: cm.fp,
        fn: cm.fn,
      };
    });
  }, [probs, actualY]);

  // SVG Chart Dimensions
  const chartW = 340;
  const chartH = 220;
  const pad = 35;

  // Render ROC SVG path
  const rocPath = React.useMemo(() => {
    if (roc.length === 0) return '';
    return roc
      .map((pt, idx) => {
        const x = pad + pt.fpr * (chartW - 2 * pad);
        const y = chartH - pad - pt.tpr * (chartH - 2 * pad);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [roc]);

  // Render PR SVG path
  const prPath = React.useMemo(() => {
    if (pr.length === 0) return '';
    return pr
      .map((pt, idx) => {
        const x = pad + pt.recall * (chartW - 2 * pad);
        const y = chartH - pad - pt.precision * (chartH - 2 * pad);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [pr]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Evaluación del Modelo, Matriz de Confusión y Curvas ROC / PR
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ajuste dinámico del umbral de decisión (τ), cálculo de métricas de discriminación (Sensibilidad, Especificidad, F1) y curvas de rendimiento predictivo.
        </p>
      </div>

      {/* Threshold Slider Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Control de Decisión Operativa
            </span>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
              Umbral de Clasificación (τ) = {(currentThreshold * 100).toFixed(0)}%
            </h2>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Presets:</span>
            {[0.2, 0.3, 0.4, 0.5].map((th) => (
              <button
                key={th}
                onClick={() => onUpdateThreshold(th)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  Math.abs(currentThreshold - th) < 0.01
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {th.toFixed(2)}
              </button>
            ))}
            {optimalYoudenPoint && (
              <button
                onClick={() => onUpdateThreshold(parseFloat(optimalYoudenPoint.threshold.toFixed(2)))}
                className="px-2.5 py-1 text-xs rounded border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold"
                title={`Óptimo Youden J (τ = ${optimalYoudenPoint.threshold.toFixed(2)})`}
              >
                Youden J ({optimalYoudenPoint.threshold.toFixed(2)})
              </button>
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.01}
            value={currentThreshold}
            onChange={(e) => onUpdateThreshold(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>τ = 0.05 (Máxima Sensibilidad / Captura)</span>
            <span>τ = 0.50 (Estándar)</span>
            <span>τ = 0.95 (Máxima Precisión / Conservador)</span>
          </div>
        </div>
      </div>

      {/* Confusion Matrix and Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (4 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
              Matriz de Confusión Dinámica
            </h2>
            <span className="text-xs font-mono text-slate-400">τ = {currentThreshold.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* TP */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Verdaderos Positivos (TP)
              </span>
              <span className="font-mono-numbers text-3xl font-bold text-emerald-700 dark:text-emerald-400 block my-1">
                {liveCM.tp.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80">
                Predicho 1 · Real 1
              </span>
            </div>

            {/* FP */}
            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block">
                Falsos Positivos (FP - Tipo I)
              </span>
              <span className="font-mono-numbers text-3xl font-bold text-rose-700 dark:text-rose-400 block my-1">
                {liveCM.fp.toLocaleString()}
              </span>
              <span className="text-[11px] text-rose-600/90 dark:text-rose-400/80">
                Predicho 1 · Real 0
              </span>
            </div>

            {/* FN */}
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                Falsos Negativos (FN - Tipo II)
              </span>
              <span className="font-mono-numbers text-3xl font-bold text-amber-700 dark:text-amber-400 block my-1">
                {liveCM.fn.toLocaleString()}
              </span>
              <span className="text-[11px] text-amber-600/90 dark:text-amber-400/80">
                Predicho 0 · Real 1
              </span>
            </div>

            {/* TN */}
            <div className="p-4 bg-slate-100/70 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Verdaderos Negativos (TN)
              </span>
              <span className="font-mono-numbers text-3xl font-bold text-slate-800 dark:text-slate-200 block my-1">
                {liveCM.tn.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">
                Predicho 0 · Real 0
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex justify-between pt-1">
            <span>Total Evaluado: <strong>{liveCM.total.toLocaleString()}</strong></span>
            <span>Tasa de Error: <strong>{(liveMetrics.totalErrorRate * 100).toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Metrics Grid (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
              Métricas Estadístico-Predictivas
            </h2>
            <span className="text-xs text-slate-400">Sensibilidad vs Precisión</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Sensibilidad (Recall)</span>
              <span className="font-mono-numbers text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {(liveMetrics.recall * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">TP / (TP + FN)</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Especificidad (TNR)</span>
              <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
                {(liveMetrics.specificity * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">TN / (TN + FP)</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Precisión (VPP)</span>
              <span className="font-mono-numbers text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {(liveMetrics.precision * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">TP / (TP + FP)</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Exactitud (Accuracy)</span>
              <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
                {(liveMetrics.accuracy * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">(TP + TN) / Total</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">F1-Score (Armónico)</span>
              <span className="font-mono-numbers text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {liveMetrics.f1.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">2·P·R / (P + R)</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Índice Youden J</span>
              <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
                {liveMetrics.youdenJ.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Sens + Espec - 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROC and PR Curves Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                Curva ROC (Receiver Operating Characteristic)
              </h3>
              <span className="text-xs text-slate-400">TPR vs FPR a lo largo de todos los umbrales</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                AUC = {auc.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {auc >= 0.9 ? 'Sobresaliente' : auc >= 0.8 ? 'Excelente' : auc >= 0.7 ? 'Aceptable' : 'Pobre'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52">
              {/* Axes */}
              <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1={pad} y1={pad} x2={pad} y2={chartH - pad} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Diagonal 45 deg line */}
              <line
                x1={pad}
                y1={chartH - pad}
                x2={chartW - pad}
                y2={pad}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* ROC Path */}
              {rocPath && <path d={rocPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" />}

              {/* Active threshold point */}
              {(() => {
                const fprPt = 1 - liveMetrics.specificity;
                const tprPt = liveMetrics.recall;
                const cx = pad + fprPt * (chartW - 2 * pad);
                const cy = chartH - pad - tprPt * (chartH - 2 * pad);
                return <circle cx={cx} cy={cy} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />;
              })()}

              {/* Labels */}
              <text x={pad} y={chartH - 12} className="text-[10px] fill-slate-400 font-mono">0.0</text>
              <text x={chartW - pad - 10} y={chartH - 12} className="text-[10px] fill-slate-400 font-mono">1.0</text>
              <text x={chartW / 2 - 25} y={chartH - 12} className="text-[10px] fill-slate-500 font-medium">1 - Espec (FPR)</text>
              <text x={10} y={pad + 10} className="text-[10px] fill-slate-400 font-mono">1.0</text>
              <text x={10} y={chartH / 2} className="text-[10px] fill-slate-500 font-medium" transform={`rotate(-90 10 ${chartH / 2})`}>Sensibilidad</text>
            </svg>
            <span className="text-[11px] text-slate-400">
              Punto verde: umbral operativo actual (τ = {currentThreshold.toFixed(2)}).
            </span>
          </div>
        </div>

        {/* Precision-Recall Curve */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
                Curva Precision-Recall (PR)
              </h3>
              <span className="text-xs text-slate-400">Crítica en desbalance de clases (fraude / mora)</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                AP = {ap.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block">Average Precision</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52">
              {/* Axes */}
              <line x1={pad} y1={chartH - pad} x2={chartW - pad} y2={chartH - pad} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1={pad} y1={pad} x2={pad} y2={chartH - pad} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* PR Path */}
              {prPath && <path d={prPath} fill="none" stroke="#059669" strokeWidth="2.5" />}

              {/* Active point */}
              {(() => {
                const recPt = liveMetrics.recall;
                const precPt = liveMetrics.precision;
                const cx = pad + recPt * (chartW - 2 * pad);
                const cy = chartH - pad - precPt * (chartH - 2 * pad);
                return <circle cx={cx} cy={cy} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />;
              })()}

              {/* Labels */}
              <text x={pad} y={chartH - 12} className="text-[10px] fill-slate-400 font-mono">0.0</text>
              <text x={chartW - pad - 10} y={chartH - 12} className="text-[10px] fill-slate-400 font-mono">1.0</text>
              <text x={chartW / 2 - 20} y={chartH - 12} className="text-[10px] fill-slate-500 font-medium">Recall</text>
              <text x={10} y={pad + 10} className="text-[10px] fill-slate-400 font-mono">1.0</text>
              <text x={10} y={chartH / 2} className="text-[10px] fill-slate-500 font-medium" transform={`rotate(-90 10 ${chartH / 2})`}>Precisión</text>
            </svg>
            <span className="text-[11px] text-slate-400">
              Punto azul: precisión ({ (liveMetrics.precision * 100).toFixed(1) }%) vs recall ({ (liveMetrics.recall * 100).toFixed(1) }%).
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
            Tabla Comparativa de Puntos de Corte (Cutoff Thresholds)
          </h2>
          <p className="text-xs text-slate-500">
            Trade-off entre sensibilidad y especificidad a través de los diferentes umbrales operativos.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2 font-semibold">Umbral (τ)</th>
                <th className="px-3 py-2 font-semibold text-right">Accuracy</th>
                <th className="px-3 py-2 font-semibold text-right">Sensibilidad</th>
                <th className="px-3 py-2 font-semibold text-right">Especificidad</th>
                <th className="px-3 py-2 font-semibold text-right">Precisión</th>
                <th className="px-3 py-2 font-semibold text-right">F1-Score</th>
                <th className="px-3 py-2 font-semibold text-right">TP / FP / FN</th>
                <th className="px-3 py-2 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {cutoffTable.map((row) => {
                const isSelected = Math.abs(currentThreshold - row.threshold) < 0.01;
                return (
                  <tr
                    key={row.threshold}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {row.threshold.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono-numbers">
                      {(row.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono-numbers text-emerald-600 dark:text-emerald-400">
                      {(row.recall * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono-numbers">
                      {(row.specificity * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono-numbers text-indigo-600 dark:text-indigo-400">
                      {(row.precision * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right font-mono-numbers">
                      {row.f1.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono-numbers text-slate-500">
                      {row.tp} / {row.fp} / {row.fn}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => onUpdateThreshold(row.threshold)}
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? 'Activo' : 'Elegir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
