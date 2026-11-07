import React from 'react';
import {
  Layers,
  Award,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  Plus,
} from 'lucide-react';
import { ProjectState, ModelComparisonSpec } from '../../types/logit';

interface ModelComparisonModuleProps {
  projectState: ProjectState;
  onSaveCurrentAsModel: (name: string) => void;
}

export const ModelComparisonModule: React.FC<ModelComparisonModuleProps> = ({
  projectState,
  onSaveCurrentAsModel,
}) => {
  const [modelNameInput, setModelNameInput] = React.useState('');
  const savedModels = projectState.savedModels || [];
  const currentFit = projectState.fitMetrics;

  const handleSaveCurrent = () => {
    if (!modelNameInput.trim() || !currentFit) return;
    onSaveCurrentAsModel(modelNameInput.trim());
    setModelNameInput('');
  };

  // Build candidate models list including active one
  const allModels: ModelComparisonSpec[] = React.useMemo(() => {
    const list = [...savedModels];
    if (currentFit) {
      list.unshift({
        id: 'current_active',
        name: 'Modelo Activo Actual',
        method: projectState.regularization === 'none' ? 'MLE (Sin Regularización)' : `Ridge (λ=${projectState.regLambda})`,
        features: projectState.selectedFeatures,
        metrics: currentFit,
        isBaseline: true,
      });
    }
    return list;
  }, [savedModels, currentFit, projectState.selectedFeatures, projectState.regularization, projectState.regLambda]);

  // Find bests
  const bestAuc = Math.max(...allModels.map((m) => m.metrics.auc));
  const bestAic = Math.min(...allModels.map((m) => m.metrics.aic));
  const bestBrier = Math.min(...allModels.map((m) => m.metrics.brierScore));
  const bestF1 = Math.max(...allModels.map((m) => m.metrics.f1));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Comparación de Modelos y Especificaciones Alternativas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Evaluación cruzada de modelos (Completo, Stepwise, L1/L2 Regularizado) contrastando parsimonia, capacidad predictiva (AUC) y criterios de información (AIC / BIC).
        </p>
      </div>

      {/* Save current model card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Guardar Especificación Actual para Benchmarking
          </span>
          <span className="text-xs text-slate-500">
            Guarda el modelo con las {projectState.selectedFeatures.length} variables y el método actual en la tabla comparativa.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ej. Modelo Stepwise 4 Vars"
            value={modelNameInput}
            onChange={(e) => setModelNameInput(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          />
          <button
            onClick={handleSaveCurrent}
            disabled={!modelNameInput.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Guardar Modelo</span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Matriz Comparativa de Modelos
            </h2>
            <p className="text-xs text-slate-500">
              Valores destacados en verde representan el mejor desempeño en esa dimensión metodológica.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Modelo / Especificación</th>
                <th className="px-3 py-2.5 font-semibold text-center">Método</th>
                <th className="px-3 py-2.5 font-semibold text-right"># Vars</th>
                <th className="px-3 py-2.5 font-semibold text-right">Log-Likelihood</th>
                <th className="px-3 py-2.5 font-semibold text-right">AIC</th>
                <th className="px-3 py-2.5 font-semibold text-right">BIC</th>
                <th className="px-3 py-2.5 font-semibold text-right">McFadden R²</th>
                <th className="px-3 py-2.5 font-semibold text-right">AUC-ROC</th>
                <th className="px-3 py-2.5 font-semibold text-right">F1-Score</th>
                <th className="px-3 py-2.5 font-semibold text-right">Brier Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {allModels.map((m) => {
                const met = m.metrics;
                const isBestAuc = Math.abs(met.auc - bestAuc) < 0.001;
                const isBestAic = Math.abs(met.aic - bestAic) < 0.01;
                const isBestBrier = Math.abs(met.brierScore - bestBrier) < 0.0001;
                const isBestF1 = Math.abs(met.f1 - bestF1) < 0.001;

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                      m.isBaseline ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{m.name}</span>
                        {m.isBaseline && (
                          <span className="text-[10px] bg-indigo-600 text-white font-mono px-1 rounded">
                            ACTIVO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-[11px]">
                      {m.method}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-numbers">
                      {m.features.length}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-numbers">
                      {met.logLikelihood.toFixed(1)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono-numbers font-bold ${isBestAic ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {met.aic.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-numbers text-slate-500">
                      {met.bic.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-numbers font-semibold text-indigo-600">
                      {(met.mcfaddenR2 * 100).toFixed(1)}%
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono-numbers font-bold ${isBestAuc ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {met.auc.toFixed(3)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono-numbers ${isBestF1 ? 'text-emerald-600 font-bold' : ''}`}>
                      {met.f1.toFixed(3)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono-numbers ${isBestBrier ? 'text-emerald-600 font-bold' : ''}`}>
                      {met.brierScore.toFixed(4)}
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
