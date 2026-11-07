import React, { useState } from 'react';
import {
  CheckCircle2,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Shield,
} from 'lucide-react';
import { ProjectState, CrossValidationFoldResult } from '../../types/logit';
import { runStratifiedCrossValidation } from '../../utils/logisticRegression';

interface ValidationModuleProps {
  projectState: ProjectState;
  onUpdateSplitConfig: (ratio: number, seed: number) => void;
  onUpdateCvResults: (results: CrossValidationFoldResult[]) => void;
}

export const ValidationModule: React.FC<ValidationModuleProps> = ({
  projectState,
  onUpdateSplitConfig,
  onUpdateCvResults,
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(projectState.trainTestSplitRatio || 0.75);
  const [seed, setSeed] = useState<number>(projectState.randomSeed || 42);
  const [kFolds, setKFolds] = useState<number>(5);
  const [isRunningCv, setIsRunningCv] = useState(false);

  const totalN = projectState.rawRows.length;
  const trainN = Math.round(totalN * splitRatio);
  const testN = totalN - trainN;

  const cvResults = projectState.cvResults;

  const handleApplySplit = () => {
    onUpdateSplitConfig(splitRatio, seed);
  };

  const handleRunCV = () => {
    const rawRows = projectState.rawRows;
    const targetCol = projectState.targetVariable;
    if (rawRows.length === 0 || !targetCol) return;

    setIsRunningCv(true);
    setTimeout(() => {
      const activeFeatures = projectState.selectedFeatures.length > 0
        ? projectState.selectedFeatures
        : projectState.columns.filter((c) => !c.isExcluded && c.name !== targetCol).map((c) => c.name);

      const X_data = rawRows.map((r) => activeFeatures.map((f) => Number(r[f]) || 0));
      const y_data = rawRows.map((r) => (Number(r[targetCol]) === 1 ? 1 : 0));

      const results = runStratifiedCrossValidation(X_data, y_data, activeFeatures, kFolds);
      onUpdateCvResults(results);
      setIsRunningCv(false);
    }, 250);
  };

  // Compute CV aggregates
  const avgAuc = cvResults.length > 0 ? cvResults.reduce((a, b) => a + b.auc, 0) / cvResults.length : 0;
  const avgAcc = cvResults.length > 0 ? cvResults.reduce((a, b) => a + b.accuracy, 0) / cvResults.length : 0;
  const avgBrier = cvResults.length > 0 ? cvResults.reduce((a, b) => a + b.brierScore, 0) / cvResults.length : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Estrategia de Entrenamiento y Validación Cruzada
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          División reproducible Train / Test con control de desbalance y Validación Cruzada Estratificada (Stratified K-Fold CV) para mitigar sobreajuste.
        </p>
      </div>

      {/* Split Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
            Partición de Datos (Holdout Train / Test)
          </h2>
          <p className="text-xs text-slate-500">
            Define la proporción de observaciones destinadas al ajuste de parámetros y a la evaluación fuera de muestra.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Proporción de Entrenamiento: {(splitRatio * 100).toFixed(0)}% / {((1 - splitRatio) * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={0.6}
              max={0.9}
              step={0.05}
              value={splitRatio}
              onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>60/40</span>
              <span className="font-bold text-indigo-600">75/25 (R script)</span>
              <span>90/10</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Semilla Aleatoria (random_state):
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Garantiza reproducibilidad exacta en auditorías científicas
            </span>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplySplit}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              Guardar Partición Holdout
            </button>
          </div>
        </div>

        {/* Distribution preview strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Total Registros (N)</span>
            <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
              {totalN.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900/40">
            <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block">
              Entrenamiento (Train) {(splitRatio * 100).toFixed(0)}%
            </span>
            <span className="font-mono-numbers text-lg font-bold text-indigo-900 dark:text-indigo-200">
              {trainN.toLocaleString()} obs
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">
              Prueba (Test) {((1 - splitRatio) * 100).toFixed(0)}%
            </span>
            <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
              {testN.toLocaleString()} obs
            </span>
          </div>
        </div>
      </div>

      {/* Stratified K-Fold Cross Validation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
              Validación Cruzada Estratificada (Stratified K-Fold)
            </h2>
            <p className="text-xs text-slate-500">
              Evalúa la estabilidad del estimador logístico a lo largo de K particiones manteniendo fija la proporción del evento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Folds (K):</span>
              <select
                value={kFolds}
                onChange={(e) => setKFolds(parseInt(e.target.value))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                <option value={3}>3 Folds</option>
                <option value={5}>5 Folds (Estándar)</option>
                <option value={10}>10 Folds (Riguroso)</option>
              </select>
            </div>

            <button
              onClick={handleRunCV}
              disabled={isRunningCv || totalN === 0}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningCv ? 'Ejecutando Folds...' : 'Ejecutar K-Fold CV'}</span>
            </button>
          </div>
        </div>

        {cvResults.length > 0 && (
          <div className="space-y-4">
            {/* Aggregated KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 block mb-1">
                  AUC-ROC Promedio ({kFolds} Folds)
                </span>
                <span className="font-mono-numbers text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {avgAuc.toFixed(3)}
                </span>
                <span className="text-[10px] text-emerald-600/80 block mt-0.5">
                  Capacidad de discriminación media
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">Accuracy Promedio</span>
                <span className="font-mono-numbers text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {(avgAcc * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Tasa de acierto global
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">Brier Score Promedio</span>
                <span className="font-mono-numbers text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {avgBrier.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Error cuadrático medio de probabilidad
                </span>
              </div>
            </div>

            {/* Fold Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2 font-semibold font-mono text-[11px]">Fold</th>
                    <th className="px-3 py-2 font-semibold text-right">Muestra Train</th>
                    <th className="px-3 py-2 font-semibold text-right">Muestra Val</th>
                    <th className="px-3 py-2 font-semibold text-right">AUC-ROC</th>
                    <th className="px-3 py-2 font-semibold text-right">Accuracy</th>
                    <th className="px-3 py-2 font-semibold text-right">Brier Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {cvResults.map((fold) => (
                    <tr key={fold.fold} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2 font-mono font-bold text-indigo-600">
                        Fold #{fold.fold}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-numbers text-slate-500">
                        {fold.trainSize}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-numbers text-slate-500">
                        {fold.valSize}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-numbers font-bold text-emerald-600 dark:text-emerald-400">
                        {fold.auc.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-numbers font-semibold text-slate-800 dark:text-slate-200">
                        {(fold.accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                        {fold.brierScore.toFixed(4)}
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
