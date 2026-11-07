import React from 'react';
import {
  Building2,
  FolderOpen,
  Info,
  Check,
  Tag,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { ProjectState, SectorType } from '../../types/logit';
import { SECTOR_DEFINITIONS } from '../../utils/sampleData';

interface ProjectConfigModuleProps {
  projectState: ProjectState;
  onUpdateProject: (updates: Partial<ProjectState>) => void;
  onLoadSectorBenchmark: (sector: SectorType) => void;
}

export const ProjectConfigModule: React.FC<ProjectConfigModuleProps> = ({
  projectState,
  onUpdateProject,
  onLoadSectorBenchmark,
}) => {
  const currentDef = SECTOR_DEFINITIONS[projectState.sector] || SECTOR_DEFINITIONS.financiero;
  const sectors = Object.values(SECTOR_DEFINITIONS);

  const handleSectorChange = (newSector: SectorType) => {
    const def = SECTOR_DEFINITIONS[newSector];
    onUpdateProject({
      sector: newSector,
      positiveClassLabel: def.defaultPositive,
      negativeClassLabel: def.defaultNegative,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Title & Scope banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Configuración Inicial del Proyecto
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Defina el marco analítico, el sector económico y la semántica de las categorías de la variable objetivo (Y) según la metodología econométrica de Hugo Martínez Gallego.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre del Proyecto
            </label>
            <input
              type="text"
              value={projectState.projectName}
              onChange={(e) => onUpdateProject({ projectName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              placeholder="Ej. Modelo Scoring Riesgo Cartera Consumo 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Sector Económico de Aplicación
            </label>
            <select
              value={projectState.sector}
              onChange={(e) => handleSectorChange(e.target.value as SectorType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Objetivo Estratégico del Modelo
          </label>
          <textarea
            rows={2}
            value={projectState.projectObjective}
            onChange={(e) => onUpdateProject({ projectObjective: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Describa el objetivo de negocio, la hipótesis econométrica y la decisión que se apoyará en la probabilidad estimada..."
          />
        </div>

        {/* Sector Context Alert */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Personalización sectorial activa ({currentDef.name}):
            </span>
            <p>{currentDef.description}</p>
            <p className="text-slate-500 dark:text-slate-400">
              La selección sectorial ajusta las interpretaciones gerenciales, las recomendaciones y los ejemplos didácticos sin alterar el rigor matemático del estimador de máxima verosimilitud.
            </p>
          </div>
        </div>
      </div>

      {/* Target Variable Definition Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
              Semántica de la Variable Objetivo (Y)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              En regresión logística binaria, Y = 1 representa la ocurrencia del evento de interés y Y = 0 la categoría base o no ocurrencia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Evento Positivo (Y = 1)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded">
                p = P(Y = 1 | X)
              </span>
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Significado de negocio de la categoría positiva:
              </label>
              <input
                type="text"
                value={projectState.positiveClassLabel}
                onChange={(e) => onUpdateProject({ positiveClassLabel: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-md text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              Ejemplos: Cliente incumple pago, paciente desarrolla afección, cliente abandona servicio, compra concretada.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Evento Negativo / Base (Y = 0)
              </span>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                1 - p = P(Y = 0 | X)
              </span>
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Significado de negocio de la categoría negativa:
              </label>
              <input
                type="text"
                value={projectState.negativeClassLabel}
                onChange={(e) => onUpdateProject({ negativeClassLabel: e.target.value })}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ejemplos: Cliente al día, paciente sano, cliente permanece, no responde a campaña.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Benchmark Preset Loader */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100">
              Cargar Base de Datos Benchmark Sectorial
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inicie inmediatamente el análisis con bases de datos estandarizadas con señal estadística real y casos de uso del sector.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {[
            { id: 'financiero', title: 'Score Crédito & Default', rows: '600 registros', desc: 'DTI, Score, Ingresos, Moras' },
            { id: 'telecom', title: 'Churn Telecomunicaciones', rows: '600 registros', desc: 'Antigüedad, Cargo, Contratos' },
            { id: 'salud', title: 'Riesgo Clínico Cardiovascular', rows: '600 registros', desc: 'Edad, BMI, Glucosa, Presión' },
            { id: 'rrhh', title: 'Rotación de Personal (HR)', rows: '600 registros', desc: 'Satisfacción, Horas extra, Salario' },
            { id: 'marketing', title: 'Conversión de Campaña', rows: '600 registros', desc: 'Llamadas, Saldo, Campañas previas' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onLoadSectorBenchmark(item.id as SectorType)}
              className="p-3.5 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>{item.title}</span>
                <span className="font-mono text-[10px] text-slate-400">{item.rows}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
