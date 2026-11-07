import React from 'react';
import {
  Settings,
  UploadCloud,
  BarChart3,
  SlidersHorizontal,
  Binary,
  Calculator,
  GitFork,
  CheckCircle2,
  TableProperties,
  TrendingUp,
  Percent,
  ShieldCheck,
  Target,
  FileText,
  Bot,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface ModuleItem {
  id: string;
  number: string;
  title: string;
  icon: React.ElementType;
  group: string;
}

export const MODULES: ModuleItem[] = [
  // Grupo 1: Datos y Preparación
  { id: 'config', number: '01', title: 'Configuración Inicial', icon: Settings, group: 'Datos & Preparación' },
  { id: 'data', number: '02', title: 'Carga de Información', icon: UploadCloud, group: 'Datos & Preparación' },
  { id: 'eda', number: '03', title: 'Análisis Exploratorio (EDA)', icon: BarChart3, group: 'Datos & Preparación' },
  { id: 'prep', number: '04', title: 'Limpieza & Tratamiento', icon: SlidersHorizontal, group: 'Datos & Preparación' },

  // Grupo 2: Modelamiento
  { id: 'math', number: '05', title: 'Fundamentos Logit', icon: Binary, group: 'Modelamiento Estadístico' },
  { id: 'estimation', number: '06', title: 'Estimación & Coeficientes', icon: Calculator, group: 'Modelamiento Estadístico' },
  { id: 'stepwise', number: '07', title: 'Selección Stepwise', icon: GitFork, group: 'Modelamiento Estadístico' },
  { id: 'validation', number: '10', title: 'Validación & K-Fold', icon: CheckCircle2, group: 'Modelamiento Estadístico' },

  // Grupo 3: Evaluación Predictiva
  { id: 'evaluation', number: '11', title: 'Matriz & Umbrales', icon: TableProperties, group: 'Evaluación Predictiva' },
  { id: 'roc_pr', number: '12', title: 'Curvas ROC & PR', icon: TrendingUp, group: 'Evaluación Predictiva' },
  { id: 'lift', number: '14', title: 'Lift, Gains & Ganancia', icon: Percent, group: 'Evaluación Predictiva' },

  // Grupo 4: Diagnóstico y Negocio
  { id: 'diagnostics', number: '15', title: 'Diagnósticos & VIF', icon: ShieldCheck, group: 'Diagnóstico & Negocio' },
  { id: 'calibration', number: '16', title: 'Calibración de Riesgo', icon: Target, group: 'Diagnóstico & Negocio' },
  { id: 'business', number: '17', title: 'Reglas de Negocio', icon: FileText, group: 'Diagnóstico & Negocio' },
  { id: 'comparison', number: '19', title: 'Comparar Modelos', icon: Layers, group: 'Diagnóstico & Negocio' },

  // Grupo 5: Simulación y Asistencia
  { id: 'simulator', number: '09', title: 'Simulador & Predicción', icon: Sparkles, group: 'Simulación & Reportes' },
  { id: 'ai', number: '20', title: 'Asistente IA (Gemini)', icon: Bot, group: 'Simulación & Reportes' },
  { id: 'reports', number: 'Export', title: 'Reporte Ejecutivo', icon: FileText, group: 'Simulación & Reportes' },
];

interface SidebarProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  hasTrainedModel: boolean;
  hasDataLoaded: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModuleId,
  onSelectModule,
  hasTrainedModel,
  hasDataLoaded,
}) => {
  const groups = Array.from(new Set(MODULES.map((m) => m.group)));

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col shrink-0 no-print">
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Módulos de la Plataforma
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Metodología Hugo Martínez & R GLM
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((groupName) => {
          const groupModules = MODULES.filter((m) => m.group === groupName);
          return (
            <div key={groupName} className="space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {groupName}
              </div>
              {groupModules.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModuleId === mod.id;
                const requiresModel = [
                  'estimation',
                  'stepwise',
                  'evaluation',
                  'roc_pr',
                  'lift',
                  'diagnostics',
                  'calibration',
                  'business',
                  'simulator',
                  'comparison',
                  'ai',
                ].includes(mod.id);

                return (
                  <button
                    key={mod.id}
                    onClick={() => onSelectModule(mod.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{mod.title}</span>
                    </div>
                    <span
                      className={`text-[10px] tabular-nums font-mono px-1 rounded shrink-0 ${
                        isActive
                          ? 'bg-indigo-700/60 text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {mod.number}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Estado del Modelo:</span>
          <span
            className={`font-semibold ${
              hasTrainedModel
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {hasTrainedModel ? 'Estimado (IRLS)' : 'Pendiente'}
          </span>
        </div>
      </div>
    </aside>
  );
};
