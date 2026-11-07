import React, { useState } from 'react';
import {
  BarChart2,
  Table,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ArrowUpDown,
  Layers,
  PieChart,
} from 'lucide-react';
import { ProjectState, ColumnMetadata, VariableType } from '../../types/logit';
import {
  getNumericStats,
  getCategoricalStats,
  performBivariateAnalysis,
} from '../../utils/edaPrep';

interface EdaModuleProps {
  projectState: ProjectState;
  onUpdateColumnType: (colName: string, newType: VariableType) => void;
  onToggleColumnExclude: (colName: string) => void;
}

export const EdaModule: React.FC<EdaModuleProps> = ({
  projectState,
  onUpdateColumnType,
  onToggleColumnExclude,
}) => {
  const [selectedCol, setSelectedCol] = useState<string>(
    projectState.columns.find((c) => c.name !== projectState.targetVariable)?.name || ''
  );
  const [activeTab, setActiveTab] = useState<'taxonomy' | 'descriptive' | 'target' | 'bivariate'>('target');

  const targetCol = projectState.targetVariable;
  const targetMeta = projectState.columns.find((c) => c.name === targetCol);

  // Target variable metrics
  const targetStats = React.useMemo(() => {
    if (!targetCol || projectState.rawRows.length === 0) return null;
    let posCount = 0;
    let negCount = 0;
    let missing = 0;

    projectState.rawRows.forEach((r) => {
      const val = Number(r[targetCol]);
      if (val === 1) posCount++;
      else if (val === 0) negCount++;
      else missing++;
    });

    const total = posCount + negCount;
    const baseRate = total > 0 ? (posCount / total) * 100 : 0;
    const isImbalanced = baseRate < 15 || baseRate > 85;

    return {
      posCount,
      negCount,
      missing,
      total,
      baseRate,
      isImbalanced,
    };
  }, [projectState.rawRows, targetCol]);

  // Active selected column data
  const activeColMeta = projectState.columns.find((c) => c.name === selectedCol);
  const isNumeric =
    activeColMeta?.type === 'numeric_continuous' || activeColMeta?.type === 'numeric_discrete';

  const numericStats = isNumeric && selectedCol
    ? getNumericStats(projectState.rawRows, selectedCol)
    : null;

  const categoricalStats = !isNumeric && selectedCol
    ? getCategoricalStats(projectState.rawRows, selectedCol)
    : null;

  const bivariateAnalysis =
    selectedCol && targetCol && activeColMeta
      ? performBivariateAnalysis(
          projectState.rawRows,
          selectedCol,
          activeColMeta.type,
          targetCol,
          projectState.positiveClassLabel,
          projectState.negativeClassLabel
        )
      : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Análisis Exploratorio y Descriptivo (EDA)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inspeccione la taxonomía de variables, momentos estadísticos (media, asimetría, curtosis), balance de clases de la variable objetivo y relaciones bivariadas con el evento modelado.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('target')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'target'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Variable Objetivo (Y)
        </button>
        <button
          onClick={() => setActiveTab('descriptive')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'descriptive'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Estadística Descriptiva
        </button>
        <button
          onClick={() => setActiveTab('bivariate')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'bivariate'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Análisis Bivariado
        </button>
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'taxonomy'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Taxonomía & Clasificación
        </button>
      </div>

      {/* TAB 1: TARGET VARIABLE ANALYSIS */}
      {activeTab === 'target' && targetStats && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Distribución Dicotómica
                </span>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
                  Variable Dependiente: {targetCol}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                N = {targetStats.total.toLocaleString()} obs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive Event Card */}
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Evento Positivo (Y = 1)
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                    {targetStats.baseRate.toFixed(2)}%
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {projectState.positiveClassLabel}
                </div>
                <div className="font-mono-numbers text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {targetStats.posCount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tasa base del evento modelado en la muestra de entrenamiento.
                </p>
              </div>

              {/* Negative Event Card */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Evento Negativo / Base (Y = 0)
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {(100 - targetStats.baseRate).toFixed(2)}%
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {projectState.negativeClassLabel}
                </div>
                <div className="font-mono-numbers text-3xl font-bold text-slate-800 dark:text-slate-200">
                  {targetStats.negCount.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Categoría de referencia frente a la cual se estiman las probabilidades.
                </p>
              </div>
            </div>

            {/* Visual Proportion Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Y = 0 ({(100 - targetStats.baseRate).toFixed(1)}%)</span>
                <span>Y = 1 ({targetStats.baseRate.toFixed(1)}%)</span>
              </div>
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${100 - targetStats.baseRate}%` }}
                  className="bg-slate-400 dark:bg-slate-500 h-full transition-all"
                />
                <div
                  style={{ width: `${targetStats.baseRate}%` }}
                  className="bg-emerald-500 h-full transition-all"
                />
              </div>
            </div>

            {/* Imbalance Alert */}
            {targetStats.isImbalanced ? (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="font-bold">Alerta Metodológica: Desbalance de Clases Detectado ({targetStats.baseRate.toFixed(1)}%)</span>
                  <p>
                    Cuando la tasa de ocurrencia es inferior al 15% o superior al 85%, el umbral estándar de clasificación de 0.50 suele subestimar la sensibilidad. Se recomienda priorizar la Curva Precision-Recall (Módulo 13), el índice de Youden J (Módulo 12) y calibrar el punto de corte óptimo mediante la matriz de costos económicos (Módulo 14).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Distribución Equilibrada:</span> La tasa base del evento ({targetStats.baseRate.toFixed(1)}%) permite una estimación estable por máxima verosimilitud sin requerir técnicas severas de sobremuestreo o penalización asimétrica.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DESCRIPTIVE STATISTICS */}
      {activeTab === 'descriptive' && (
        <div className="space-y-6">
          {/* Feature selector */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shrink-0">
              Seleccionar Variable:
            </span>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {projectState.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Numeric Descriptive Table */}
          {isNumeric && numericStats && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Estadística Descriptiva Cuantitativa: {selectedCol}
                </h2>
                <p className="text-xs text-slate-500">
                  Momentos centrales, medidas de dispersión, asimetría y curtosis de la variable.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Media (Promedio)</span>
                  <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                    {numericStats.mean.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Mediana (P50)</span>
                  <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                    {numericStats.median.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Desv. Estándar (σ)</span>
                  <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                    {numericStats.stdDev.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Coef. Variación (%)</span>
                  <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                    {numericStats.cv.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Mínimo / Máximo</span>
                  <span className="font-mono-numbers text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {numericStats.min.toFixed(2)} — {numericStats.max.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Q1 (P25) / Q3 (P75)</span>
                  <span className="font-mono-numbers text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {numericStats.p25.toFixed(2)} — {numericStats.p75.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Rango Intercuartílico (IQR)</span>
                  <span className="font-mono-numbers text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {numericStats.iqr.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Asimetría / Curtosis</span>
                  <span className="font-mono-numbers text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {numericStats.skewness.toFixed(2)} / {numericStats.kurtosis.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Categorical Descriptive Table */}
          {!isNumeric && categoricalStats && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Distribución Categórica: {selectedCol}
                </h2>
                <p className="text-xs text-slate-500">
                  Frecuencia de categorías, cardinalidad y nivel modal predominante.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Cardinalidad (Niveles)</span>
                  <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                    {categoricalStats.cardinality}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Categoría Modal</span>
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {categoricalStats.modeCategory}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Frecuencia Modal (%)</span>
                  <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                    {categoricalStats.modePct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Frequency Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Categoría</th>
                      <th className="px-4 py-2 font-semibold text-right">Frecuencia</th>
                      <th className="px-4 py-2 font-semibold text-right">Porcentaje (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {categoricalStats.frequencyTable.map((item) => (
                      <tr key={item.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                          {item.category}
                        </td>
                        <td className="px-4 py-2 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right font-mono-numbers font-semibold text-slate-800 dark:text-slate-200">
                          {item.pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BIVARIATE ANALYSIS */}
      {activeTab === 'bivariate' && bivariateAnalysis && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shrink-0">
              Variable Predictora (X):
            </span>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {projectState.columns
                .filter((c) => c.name !== projectState.targetVariable)
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
                  Relación Bivariada: {selectedCol} vs {targetCol}
                </h2>
                <p className="text-xs text-slate-500">
                  Contraste de hipótesis y fuerza de asociación estadística.
                </p>
              </div>
            </div>

            {/* Narrative card */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                Interpretación Estadística Automatizada:
              </span>
              {bivariateAnalysis.summaryNarrative}
            </div>

            {/* If numeric: comparison of group means */}
            {bivariateAnalysis.isNumeric && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">
                    Media en Y = 0 ({projectState.negativeClassLabel})
                  </span>
                  <span className="font-mono-numbers text-xl font-bold text-slate-800 dark:text-slate-200">
                    {bivariateAnalysis.group0Mean?.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                    Media en Y = 1 ({projectState.positiveClassLabel})
                  </span>
                  <span className="font-mono-numbers text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {bivariateAnalysis.group1Mean?.toFixed(2)}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">
                    Diferencia de Medias (t-Stat / p-val)
                  </span>
                  <span className="font-mono-numbers text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                    Δ = {bivariateAnalysis.diffMean?.toFixed(2)} (t = {bivariateAnalysis.tStat?.toFixed(2)})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    p-valor: {bivariateAnalysis.pValTTest !== undefined && bivariateAnalysis.pValTTest < 0.001 ? '<0.001' : bivariateAnalysis.pValTTest?.toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {/* If categorical: Contingency Table */}
            {!bivariateAnalysis.isNumeric && bivariateAnalysis.contingencyTable && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Tabla de Contingencia y Tasa de Evento por Categoría</span>
                  <span className="font-mono">V de Cramér: {bivariateAnalysis.cramersV?.toFixed(3)}</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Categoría ({selectedCol})</th>
                        <th className="px-4 py-2 font-semibold text-right">Eventos Y=0</th>
                        <th className="px-4 py-2 font-semibold text-right">Eventos Y=1</th>
                        <th className="px-4 py-2 font-semibold text-right">Tasa Positiva (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {bivariateAnalysis.contingencyTable.map((row) => (
                        <tr key={row.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                            {row.category}
                          </td>
                          <td className="px-4 py-2 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                            {row.count0.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right font-mono-numbers text-emerald-600 dark:text-emerald-400 font-semibold">
                            {row.count1.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                            {row.ratePositive.toFixed(1)}%
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
      )}

      {/* TAB 4: TAXONOMY & CLASSIFICATION */}
      {activeTab === 'taxonomy' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Taxonomía y Clasificación de Variables
            </h2>
            <p className="text-xs text-slate-500">
              Ajuste manualmente el tipo de cada variable para orientar el preprocesamiento y la codificación de variables dummy.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Variable</th>
                  <th className="px-4 py-2.5 font-semibold">Tipo Clasificado</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Valores Únicos</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Faltantes (%)</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Estado en Modelo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {projectState.columns.map((col) => {
                  const isTarget = col.name === projectState.targetVariable;
                  return (
                    <tr key={col.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          {isTarget && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 rounded font-mono">
                              TARGET
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          disabled={isTarget}
                          value={col.type}
                          onChange={(e) => onUpdateColumnType(col.name, e.target.value as VariableType)}
                          className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50"
                        >
                          <option value="numeric_continuous">Cuantitativa Continua</option>
                          <option value="numeric_discrete">Cuantitativa Discreta</option>
                          <option value="categorical_nominal">Cualitativa Nominal</option>
                          <option value="categorical_ordinal">Cualitativa Ordinal</option>
                          <option value="binary">Binaria (Dicotómica)</option>
                          <option value="identifier">Identificador (Excluir)</option>
                          <option value="date">Fecha (Excluir)</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                        {col.uniqueValuesCount}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono-numbers text-slate-600 dark:text-slate-400">
                        {col.missingPct.toFixed(1)}% ({col.missingCount})
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {isTarget ? (
                          <span className="text-xs text-indigo-600 font-semibold">Variable Y</span>
                        ) : (
                          <button
                            onClick={() => onToggleColumnExclude(col.name)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                              col.isExcluded
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {col.isExcluded ? 'Excluida' : 'Incluida'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
