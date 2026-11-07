import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { ProjectState, ColumnMetadata, SectorType } from '../../types/logit';
import { inferColumnMetadata } from '../../utils/edaPrep';

interface DataImportModuleProps {
  projectState: ProjectState;
  onDataLoaded: (rows: Record<string, any>[], columns: ColumnMetadata[], targetCol: string) => void;
  onLoadSectorBenchmark: (sector: SectorType) => void;
  onUpdateTargetCol: (col: string) => void;
}

export const DataImportModule: React.FC<DataImportModuleProps> = ({
  projectState,
  onDataLoaded,
  onLoadSectorBenchmark,
  onUpdateTargetCol,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const pageSize = 8;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsProcessing(false);
          if (results.errors.length > 0 && results.data.length === 0) {
            setErrorMessage(`Error al leer archivo: ${results.errors[0].message}`);
            return;
          }
          processParsedData(results.data as Record<string, any>[]);
        },
        error: (err) => {
          setIsProcessing(false);
          setErrorMessage(`Error en lectura de CSV: ${err.message}`);
        },
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Record<string, any>[];
          setIsProcessing(false);
          processParsedData(json);
        } catch (err: any) {
          setIsProcessing(false);
          setErrorMessage(`Error al procesar Excel: ${err.message}`);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setErrorMessage('Fallo en la lectura del archivo Excel.');
      };
      reader.readAsBinaryString(file);
    } else if (fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const parsed = JSON.parse(text);
          const rows = Array.isArray(parsed) ? parsed : [parsed];
          setIsProcessing(false);
          processParsedData(rows);
        } catch (err: any) {
          setIsProcessing(false);
          setErrorMessage(`Error en sintaxis JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      setIsProcessing(false);
      setErrorMessage('Formato no soportado. Cargue archivos CSV, Excel (.xlsx/.xls), JSON o TXT.');
    }
  };

  const processParsedData = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      setErrorMessage('El archivo no contiene registros válidos.');
      return;
    }

    const columns = inferColumnMetadata(data);
    // Find candidate target column (binary or matching common names)
    let candidateTarget = columns.find(
      (c) =>
        c.type === 'binary' ||
        c.name.toLowerCase().includes('target') ||
        c.name.toLowerCase().includes('default') ||
        c.name.toLowerCase().includes('churn') ||
        c.name.toLowerCase().includes('incumplimiento') ||
        c.name.toLowerCase().includes('y')
    )?.name;

    if (!candidateTarget && columns.length > 0) {
      candidateTarget = columns[columns.length - 1].name;
    }

    onDataLoaded(data, columns, candidateTarget || '');
  };

  // Duplicate check
  const checkDuplicates = (rows: Record<string, any>[]) => {
    if (rows.length === 0) return 0;
    const seen = new Set<string>();
    let dupes = 0;
    for (const r of rows) {
      const key = JSON.stringify(r);
      if (seen.has(key)) dupes++;
      else seen.add(key);
    }
    return dupes;
  };

  const duplicateCount = checkDuplicates(projectState.rawRows);
  const totalMissing = projectState.columns.reduce((acc, col) => acc + col.missingCount, 0);

  const previewRows = projectState.rawRows.slice(previewPage * pageSize, (previewPage + 1) * pageSize);
  const totalPages = Math.ceil(projectState.rawRows.length / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Carga e Importación de Información
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Importe bases de datos en CSV, Excel (.xlsx / .xls), JSON o TXT. El sistema detecta automáticamente encabezados, tipos de datos y valores atípicos.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Carga de Archivo Local
              </span>
              <span className="text-xs text-slate-400">CSV, XLSX, XLS, JSON</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls, .json, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Haga clic para seleccionar o arrastre su archivo aquí
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Detección automática de delimitadores, comas decimales y codificación UTF-8
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
              <span>Procesando archivo e infiriendo taxonomía de variables...</span>
            </div>
          )}
        </div>

        {/* Benchmark Presets card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Bases de Prueba Disponibles
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cargue datasets reales con señal predictiva para probar la metodología de inmediato:
            </p>

            <div className="space-y-2">
              {[
                { sector: 'financiero', label: 'Riesgo de Crédito (Default)' },
                { sector: 'telecom', label: 'Churn de Clientes (Telco)' },
                { sector: 'salud', label: 'Riesgo Clínico Cardiovascular' },
                { sector: 'rrhh', label: 'Rotación de Empleados (HR)' },
                { sector: 'marketing', label: 'Conversión de Campaña' },
              ].map((s) => (
                <button
                  key={s.sector}
                  onClick={() => onLoadSectorBenchmark(s.sector as SectorType)}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between"
                >
                  <span>{s.label}</span>
                  <span className="font-mono text-[10px] text-slate-400">600 filas</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Overview KPI Strip */}
      {projectState.rawRows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Total Registros (N)</span>
            <div className="font-mono-numbers font-bold text-2xl text-slate-900 dark:text-slate-100">
              {projectState.rawRows.length.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">Observaciones importadas</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Variables Totales</span>
            <div className="font-mono-numbers font-bold text-2xl text-slate-900 dark:text-slate-100">
              {projectState.columns.length}
            </div>
            <span className="text-[11px] text-slate-400">Columnas analizadas</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Valores Faltantes</span>
            <div className={`font-mono-numbers font-bold text-2xl ${totalMissing > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {totalMissing}
            </div>
            <span className="text-[11px] text-slate-400">Celdas nulas o vacías</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Registros Duplicados</span>
            <div className="font-mono-numbers font-bold text-2xl text-slate-900 dark:text-slate-100">
              {duplicateCount}
            </div>
            <span className="text-[11px] text-slate-400">Filas repetidas</span>
          </div>
        </div>
      )}

      {/* Target Variable Assignment Control */}
      {projectState.rawRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Selección de la Variable Dependiente / Objetivo (Y)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifique cuál columna contiene el resultado a modelar (binario: 0 o 1).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={projectState.targetVariable}
              onChange={(e) => onUpdateTargetCol(e.target.value)}
              className="px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 rounded-lg text-sm font-semibold text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {projectState.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Data Preview Table */}
      {projectState.rawRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Visualización de Datos Importados (Primeras Filas)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Página {previewPage + 1} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={previewPage === 0}
                  onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                  className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={previewPage >= totalPages - 1}
                  onClick={() => setPreviewPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-2.5 font-semibold font-mono text-[11px]">#</th>
                  {projectState.columns.map((col) => {
                    const isTarget = col.name === projectState.targetVariable;
                    return (
                      <th
                        key={col.name}
                        className={`px-3 py-2.5 font-semibold whitespace-nowrap ${
                          isTarget ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          {isTarget && (
                            <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded font-mono">
                              Y
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block font-mono">
                          {col.type}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">
                      {previewPage * pageSize + idx + 1}
                    </td>
                    {projectState.columns.map((col) => {
                      const val = row[col.name];
                      const isTarget = col.name === projectState.targetVariable;
                      return (
                        <td
                          key={col.name}
                          className={`px-3 py-2 whitespace-nowrap font-mono-numbers ${
                            isTarget ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-bold text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-amber-500 italic font-sans">(nulo)</span>
                          ) : typeof val === 'number' ? (
                            Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2)
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
