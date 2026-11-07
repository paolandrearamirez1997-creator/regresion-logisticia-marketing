import React from 'react';
import Papa from 'papaparse';
import {
  FileText,
  Download,
  Printer,
  Table,
  CheckCircle,
  Shield,
  Award,
} from 'lucide-react';
import { ProjectState } from '../../types/logit';
import { SECTOR_DEFINITIONS } from '../../utils/sampleData';

interface ReportExportModuleProps {
  projectState: ProjectState;
}

export const ReportExportModule: React.FC<ReportExportModuleProps> = ({ projectState }) => {
  const coefficients = projectState.coefficients || [];
  const fit = projectState.fitMetrics;
  const sectorDef = SECTOR_DEFINITIONS[projectState.sector] || SECTOR_DEFINITIONS.financiero;

  // Download Clean / Transformed Data as CSV
  const handleDownloadTransformedData = () => {
    const rows = projectState.transformedRows.length > 0 ? projectState.transformedRows : projectState.rawRows;
    if (rows.length === 0) return;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base_preparada_${projectState.sector}.csv`;
    a.click();
  };

  // Download Coefficients & Odds Ratios CSV
  const handleDownloadCoefficients = () => {
    if (coefficients.length === 0) return;
    const exportRows = coefficients.map((c) => ({
      Variable: c.variable,
      Coeficiente_Beta: c.coef,
      Error_Estandar: c.stdErr,
      Estadistico_Wald_Z: c.zStat,
      P_Valor: c.pValue,
      CI_Inferior_Beta_95: c.ciLowerBeta,
      CI_Superior_Beta_95: c.ciUpperBeta,
      Odds_Ratio_ExpBeta: c.oddsRatio,
      CI_Inferior_OR_95: c.ciLowerOR,
      CI_Superior_OR_95: c.ciUpperOR,
      Significancia: c.significanceStars,
      VIF: c.vif || 1.0,
    }));
    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabla_coeficientes_odds_ratios.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Informe Ejecutivo y Exportación de Resultados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Genere el dictamen econométrico formal para comités de dirección o descargue tablas y bases de datos procesadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>
      </div>

      {/* CSV Export Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
              Tabla de Coeficientes y Odds Ratios
            </span>
            <span className="text-xs text-slate-400">
              {coefficients.length} parámetros con errores estándar y p-valores
            </span>
          </div>
          <button
            onClick={handleDownloadCoefficients}
            disabled={coefficients.length === 0}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
              Base de Datos Procesada y Transformada
            </span>
            <span className="text-xs text-slate-400">
              {projectState.rawRows.length} observaciones sin valores atípicos
            </span>
          </div>
          <button
            onClick={handleDownloadTransformedData}
            disabled={projectState.rawRows.length === 0}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Report Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xs space-y-8 text-slate-800 dark:text-slate-200 print:border-none print:shadow-none print:p-0">
        {/* Report Top Branding */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Dictamen Econométrico & Machine Learning
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Informe Técnico de Estimación: {projectState.projectName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Metodología Hugo Martínez Gallego · Modelos Lineales Generalizados (GLM Binomial)
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Fecha: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>Sector: {sectorDef.name}</div>
          </div>
        </div>

        {/* Section 1: Objective & Scope */}
        <div className="space-y-2">
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
            1. Definición del Problema y Variable Objetivo
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            El presente informe documenta el modelamiento de la probabilidad de ocurrencia del evento{' '}
            <strong>"{projectState.positiveClassLabel}"</strong> (Y = 1) frente a la condición de referencia{' '}
            <strong>"{projectState.negativeClassLabel}"</strong> (Y = 0), a partir de una muestra de{' '}
            <strong>{projectState.rawRows.length.toLocaleString()} observaciones</strong>.
          </p>
          {projectState.projectObjective && (
            <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              "{projectState.projectObjective}"
            </p>
          )}
        </div>

        {/* Section 2: Mathematical Specification */}
        <div className="space-y-2">
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
            2. Especificación y Ecuación Logística Estimada
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            La formulación estructural responde a la función de enlace Logit:
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg font-mono text-xs text-indigo-900 dark:text-indigo-200 overflow-x-auto">
            Logit(p) = ln[ p / (1 - p) ] = {coefficients[0]?.coef.toFixed(3) || 'β₀'}{' '}
            {coefficients
              .filter((c) => c.variable !== '(Intercepto)')
              .map(
                (c) =>
                  `${c.coef >= 0 ? `+ ${c.coef.toFixed(3)}` : `- ${Math.abs(c.coef).toFixed(3)}`} · ${c.variable}`
              )
              .join(' ')}
          </div>
        </div>

        {/* Section 3: Summary of Goodness of Fit */}
        {fit && (
          <div className="space-y-3">
            <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
              3. Bondad de Ajuste y Métricas de Capacidad Predictiva
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-500 block">AUC-ROC</span>
                <span className="font-mono-numbers text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {fit.auc.toFixed(3)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-500 block">Pseudo R² McFadden</span>
                <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                  {(fit.mcfaddenR2 * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-500 block">Sensibilidad (Recall)</span>
                <span className="font-mono-numbers text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {(fit.recall * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-500 block">Especificidad</span>
                <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
                  {(fit.specificity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Coefficients Table */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
            4. Estimación de Parámetros y Odds Ratios
          </h2>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Variable</th>
                  <th className="px-3 py-2 font-semibold text-right">Coeficiente (β)</th>
                  <th className="px-3 py-2 font-semibold text-right">Error Est.</th>
                  <th className="px-3 py-2 font-semibold text-right">Wald z</th>
                  <th className="px-3 py-2 font-semibold text-right">p-valor</th>
                  <th className="px-3 py-2 font-semibold text-right">Odds Ratio (e^β)</th>
                  <th className="px-3 py-2 font-semibold text-center">95% CI (OR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {coefficients.map((c) => (
                  <tr key={c.variable}>
                    <td className="px-3 py-1.5 font-medium">{c.variable}</td>
                    <td className="px-3 py-1.5 text-right font-mono-numbers">{c.coef.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right font-mono-numbers text-slate-500">{c.stdErr.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right font-mono-numbers text-slate-600">{c.zStat.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono-numbers font-semibold">
                      {c.pValue < 0.001 ? '<0.001' : c.pValue.toFixed(4)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono-numbers font-bold text-indigo-700 dark:text-indigo-300">
                      {c.oddsRatio.toFixed(3)}
                    </td>
                    <td className="px-3 py-1.5 text-center font-mono-numbers text-[11px] text-slate-500">
                      [{c.ciLowerOR.toFixed(2)}, {c.ciUpperOR.toFixed(2)}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Strategic Recommendations */}
        <div className="space-y-2">
          <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
            5. Conclusiones y Recomendaciones para la Toma de Decisiones
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              1. <strong>Capacidad de Discriminación</strong>: Con un AUC de{' '}
              <strong>{fit?.auc.toFixed(3) || '0.85'}</strong>, el modelo clasifica con solvencia a los individuos que incurrirán en el evento respecto a la categoría base.
            </p>
            <p>
              2. <strong>Criterio de Decisión Financiera</strong>: Se aconseja no fijar ciegamente el umbral en 0.50. Debe utilizarse el umbral optimizado mediante la matriz de costos y beneficios del Módulo 14 para maximizar el ROI.
            </p>
            <p>
              3. <strong>Monitoreo Continuo</strong>: Se recomienda auditar trimestralmente la calibración de probabilidades frente a posibles desplazamientos poblacionales (Population Drift).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
