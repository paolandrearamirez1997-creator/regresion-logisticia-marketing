import React, { useState } from 'react';
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { ProjectState, StepwiseIteration } from '../../types/logit';
import { runStepwiseSelection } from '../../utils/logisticRegression';

interface StepwiseModuleProps {
  projectState: ProjectState;
  onApplyStepwiseFeatures: (features: string[]) => void;
}

export const StepwiseModule: React.FC<StepwiseModuleProps> = ({
  projectState,
  onApplyStepwiseFeatures,
}) => {
  const [direction, setDirection] = useState<'both' | 'forward' | 'backward'>('both');
  const [criterion, setCriterion] = useState<'aic' | 'bic'>('aic');
  const [isRunning, setIsRunning] = useState(false);
  const [stepwiseResult, setStepwiseResult] = useState<{
    finalFeatures: string[];
    iterations: StepwiseIteration[];
  } | null>(
    projectState.stepwiseHistory.length > 0
      ? {
          finalFeatures: projectState.selectedFeatures,
          iterations: projectState.stepwiseHistory,
        }
      : null
  );

  const handleRunStepwise = () => {
    const rawRows = projectState.rawRows;
    const targetCol = projectState.targetVariable;
    if (rawRows.length === 0 || !targetCol) return;

    setIsRunning(true);
    setTimeout(() => {
      const allCandidateFeatures = projectState.columns
        .filter((c) => !c.isExcluded && c.name !== targetCol)
        .map((c) => c.name);

      const X_data = rawRows.map((r) => allCandidateFeatures.map((f) => Number(r[f]) || 0));
      const y_data = rawRows.map((r) => (Number(r[targetCol]) === 1 ? 1 : 0));

      const res = runStepwiseSelection(X_data, y_data, allCandidateFeatures, direction, criterion);
      setStepwiseResult(res);
      setIsRunning(false);
    }, 250);
  };

  const handleApply = () => {
    if (stepwiseResult) {
      onApplyStepwiseFeatures(stepwiseResult.finalFeatures);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Selección Automática de Variables (Stepwise)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Reproducción del procedimiento econométrico de R: <code className="font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1 py-0.5 rounded">step(modelo.logit, direction="both")</code> mediante minimización de AIC o BIC.
        </p>
      </div>

      {/* Control Panel Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección de Selección:
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="both">Bidireccional (Both Directions) [Recomendado R]</option>
              <option value="forward">Hacia Adelante (Forward Selection)</option>
              <option value="backward">Hacia Atrás (Backward Elimination)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Criterio de Información:
            </label>
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="aic">Akaike Information Criterion (AIC)</option>
              <option value="bic">Bayesian Information Criterion (BIC / Schwarz)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunStepwise}
              disabled={isRunning || projectState.rawRows.length === 0}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Ejecutando Stepwise...' : 'Iniciar Búsqueda Stepwise'}</span>
            </button>
          </div>
        </div>

        {/* Methodological Caveat Warning */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <span className="font-bold">Advertencia Metodológica (Hosmer & Lemeshow):</span>
            <p>
              La selección automática Stepwise es una herramienta exploratoria útil para reducir dimensionalidad, pero puede generar inferencia optimista (p-valores artificialmente bajos) si no se valida en un conjunto de prueba independiente. Siempre contraste la especificación con la teoría del negocio.
            </p>
          </div>
        </div>
      </div>

      {/* Stepwise Execution Results */}
      {stepwiseResult && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Modelo Final Seleccionado
              </span>
              <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Logit(p) ~ β₀ + {stepwiseResult.finalFeatures.join(' + ')}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Total variables retenidas: {stepwiseResult.finalFeatures.length} de {projectState.columns.filter((c) => !c.isExcluded && c.name !== projectState.targetVariable).length}
              </span>
            </div>

            <button
              onClick={handleApply}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shrink-0 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar Esta Especificación</span>
            </button>
          </div>

          {/* Iteration Audit Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Registro de Iteraciones y Trayectoria de Optimización
              </h2>
              <p className="text-xs text-slate-500">
                Historial paso a paso de variables incorporadas o eliminadas y evolución del criterio estadístico.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold font-mono text-[11px]">Paso</th>
                    <th className="px-3 py-2.5 font-semibold text-center">Acción</th>
                    <th className="px-4 py-2.5 font-semibold">Variable / Operación</th>
                    <th className="px-3 py-2.5 font-semibold text-right">AIC</th>
                    <th className="px-3 py-2.5 font-semibold text-right">BIC</th>
                    <th className="px-4 py-2.5 font-semibold">Justificación Estadística</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {stepwiseResult.iterations.map((it) => (
                    <tr key={it.step} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-slate-400 font-bold">
                        {it.step}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            it.action === 'ADD'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : it.action === 'REMOVE'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {it.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {it.variableName}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                        {it.aic.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers text-slate-500">
                        {it.bic.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                        {it.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
