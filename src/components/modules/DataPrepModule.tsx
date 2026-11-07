import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ProjectState, ColumnMetadata } from '../../types/logit';

interface DataPrepModuleProps {
  projectState: ProjectState;
  onApplyPipeline: (settings: {
    missingMethodNumeric: 'mean' | 'median' | 'zero';
    missingMethodCategoric: 'mode' | 'unknown';
    outlierMethod: 'none' | 'iqr' | 'zscore' | 'winsorize';
    scalingMethod: 'none' | 'standard' | 'minmax';
  }) => void;
}

export const DataPrepModule: React.FC<DataPrepModuleProps> = ({
  projectState,
  onApplyPipeline,
}) => {
  const [missingNum, setMissingNum] = useState<'mean' | 'median' | 'zero'>('median');
  const [missingCat, setMissingCat] = useState<'mode' | 'unknown'>('unknown');
  const [outlier, setOutlier] = useState<'none' | 'iqr' | 'zscore' | 'winsorize'>('iqr');
  const [scaling, setScaling] = useState<'none' | 'standard' | 'minmax'>('standard');
  const [isApplying, setIsApplying] = useState(false);
  const [lastAppliedMsg, setLastAppliedMsg] = useState<string | null>(null);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyPipeline({
        missingMethodNumeric: missingNum,
        missingMethodCategoric: missingCat,
        outlierMethod: outlier,
        scalingMethod: scaling,
      });
      setIsApplying(false);
      setLastAppliedMsg('Pipeline de preparación ejecutado exitosamente. Se previno fuga de datos (Data Leakage) ajustando parámetros en el conjunto de entrenamiento.');
    }, 200);
  };

  const totalCols = projectState.columns.filter((c) => !c.isExcluded && c.name !== projectState.targetVariable).length;
  const transformedRowsCount = projectState.transformedRows.length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Limpieza y Preparación de Información
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure la imputación de valores faltantes, el tratamiento de atípicos, la codificación de variables cualitativas y el escalado numérico sin incurrir en Data Leakage.
        </p>
      </div>

      {/* Prevention of Data Leakage Banner */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
          <span className="font-bold text-indigo-900 dark:text-indigo-300">
            Garantía Metodológica Anti-Data Leakage:
          </span>
          <p>
            Todas las medias, medianas, modas, cotas de winsorización, medias y desviaciones estándar de estandarización se aprenden estrictamente en el subconjunto de entrenamiento (Train) y se proyectan sobre el conjunto de prueba (Test). Esto asegura una evaluación predictiva realista e imparcial.
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Missing values */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
              Tratamiento de Valores Faltantes
            </h2>
            <span className="text-xs text-slate-400">Imputación</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Variables Cuantitativas (Numéricas):
              </label>
              <select
                value={missingNum}
                onChange={(e) => setMissingNum(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="median">Mediana (Robusta ante asimetría y outliers)</option>
                <option value="mean">Media Aritmética (Para distribuciones normales)</option>
                <option value="zero">Constante Cero (0)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Variables Cualitativas (Categóricas):
              </label>
              <select
                value={missingCat}
                onChange={(e) => setMissingCat(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="unknown">Categoría Explícita "Desconocido"</option>
                <option value="mode">Moda (Categoría más frecuente)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Outliers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
              Tratamiento de Valores Extremos (Outliers)
            </h2>
            <span className="text-xs text-slate-400">Capping & Winsor</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Método de Acotación:
              </label>
              <select
                value={outlier}
                onChange={(e) => setOutlier(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="iqr">Regla del Rango Intercuartílico (Q1 - 1.5 IQR, Q3 + 1.5 IQR)</option>
                <option value="winsorize">Winsorización Percentiles 1% y 99%</option>
                <option value="zscore">Regla Z-Score (|z| &gt; 3.0 desviaciones estándar)</option>
                <option value="none">Conservar Valores Originales (Sin acotar)</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              Acotar valores atípicos evita que observaciones extremas distorsionen el logit y generen problemas de cuasiseparación.
            </p>
          </div>
        </div>

        {/* Card 3: Categorical Encoding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
              Transformación de Variables Categóricas
            </h2>
            <span className="text-xs text-slate-400">Dummy Variables</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Codificación One-Hot con Categoría de Referencia:
              </span>
              Se genera una variable dummy binaria para cada nivel excepto la categoría más frecuente, que se fija automáticamente como categoría base para evitar la trampa de la multicolinealidad perfecta (Dummy Variable Trap).
            </div>
          </div>
        </div>

        {/* Card 4: Standardization & Scaling */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h2 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100">
              Estandarización y Normalización
            </h2>
            <span className="text-xs text-slate-400">Escalamiento</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Escalamiento de Predictores Continuos:
              </label>
              <select
                value={scaling}
                onChange={(e) => setScaling(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                <option value="standard">Estandarización Z-Score (Media = 0, Varianza = 1) [Recomendado]</option>
                <option value="minmax">Normalización Min-Max [0, 1]</option>
                <option value="none">Escala Original (Sin transformar)</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              La estandarización permite comparar directamente la magnitud relativa de los coeficientes beta y es indispensable al aplicar regularización L1 (Lasso) o L2 (Ridge).
            </p>
          </div>
        </div>
      </div>

      {/* Action Trigger */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div>
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 block">
            Ejecutar Pipeline de Preparación
          </span>
          <span className="text-xs text-slate-500">
            Aplica las transformaciones sobre las {totalCols} variables predictoras activas.
          </span>
        </div>

        <button
          onClick={handleApply}
          disabled={isApplying}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isApplying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isApplying ? 'Procesando...' : 'Aplicar Transformaciones'}</span>
        </button>
      </div>

      {lastAppliedMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{lastAppliedMsg}</span>
        </div>
      )}
    </div>
  );
};
