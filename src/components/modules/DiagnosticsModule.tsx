import React from 'react';
import {
  ShieldCheck,
  Target,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { ProjectState, CalibrationBin } from '../../types/logit';
import { chiSquarePValue } from '../../utils/mathStats';

interface DiagnosticsModuleProps {
  projectState: ProjectState;
}

export const DiagnosticsModule: React.FC<DiagnosticsModuleProps> = ({ projectState }) => {
  const coefficients = projectState.coefficients || [];
  const vifList = coefficients.filter((c) => c.variable !== '(Intercepto)' && c.vif !== undefined);
  const calBins: CalibrationBin[] = projectState.calibrationCurve || [];
  const brier = projectState.fitMetrics?.brierScore ?? 0;
  const nObs = projectState.fitMetrics?.nObs ?? 0;
  const kParams = (projectState.fitMetrics?.kParameters ?? 1) - 1; // predictors count

  // Events Per Variable (EPV) check
  let posCount = 0;
  projectState.rawRows.forEach((r) => {
    if (Number(r[projectState.targetVariable]) === 1) posCount++;
  });
  const epv = kParams > 0 ? posCount / kParams : 0;
  const isEpvSufficient = epv >= 10;

  // Hosmer-Lemeshow Goodness of Fit Test calculation from calibration bins
  const hosmerLemeshow = React.useMemo(() => {
    if (calBins.length < 3) return { chi2: 0, pVal: 1, df: 8 };
    let chi2 = 0;
    for (const bin of calBins) {
      const n_g = bin.count;
      const o_g = bin.observedFraction * n_g;
      const pi_bar = Math.max(1e-6, Math.min(1 - 1e-6, bin.meanPredicted));
      const e_g = n_g * pi_bar;
      const term1 = Math.pow(o_g - e_g, 2) / e_g;
      const term2 = Math.pow(n_g - o_g - (n_g - e_g), 2) / (n_g * (1 - pi_bar));
      chi2 += term1 + term2;
    }
    const df = Math.max(1, calBins.length - 2);
    const pVal = chiSquarePValue(chi2, df);
    return { chi2, pVal, df };
  }, [calBins]);

  // Calibration SVG chart
  const svgW = 340;
  const svgH = 220;
  const pad = 35;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Diagnóstico Estadístico, Supuestos y Calibración de Probabilidades
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Validación rigurosa de multicolinealidad (VIF), suficiencia muestral (EPV &ge; 10), prueba de bondad de ajuste de Hosmer-Lemeshow y curvas de calibración (Diagrama de Confiabilidad).
        </p>
      </div>

      {/* EPV & Sample Adequacy Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Eventos por Variable (EPV)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-numbers text-2xl font-bold text-slate-900 dark:text-slate-100">
              {epv.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">/ 10 mín.</span>
          </div>
          <span className={`text-[11px] font-semibold mt-1 block ${isEpvSufficient ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isEpvSufficient ? 'Muestra suficiente para estimar parámetros' : 'Riesgo de sobreajuste por bajo EPV'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Calibración (Brier Score)</span>
          <span className="font-mono-numbers text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {brier.toFixed(4)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            0.0 es calibración perfecta; 0.25 es azar puro
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Test Hosmer-Lemeshow</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-numbers text-lg font-bold text-slate-900 dark:text-slate-100">
              χ² = {hosmerLemeshow.chi2.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              p = {hosmerLemeshow.pVal.toFixed(3)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {hosmerLemeshow.pVal >= 0.05
              ? 'Calibración aceptable (no se rechaza H₀)'
              : 'Discrepancia significativa en calibración'}
          </span>
        </div>
      </div>

      {/* Multicollinearity VIF Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Evaluación de Multicolinealidad: Variance Inflation Factor (VIF)
            </h2>
            <p className="text-xs text-slate-500">
              El VIF cuantifica cuánto se infla la varianza del estimador por correlación con otros predictores.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">VIF = 1 / (1 - Rⱼ²)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Variable</th>
                <th className="px-3 py-2.5 font-semibold text-right">VIF Estimado</th>
                <th className="px-4 py-2.5 font-semibold">Diagnóstico Econométrico</th>
                <th className="px-4 py-2.5 font-semibold">Recomendación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {vifList.map((c) => {
                const vif = c.vif || 1.0;
                const isHigh = vif > 10;
                const isModerate = vif > 5 && vif <= 10;

                return (
                  <tr key={c.variable} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {c.variable}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                      {vif.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5">
                      {isHigh ? (
                        <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Multicolinealidad Severa (VIF &gt; 10)
                        </span>
                      ) : isModerate ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          Multicolinealidad Moderada (5 &lt; VIF &le; 10)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Aceptable / No redundante
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      {isHigh
                        ? 'Se recomienda remover la variable o aplicar regularización L2 (Ridge) para estabilizar coeficientes.'
                        : isModerate
                        ? 'Monitorear estabilidad de errores estándar al cambiar la muestra.'
                        : 'Varianza bien condicionada.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calibration Curve (Reliability Diagram) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Curva de Calibración de Probabilidades (Reliability Diagram)
            </h2>
            <p className="text-xs text-slate-500">
              Contrasta la probabilidad predicha media frente a la frecuencia observada en cada decil de riesgo.
            </p>
          </div>
          <span className="text-xs text-slate-400">Línea diagonal gris: Calibración Perfecta</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-52">
              {/* Axes */}
              <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Diagonal 45 deg perfect calibration line */}
              <line
                x1={pad}
                y1={svgH - pad}
                x2={svgW - pad}
                y2={pad}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Calibration Points & Line */}
              {calBins.length > 0 && (() => {
                const pts = calBins.map((bin) => ({
                  x: pad + bin.meanPredicted * (svgW - 2 * pad),
                  y: svgH - pad - bin.observedFraction * (svgH - 2 * pad),
                }));
                const pathStr = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return (
                  <>
                    <path d={pathStr} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                    {pts.map((p, idx) => (
                      <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                    ))}
                  </>
                );
              })()}

              {/* Labels */}
              <text x={pad} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">0.0</text>
              <text x={svgW - pad - 15} y={svgH - 12} className="text-[10px] fill-slate-400 font-mono">1.0</text>
              <text x={svgW / 2 - 35} y={svgH - 12} className="text-[10px] fill-slate-500 font-medium">Predicho p̂</text>
              <text x={10} y={pad + 10} className="text-[10px] fill-slate-400 font-mono">1.0</text>
              <text x={10} y={svgH / 2} className="text-[10px] fill-slate-500 font-medium" transform={`rotate(-90 10 ${svgH / 2})`}>Frecuencia Real</text>
            </svg>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              Diferencia Fundamental: Discriminación vs Calibración
            </span>
            <p>
              El <strong>AUC-ROC</strong> mide la capacidad de <em>discriminación</em>: si a un caso positivo se le asigna mayor probabilidad que a uno negativo.
            </p>
            <p>
              La <strong>calibración</strong> mide si el valor numérico de la probabilidad refleja fielmente la tasa real observada (por ejemplo, si de todos los clientes a quienes el modelo asigna un 70% de probabilidad de mora, exactamente el 70% de ellos incurre en mora).
            </p>
            <p className="text-slate-500">
              Un modelo puede tener alto AUC pero estar mal calibrado en sus extremos si hay sesgos en la muestra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
