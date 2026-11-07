import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  Sparkles,
  BarChart,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ProjectState, CoefficientRow } from '../../types/logit';

interface ModelEstimationModuleProps {
  projectState: ProjectState;
  onTrainModel: (selectedVars: string[], regularization: 'none' | 'l1' | 'l2', lambda: number) => void;
  onNavigateTo: (moduleId: string) => void;
}

export const ModelEstimationModule: React.FC<ModelEstimationModuleProps> = ({
  projectState,
  onTrainModel,
  onNavigateTo,
}) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    projectState.selectedFeatures.length > 0
      ? projectState.selectedFeatures
      : projectState.columns
          .filter((c) => !c.isExcluded && c.name !== projectState.targetVariable)
          .map((c) => c.name)
  );

  const [regularization, setRegularization] = useState<'none' | 'l1' | 'l2'>(projectState.regularization || 'none');
  const [regLambda, setRegLambda] = useState<number>(projectState.regLambda || 0.01);
  const [isTraining, setIsTraining] = useState(false);

  const handleToggleFeature = (name: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    const all = projectState.columns
      .filter((c) => !c.isExcluded && c.name !== projectState.targetVariable)
      .map((c) => c.name);
    setSelectedFeatures(all);
  };

  const handleDeselectAll = () => {
    setSelectedFeatures([]);
  };

  const handleFitModel = () => {
    if (selectedFeatures.length === 0) return;
    setIsTraining(true);
    setTimeout(() => {
      onTrainModel(selectedFeatures, regularization, regLambda);
      setIsTraining(false);
    }, 200);
  };

  const fit = projectState.fitMetrics;
  const coefficients = projectState.coefficients;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Construcción y Estimación del Modelo Logístico
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Estimación por máxima verosimilitud (MLE / IRLS), tabla econométrica de coeficientes, errores estándar asintóticos, pruebas de Wald y Odds Ratios con intervalos de confianza del 95%.
        </p>
      </div>

      {/* Feature Selection & Model Config Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Especificación de la Ecuación
            </span>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
              Seleccionar Variables Predictoras (X)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleSelectAll}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Seleccionar Todas
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Deseleccionar
            </button>
          </div>
        </div>

        {/* Feature Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {projectState.columns
            .filter((c) => !c.isExcluded && c.name !== projectState.targetVariable)
            .map((col) => {
              const isChecked = selectedFeatures.includes(col.name);
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => handleToggleFeature(col.name)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                    isChecked
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate pr-2">{col.name}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Regularization options */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Método de Regularización:
            </label>
            <select
              value={regularization}
              onChange={(e) => setRegularization(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="none">Sin Regularización (Máxima Verosimilitud Pura)</option>
              <option value="l2">L2 Ridge Penalty (Reduce varianza / multicolinealidad)</option>
              <option value="l1">L1 Lasso Penalty (Selección dispersa)</option>
            </select>
          </div>

          {regularization !== 'none' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hiperparámetro Lambda (λ):
              </label>
              <input
                type="number"
                step="0.005"
                min="0.001"
                max="1.0"
                value={regLambda}
                onChange={(e) => setRegLambda(parseFloat(e.target.value) || 0.01)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={handleFitModel}
              disabled={selectedFeatures.length === 0 || isTraining}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{isTraining ? 'Optimizando por IRLS...' : 'Estimar Modelo Logístico'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Fit & Invariance KPI Strip */}
      {fit && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-500 block mb-0.5">Observaciones (N)</span>
            <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
              {fit.nObs.toLocaleString()}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-500 block mb-0.5">Log-Likelihood (ln L)</span>
            <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
              {fit.logLikelihood.toFixed(2)}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-500 block mb-0.5">LR Test Chi² (p-val)</span>
            <span className="font-mono-numbers text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
              χ² = {fit.lrStat.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              p {fit.lrPValue < 0.001 ? '< 0.001' : `= ${fit.lrPValue.toFixed(4)}`}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-500 block mb-0.5">Pseudo R² McFadden</span>
            <span className="font-mono-numbers text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {(fit.mcfaddenR2 * 100).toFixed(1)}%
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-500 block mb-0.5">Criterio AIC / BIC</span>
            <span className="font-mono-numbers text-sm font-semibold text-slate-900 dark:text-slate-100 block">
              {fit.aic.toFixed(1)} / {fit.bic.toFixed(1)}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-500 block mb-0.5">AUC-ROC (Muestra)</span>
            <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
              {fit.auc.toFixed(3)}
            </span>
          </div>
        </div>
      )}

      {/* Econometric Coefficients Table */}
      {coefficients.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Tabla Econométrica de Coeficientes y Odds Ratios
              </h2>
              <p className="text-xs text-slate-500">
                Logit(p) = β₀ + Σ βᵢXᵢ. Significancia bilateral: *** p&lt;0.001, ** p&lt;0.01, * p&lt;0.05, · p&lt;0.10.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              VIF &lt; 5.0 recomendado
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Variable</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Coeficiente (β)</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Error Est. (SE)</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Wald z</th>
                  <th className="px-3 py-2.5 font-semibold text-right">p-valor</th>
                  <th className="px-3 py-2.5 font-semibold text-center">95% CI (β)</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Odds Ratio (e^β)</th>
                  <th className="px-3 py-2.5 font-semibold text-center">95% CI (OR)</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Sig.</th>
                  <th className="px-3 py-2.5 font-semibold text-right">VIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {coefficients.map((row) => {
                  const isSig = row.pValue < 0.05;
                  const isIntercept = row.variable === '(Intercepto)';
                  return (
                    <tr
                      key={row.variable}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        isSig && !isIntercept ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {row.variable}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                        {row.coef >= 0 ? `+${row.coef.toFixed(4)}` : row.coef.toFixed(4)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers text-slate-500">
                        {row.stdErr.toFixed(4)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                        {row.zStat.toFixed(3)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers font-semibold">
                        <span className={isSig ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                          {row.pValue < 0.001 ? '< 0.001' : row.pValue.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono-numbers text-[11px] text-slate-500">
                        [{row.ciLowerBeta.toFixed(2)}, {row.ciUpperBeta.toFixed(2)}]
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers font-bold text-indigo-700 dark:text-indigo-300">
                        {row.oddsRatio.toFixed(3)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono-numbers text-[11px] text-slate-500">
                        [{row.ciLowerOR.toFixed(2)}, {row.ciUpperOR.toFixed(2)}]
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-indigo-600">
                        {row.significanceStars}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono-numbers text-slate-400">
                        {row.vif !== undefined ? row.vif.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Odds Ratios Forest Plot Visualization */}
      {coefficients.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                Gráfico Forest Plot de Odds Ratios (OR) con Intervalos al 95%
              </h2>
              <p className="text-xs text-slate-500">
                Línea de referencia vertical en OR = 1.0 (sin efecto). OR &gt; 1 incrementa las odds; OR &lt; 1 reduce las odds.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {coefficients
              .filter((c) => c.variable !== '(Intercepto)')
              .map((c) => {
                const maxRange = 4.0;
                const orVal = Math.min(maxRange, Math.max(0.1, c.oddsRatio));
                const lowerVal = Math.min(maxRange, Math.max(0.1, c.ciLowerOR));
                const upperVal = Math.min(maxRange, Math.max(0.1, c.ciUpperOR));

                const leftPct = (lowerVal / maxRange) * 100;
                const rightPct = (upperVal / maxRange) * 100;
                const pointPct = (orVal / maxRange) * 100;
                const refPct = (1.0 / maxRange) * 100;

                const isSig = c.pValue < 0.05;

                return (
                  <div key={c.variable} className="flex items-center gap-4 text-xs">
                    <span className="w-44 truncate font-medium text-slate-800 dark:text-slate-200">
                      {c.variable}
                    </span>

                    <div className="flex-1 h-7 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 relative flex items-center">
                      {/* Vertical line at OR = 1.0 */}
                      <div
                        style={{ left: `${refPct}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
                        title="OR = 1.0 (Referencia)"
                      />

                      {/* Error bar CI */}
                      <div
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(2, rightPct - leftPct)}%`,
                        }}
                        className={`absolute h-1.5 rounded-full ${
                          isSig ? 'bg-indigo-400 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />

                      {/* Point estimate */}
                      <div
                        style={{ left: `calc(${pointPct}% - 5px)` }}
                        className={`absolute w-2.5 h-2.5 rounded-full z-20 ${
                          isSig ? 'bg-indigo-600 dark:bg-indigo-400 ring-2 ring-white dark:ring-slate-900' : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div className="w-24 text-right font-mono-numbers font-semibold">
                      <span className={isSig ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                        {c.oddsRatio.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        [{c.ciLowerOR.toFixed(2)}, {c.ciUpperOR.toFixed(2)}]
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Module 8 Interpretation Narratives */}
      {coefficients.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Interpretación Econométrica de Coeficientes y Odds Ratios (Módulo 8)
            </h2>
            <p className="text-xs text-slate-500">
              Traducción rigurosa de cada parámetro β a variación porcentual en la razón de momios (Odds Ratio = e^β).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coefficients
              .filter((c) => c.variable !== '(Intercepto)')
              .map((c) => {
                const pctChange = ((c.oddsRatio - 1) * 100).toFixed(1);
                const isSig = c.pValue < 0.05;
                const isPos = c.coef > 0;

                return (
                  <div
                    key={c.variable}
                    className={`p-4 rounded-xl border space-y-2 ${
                      isSig
                        ? 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {c.variable}
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        OR = {c.oddsRatio.toFixed(3)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {isPos ? (
                        <>
                          Manteniendo las demás variables constantes, un incremento de una unidad en <strong>{c.variable}</strong> multiplica las odds del evento por <strong>{c.oddsRatio.toFixed(3)}</strong>, lo cual representa un <strong>aumento del {Math.abs(Number(pctChange))}%</strong> en las odds de ocurrencia.
                        </>
                      ) : (
                        <>
                          Manteniendo las demás variables constantes, un incremento de una unidad en <strong>{c.variable}</strong> multiplica las odds del evento por <strong>{c.oddsRatio.toFixed(3)}</strong>, lo cual representa una <strong>disminución del {Math.abs(Number(pctChange))}%</strong> en las odds de ocurrencia.
                        </>
                      )}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>β = {c.coef.toFixed(4)}</span>
                      <span>·</span>
                      <span>p = {c.pValue < 0.001 ? '<0.001' : c.pValue.toFixed(4)}</span>
                      <span>·</span>
                      <span className={isSig ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                        {isSig ? 'Significativo al 5%' : 'No concluyente'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
