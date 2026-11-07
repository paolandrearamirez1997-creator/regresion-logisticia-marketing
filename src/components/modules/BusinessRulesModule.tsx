import React from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ProjectState } from '../../types/logit';
import { SECTOR_DEFINITIONS } from '../../utils/sampleData';

interface BusinessRulesModuleProps {
  projectState: ProjectState;
}

export const BusinessRulesModule: React.FC<BusinessRulesModuleProps> = ({ projectState }) => {
  const coefficients = projectState.coefficients || [];
  const sectorDef = SECTOR_DEFINITIONS[projectState.sector] || SECTOR_DEFINITIONS.financiero;

  // Filter significant predictors
  const sigCoeffs = coefficients.filter(
    (c) => c.variable !== '(Intercepto)' && c.pValue < 0.05
  );

  const riskIncreasing = [...sigCoeffs]
    .filter((c) => c.coef > 0)
    .sort((a, b) => b.oddsRatio - a.oddsRatio);

  const riskDecreasing = [...sigCoeffs]
    .filter((c) => c.coef < 0)
    .sort((a, b) => a.oddsRatio - b.oddsRatio);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Interpretabilidad y Reglas de Negocio
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Traducción de los parámetros estimados a lenguaje empresarial para el sector {sectorDef.name}. Identificación de inductores clave y factores protectores.
        </p>
      </div>

      {/* Top Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Increasing */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 border-b border-rose-100 dark:border-rose-900/30 pb-3">
            <TrendingUp className="w-5 h-5 shrink-0" />
            <h2 className="font-display font-semibold text-sm">
              Principales Factores que Incrementan el Riesgo / Evento (OR &gt; 1)
            </h2>
          </div>

          <div className="space-y-3">
            {riskIncreasing.length === 0 ? (
              <p className="text-xs text-slate-400">No se encontraron predictores significativos con efecto positivo.</p>
            ) : (
              riskIncreasing.map((v) => {
                const pct = ((v.oddsRatio - 1) * 100).toFixed(1);
                return (
                  <div
                    key={v.variable}
                    className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{v.variable}</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                        OR = {v.oddsRatio.toFixed(2)} (+{pct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Un incremento unitario en <strong>{v.variable}</strong> multiplica las odds de {projectState.positiveClassLabel.toLowerCase()} por {v.oddsRatio.toFixed(2)}, aumentando la ventaja en un {pct}%.
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Protective Factors */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-900/30 pb-3">
            <TrendingDown className="w-5 h-5 shrink-0" />
            <h2 className="font-display font-semibold text-sm">
              Principales Factores Protectores / Reductores de Riesgo (OR &lt; 1)
            </h2>
          </div>

          <div className="space-y-3">
            {riskDecreasing.length === 0 ? (
              <p className="text-xs text-slate-400">No se encontraron predictores significativos con efecto negativo.</p>
            ) : (
              riskDecreasing.map((v) => {
                const pct = Math.abs((v.oddsRatio - 1) * 100).toFixed(1);
                return (
                  <div
                    key={v.variable}
                    className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{v.variable}</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        OR = {v.oddsRatio.toFixed(2)} (-{pct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Un incremento unitario en <strong>{v.variable}</strong> reduce las odds de ocurrencia en aproximadamente un {pct}% (OR = {v.oddsRatio.toFixed(2)}).
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sector Executive Action Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Políticas y Reglas Operativas Derivadas ({sectorDef.name})
            </h2>
            <p className="text-xs text-slate-500">
              Guías de acción para comités de crédito, retención, auditoría o gestión clínica.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              1. Segmentación por Nivel de Riesgo Predictivo
            </span>
            <p>
              Dividir la cartera en 4 cuadrantes operativos según la probabilidad estimada (Bajo: p &lt; 0.20, Medio: 0.20 &le; p &lt; 0.40, Alto: 0.40 &le; p &lt; 0.70, Muy Alto: p &ge; 0.70). Focalizar las estrategias de intervención temprana en el decil 1 y 2 que concentran el mayor Lift.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              2. Política de Mitigación Focalizada en Inductores Clave
            </span>
            <p>
              Para casos en riesgo elevado, auditar prioritariamente los valores de{' '}
              <strong>{riskIncreasing.slice(0, 2).map((r) => r.variable).join(' y ') || 'las variables clave'}</strong>. En negociaciones o tratamientos, buscar contrapartidas que activen los factores protectores (como <strong>{riskDecreasing[0]?.variable || 'variables de fidelización'}</strong>).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              3. Prudencia Metodológica: Correlación vs Causalidad
            </span>
            <p className="text-slate-500">
              Los coeficientes β reflejan asociaciones condicionales estimadas en los datos observacionales. Alterar forzosamente una variable predictora no garantiza mecánicamente la eliminación del riesgo si existen variables omitidas o factores estructurales no capturados en el dataset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
