import React, { useState } from 'react';
import {
  Binary,
  HelpCircle,
  TrendingUp,
  Info,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export const MathFundamentalsModule: React.FC = () => {
  const [sliderZ, setSliderZ] = useState<number>(0.0);

  // Computations for interactive lab
  const prob = 1.0 / (1.0 + Math.exp(-sliderZ));
  const odds = prob / (1.0 - prob);
  const logOdds = sliderZ;

  // Generate SVG curve points for sigmoid between z = -6 and z = 6
  const curvePoints: { x: number; y: number }[] = [];
  const svgWidth = 500;
  const svgHeight = 220;
  const padding = 30;

  for (let z = -6; z <= 6; z += 0.2) {
    const p = 1.0 / (1.0 + Math.exp(-z));
    // map z in [-6, 6] to [padding, svgWidth - padding]
    const x = padding + ((z + 6) / 12) * (svgWidth - 2 * padding);
    // map p in [0, 1] to [svgHeight - padding, padding]
    const y = svgHeight - padding - p * (svgHeight - 2 * padding);
    curvePoints.push({ x, y });
  }

  const pathD = curvePoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  // Current point on curve
  const currentX = padding + ((sliderZ + 6) / 12) * (svgWidth - 2 * padding);
  const currentY = svgHeight - padding - prob * (svgHeight - 2 * padding);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Fundamentos y Configuración de la Regresión Logística
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bases metodológicas de Hugo Martínez Gallego: transformación logística, función logit, relación entre probabilidad, odds y estimación por máxima verosimilitud.
        </p>
      </div>

      {/* Interactive Sigmoid Math Lab */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Laboratorio Interactivo
            </span>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Transformación del Predictor Lineal (z) a Probabilidad p
            </h2>
          </div>
          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            p = 1 / (1 + e^-z)
          </span>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 block">Predictor Lineal (z)</span>
            <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
              {sliderZ >= 0 ? `+${sliderZ.toFixed(2)}` : sliderZ.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">z = β₀ + Σ βᵢXᵢ</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 block">Log-Odds (Logit)</span>
            <span className="font-mono-numbers text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {logOdds.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">ln(p / (1-p))</span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 block">Odds (Ventaja)</span>
            <span className="font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100">
              {odds < 100 ? odds.toFixed(2) : '>100'} : 1
            </span>
            <span className="text-[10px] text-slate-400">p / (1-p) = eᶻ</span>
          </div>

          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 block">
              Probabilidad Estimada (p)
            </span>
            <span className="font-mono-numbers text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {(prob * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-emerald-600/80">p = {prob.toFixed(4)}</span>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Ajustar valor de z (-6.0 a +6.0):
            </span>
            <span className="font-mono text-indigo-600 font-bold">z = {sliderZ.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={-6}
            max={6}
            step={0.1}
            value={sliderZ}
            onChange={(e) => setSliderZ(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Dynamic SVG Sigmoid Plot */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-xl h-52">
            {/* Grid & Axes */}
            <line
              x1={padding}
              y1={svgHeight - padding}
              x2={svgWidth - padding}
              y2={svgHeight - padding}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1.5"
            />
            <line
              x1={svgWidth / 2}
              y1={padding}
              x2={svgWidth / 2}
              y2={svgHeight - padding}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={svgHeight / 2}
              x2={svgWidth - padding}
              y2={svgHeight / 2}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* Labels */}
            <text x={padding} y={svgHeight - 10} className="text-[10px] fill-slate-400 font-mono">
              z = -6
            </text>
            <text x={svgWidth / 2 - 12} y={svgHeight - 10} className="text-[10px] fill-slate-500 font-mono font-bold">
              z = 0
            </text>
            <text x={svgWidth - padding - 24} y={svgHeight - 10} className="text-[10px] fill-slate-400 font-mono">
              z = +6
            </text>
            <text x={5} y={padding + 5} className="text-[10px] fill-slate-500 font-mono">
              p = 1.0
            </text>
            <text x={5} y={svgHeight / 2 + 3} className="text-[10px] fill-slate-400 font-mono">
              p = 0.5
            </text>
            <text x={5} y={svgHeight - padding} className="text-[10px] fill-slate-500 font-mono">
              p = 0.0
            </text>

            {/* Sigmoid Curve */}
            <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" />

            {/* Active interactive point */}
            <circle cx={currentX} cy={currentY} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          </svg>
          <span className="text-[11px] text-slate-400 mt-1">
            Curva Logística Sigmoide: el punto verde marca el valor interactivo actual.
          </span>
        </div>
      </div>

      {/* Econometric Theory Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
              1
            </span>
            Función Logit y Predicción Lineal
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            La función logit es el logaritmo natural de la razón de momios (odds). Mapea el intervalo acotado de probabilidades (0, 1) a la recta real completa (-∞, +∞), permitiendo modelar la relación mediante una combinación lineal de parámetros β sin violar el axioma de Kolmogorov:
          </p>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded font-mono text-xs text-center text-indigo-700 dark:text-indigo-300">
            Logit(p) = ln( p / (1 - p) ) = β₀ + β₁X₁ + ... + βₖXₖ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
              2
            </span>
            Estimación por Máxima Verosimilitud (MLE)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            A diferencia de la regresión lineal que minimiza la suma de cuadrados residuales (OLS), la regresión logística busca los parámetros β que maximizan la función de Log-Verosimilitud conjunta de la muestra Bernoulli:
          </p>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded font-mono text-xs text-center text-indigo-700 dark:text-indigo-300">
            ln L(β) = Σ [ yᵢ ln(pᵢ) + (1 - yᵢ) ln(1 - pᵢ) ]
          </div>
          <p className="text-[11px] text-slate-400">
            Se resuelve iterativamente mediante mínimos cuadrados ponderados iterativos (IRLS) o Newton-Raphson.
          </p>
        </div>
      </div>
    </div>
  );
};
