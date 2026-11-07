import React from 'react';
import {
  Activity,
  Moon,
  Sun,
  FileSpreadsheet,
  Download,
  Database,
  HelpCircle,
} from 'lucide-react';
import { SectorDefinition } from '../../types/logit';

interface HeaderProps {
  currentSector: SectorDefinition;
  projectName: string;
  isDark: boolean;
  onToggleTheme: () => void;
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  onQuickExport: () => void;
  hasModelTrained: boolean;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSector,
  projectName,
  isDark,
  onToggleTheme,
  activeModuleId,
  onSelectModule,
  onQuickExport,
  hasModelTrained,
  onLoadSample,
}) => {
  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-8 no-print">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm">
          <Activity className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
            LogitAnalytics
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
            GLM & Predictive Machine Learning
          </span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => onSelectModule('data')}
          className={`transition-colors whitespace-nowrap hover:text-slate-900 dark:hover:text-white ${
            activeModuleId === 'data' || activeModuleId === 'eda'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Datos & EDA
        </button>
        <button
          onClick={() => onSelectModule('estimation')}
          className={`transition-colors whitespace-nowrap hover:text-slate-900 dark:hover:text-white ${
            activeModuleId === 'estimation' || activeModuleId === 'stepwise'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Modelo & Coeficientes
        </button>
        <button
          onClick={() => onSelectModule('evaluation')}
          className={`transition-colors whitespace-nowrap hover:text-slate-900 dark:hover:text-white ${
            activeModuleId === 'evaluation' || activeModuleId === 'lift'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Curvas ROC & Lift
        </button>
        <button
          onClick={() => onSelectModule('simulator')}
          className={`transition-colors whitespace-nowrap hover:text-slate-900 dark:hover:text-white ${
            activeModuleId === 'simulator'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Simulador
        </button>
        <button
          onClick={() => onSelectModule('ai')}
          className={`transition-colors whitespace-nowrap hover:text-slate-900 dark:hover:text-white ${
            activeModuleId === 'ai'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : ''
          }`}
        >
          Asistente IA
        </button>
      </nav>

      {/* Zone 3: 1 primary action area + Theme toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 pr-3">
          <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
            {projectName}
          </span>
          <span aria-hidden="true">·</span>
          <span>{currentSector.name}</span>
        </div>

        <button
          onClick={onToggleTheme}
          aria-label="Alternar tema claro y oscuro"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onQuickExport}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Generar Reporte</span>
        </button>
      </div>
    </header>
  );
};
