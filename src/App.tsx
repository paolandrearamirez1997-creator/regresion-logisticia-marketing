import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectConfigModule } from './components/modules/ProjectConfigModule';
import { DataImportModule } from './components/modules/DataImportModule';
import { EdaModule } from './components/modules/EdaModule';
import { DataPrepModule } from './components/modules/DataPrepModule';
import { MathFundamentalsModule } from './components/modules/MathFundamentalsModule';
import { ModelEstimationModule } from './components/modules/ModelEstimationModule';
import { StepwiseModule } from './components/modules/StepwiseModule';
import { ValidationModule } from './components/modules/ValidationModule';
import { EvaluationModule } from './components/modules/EvaluationModule';
import { LiftGainsModule } from './components/modules/LiftGainsModule';
import { DiagnosticsModule } from './components/modules/DiagnosticsModule';
import { BusinessRulesModule } from './components/modules/BusinessRulesModule';
import { SimulatorModule } from './components/modules/SimulatorModule';
import { ModelComparisonModule } from './components/modules/ModelComparisonModule';
import { AiAssistantModule } from './components/modules/AiAssistantModule';
import { ReportExportModule } from './components/modules/ReportExportModule';

import {
  ProjectState,
  SectorType,
  ColumnMetadata,
  VariableType,
  CrossValidationFoldResult,
} from './types/logit';
import {
  SECTOR_DEFINITIONS,
  generateCreditDefaultData,
  generateTelcoChurnData,
  generateHealthRiskData,
  generateHrAttritionData,
  generateMarketingData,
} from './utils/sampleData';
import { inferColumnMetadata, fitDataPipeline, transformDatasetWithPipeline } from './utils/edaPrep';
import { fitLogisticRegression } from './utils/logisticRegression';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [activeModuleId, setActiveModuleId] = useState<string>('config');

  // Master Project State
  const [projectState, setProjectState] = useState<ProjectState>(() => {
    const defaultSector: SectorType = 'financiero';
    const sectorDef = SECTOR_DEFINITIONS[defaultSector];
    return {
      projectName: 'Modelo Predictivo de Riesgo de Crédito (Default)',
      projectObjective:
        'Estimar la probabilidad de incumplimiento de pago en clientes de consumo para optimizar las políticas de originación y fijar provisiones de riesgo.',
      sector: defaultSector,
      targetVariable: 'Incumplimiento',
      positiveClassValue: 1,
      positiveClassLabel: sectorDef.defaultPositive,
      negativeClassValue: 0,
      negativeClassLabel: sectorDef.defaultNegative,
      rawRows: [],
      columns: [],
      cleanRows: [],
      transformedRows: [],
      trainRows: [],
      testRows: [],
      transformPipeline: {
        missingImputation: {},
        outlierTreatment: {},
        encodingApplied: {},
        standardizedColumns: [],
      },
      selectedFeatures: [],
      regularization: 'none',
      regLambda: 0.01,
      trainTestSplitRatio: 0.75,
      randomSeed: 42,
      classificationThreshold: 0.5,
      coefficients: [],
      fitMetrics: null,
      trainMetrics: null,
      testMetrics: null,
      confusionMatrix: null,
      rocCurve: [],
      prCurve: [],
      decileLift: [],
      calibrationCurve: [],
      stepwiseHistory: [],
      cvResults: [],
      savedModels: [],
      costPerContact: 15,
      benefitPerPositive: 300,
      costFalsePositive: 40,
      costFalseNegative: 200,
      totalBudget: 15000,
    };
  });

  // Apply dark class on root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Initial load of sample benchmark dataset on first turn
  useEffect(() => {
    loadBenchmarkDataset('financiero');
  }, []);

  const loadBenchmarkDataset = (sector: SectorType) => {
    let data: Record<string, any>[] = [];
    let target = 'Incumplimiento';
    let name = 'Modelo de Riesgo de Crédito (Default)';
    let obj = 'Estimar probabilidad de impago en cartera de crédito de consumo.';

    if (sector === 'financiero' || sector === 'fintech') {
      data = generateCreditDefaultData(600, 42);
      target = 'Incumplimiento';
      name = 'Modelo Scoring Riesgo de Crédito (Default)';
      obj = 'Estimar la probabilidad de incumplimiento de pago de obligaciones crediticias.';
    } else if (sector === 'telecom' || sector === 'servicios') {
      data = generateTelcoChurnData(600, 101);
      target = 'Desercion_Churn';
      name = 'Modelo de Deserción de Clientes (Telco Churn)';
      obj = 'Predecir la probabilidad de fuga de clientes pospago para orientar campañas de fidelización.';
    } else if (sector === 'salud') {
      data = generateHealthRiskData(600, 202);
      target = 'Evento_Cardiovascular';
      name = 'Modelo de Riesgo Clínico Cardiovascular';
      obj = 'Identificar factores determinantes en la probabilidad de eventos cardiovasculares adversos.';
    } else if (sector === 'rrhh') {
      data = generateHrAttritionData(600, 303);
      target = 'Renuncia_Voluntaria';
      name = 'Modelo de Rotación Laboral de Empleados (Attrition)';
      obj = 'Determinar factores asociados a la renuncia voluntaria de talento clave.';
    } else {
      data = generateMarketingData(600, 404);
      target = 'Conversion_Compra';
      name = 'Modelo de Propensión de Compra y Conversión';
      obj = 'Optimizar la tasa de conversión en campañas comerciales directas.';
    }

    const cols = inferColumnMetadata(data);
    const sectorDef = SECTOR_DEFINITIONS[sector];

    // Auto-fit initial model for instant responsiveness
    const features = cols
      .filter((c) => !c.isExcluded && c.name !== target)
      .map((c) => c.name);

    const X_data = data.map((r) => features.map((f) => Number(r[f]) || 0));
    const y_data = data.map((r) => (Number(r[target]) === 1 ? 1 : 0));

    const fitRes = fitLogisticRegression(X_data, y_data, features, {
      regularization: 'none',
      threshold: 0.5,
    });

    setProjectState((prev) => ({
      ...prev,
      sector,
      projectName: name,
      projectObjective: obj,
      targetVariable: target,
      positiveClassLabel: sectorDef.defaultPositive,
      negativeClassLabel: sectorDef.defaultNegative,
      rawRows: data,
      columns: cols,
      cleanRows: data,
      transformedRows: data,
      selectedFeatures: features,
      coefficients: fitRes.coefficients,
      fitMetrics: fitRes.fitMetrics,
      confusionMatrix: fitRes.confusionMatrix,
      rocCurve: fitRes.rocCurve,
      prCurve: fitRes.prCurve,
      decileLift: fitRes.decileLift,
      calibrationCurve: fitRes.calibrationCurve,
      classificationThreshold: 0.5,
    }));
  };

  const handleDataLoaded = (
    rows: Record<string, any>[],
    cols: ColumnMetadata[],
    targetCol: string
  ) => {
    const features = cols
      .filter((c) => !c.isExcluded && c.name !== targetCol)
      .map((c) => c.name);

    let fitRes: any = null;
    try {
      const X_data = rows.map((r) => features.map((f) => Number(r[f]) || 0));
      const y_data = rows.map((r) => (Number(r[targetCol]) === 1 ? 1 : 0));
      fitRes = fitLogisticRegression(X_data, y_data, features);
    } catch (e) {
      console.warn('Initial fit pending more configuration:', e);
    }

    setProjectState((prev) => ({
      ...prev,
      rawRows: rows,
      columns: cols,
      targetVariable: targetCol,
      selectedFeatures: features,
      cleanRows: rows,
      transformedRows: rows,
      coefficients: fitRes ? fitRes.coefficients : [],
      fitMetrics: fitRes ? fitRes.fitMetrics : null,
      confusionMatrix: fitRes ? fitRes.confusionMatrix : null,
      rocCurve: fitRes ? fitRes.rocCurve : [],
      prCurve: fitRes ? fitRes.prCurve : [],
      decileLift: fitRes ? fitRes.decileLift : [],
      calibrationCurve: fitRes ? fitRes.calibrationCurve : [],
    }));
  };

  const handleUpdateColumnType = (colName: string, newType: VariableType) => {
    setProjectState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) =>
        c.name === colName
          ? { ...c, type: newType, isExcluded: newType === 'identifier' || newType === 'date' }
          : c
      ),
    }));
  };

  const handleToggleColumnExclude = (colName: string) => {
    setProjectState((prev) => ({
      ...prev,
      columns: prev.columns.map((c) =>
        c.name === colName ? { ...c, isExcluded: !c.isExcluded } : c
      ),
    }));
  };

  const handleApplyPipeline = (settings: {
    missingMethodNumeric: 'mean' | 'median' | 'zero';
    missingMethodCategoric: 'mode' | 'unknown';
    outlierMethod: 'none' | 'iqr' | 'zscore' | 'winsorize';
    scalingMethod: 'none' | 'standard' | 'minmax';
  }) => {
    const fitted = fitDataPipeline(
      projectState.rawRows,
      projectState.columns,
      projectState.targetVariable,
      settings
    );

    const { transformedRows, featureColumns } = transformDatasetWithPipeline(
      projectState.rawRows,
      projectState.columns,
      projectState.targetVariable,
      fitted,
      settings
    );

    // Re-fit model on transformed data
    const X_data = transformedRows.map((r) => featureColumns.map((f) => Number(r[f]) || 0));
    const y_data = transformedRows.map((r) => (Number(r[projectState.targetVariable]) === 1 ? 1 : 0));

    const fitRes = fitLogisticRegression(X_data, y_data, featureColumns, {
      regularization: projectState.regularization,
      regLambda: projectState.regLambda,
      threshold: projectState.classificationThreshold,
    });

    setProjectState((prev) => ({
      ...prev,
      transformedRows,
      selectedFeatures: featureColumns,
      coefficients: fitRes.coefficients,
      fitMetrics: fitRes.fitMetrics,
      confusionMatrix: fitRes.confusionMatrix,
      rocCurve: fitRes.rocCurve,
      prCurve: fitRes.prCurve,
      decileLift: fitRes.decileLift,
      calibrationCurve: fitRes.calibrationCurve,
    }));
  };

  const handleTrainModel = (
    features: string[],
    reg: 'none' | 'l1' | 'l2',
    lambda: number
  ) => {
    const rows =
      projectState.transformedRows.length > 0
        ? projectState.transformedRows
        : projectState.rawRows;
    const target = projectState.targetVariable;

    const X_data = rows.map((r) => features.map((f) => Number(r[f]) || 0));
    const y_data = rows.map((r) => (Number(r[target]) === 1 ? 1 : 0));

    const fitRes = fitLogisticRegression(X_data, y_data, features, {
      regularization: reg,
      regLambda: lambda,
      threshold: projectState.classificationThreshold,
    });

    setProjectState((prev) => ({
      ...prev,
      selectedFeatures: features,
      regularization: reg,
      regLambda: lambda,
      coefficients: fitRes.coefficients,
      fitMetrics: fitRes.fitMetrics,
      confusionMatrix: fitRes.confusionMatrix,
      rocCurve: fitRes.rocCurve,
      prCurve: fitRes.prCurve,
      decileLift: fitRes.decileLift,
      calibrationCurve: fitRes.calibrationCurve,
    }));
  };

  const handleUpdateThreshold = (th: number) => {
    setProjectState((prev) => {
      const target = prev.targetVariable;
      const features = prev.selectedFeatures;
      const rows = prev.transformedRows.length > 0 ? prev.transformedRows : prev.rawRows;
      const X_data = rows.map((r) => features.map((f) => Number(r[f]) || 0));
      const y_data = rows.map((r) => (Number(r[target]) === 1 ? 1 : 0));

      const fitRes = fitLogisticRegression(X_data, y_data, features, {
        regularization: prev.regularization,
        regLambda: prev.regLambda,
        threshold: th,
      });

      return {
        ...prev,
        classificationThreshold: th,
        fitMetrics: fitRes.fitMetrics,
        confusionMatrix: fitRes.confusionMatrix,
      };
    });
  };

  const handleApplyStepwiseFeatures = (newFeatures: string[]) => {
    handleTrainModel(newFeatures, 'none', 0);
    setActiveModuleId('estimation');
  };

  const handleSaveModel = (name: string) => {
    if (!projectState.fitMetrics) return;
    const newSpec = {
      id: `model_${Date.now()}`,
      name,
      method:
        projectState.regularization === 'none'
          ? 'MLE (Sin Regularización)'
          : `Ridge (λ=${projectState.regLambda})`,
      features: projectState.selectedFeatures,
      metrics: projectState.fitMetrics,
    };
    setProjectState((prev) => ({
      ...prev,
      savedModels: [...prev.savedModels, newSpec],
    }));
  };

  const currentSectorDef = SECTOR_DEFINITIONS[projectState.sector] || SECTOR_DEFINITIONS.financiero;
  const hasModelTrained = Boolean(projectState.fitMetrics && projectState.coefficients.length > 0);
  const hasDataLoaded = projectState.rawRows.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Universal Top Bar */}
      <Header
        currentSector={currentSectorDef}
        projectName={projectState.projectName}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        activeModuleId={activeModuleId}
        onSelectModule={setActiveModuleId}
        onQuickExport={() => setActiveModuleId('reports')}
        hasModelTrained={hasModelTrained}
        onLoadSample={() => loadBenchmarkDataset(projectState.sector)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeModuleId={activeModuleId}
          onSelectModule={setActiveModuleId}
          hasTrainedModel={hasModelTrained}
          hasDataLoaded={hasDataLoaded}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100/70 dark:bg-slate-950/80">
          {activeModuleId === 'config' && (
            <ProjectConfigModule
              projectState={projectState}
              onUpdateProject={(updates) => setProjectState((prev) => ({ ...prev, ...updates }))}
              onLoadSectorBenchmark={loadBenchmarkDataset}
            />
          )}

          {activeModuleId === 'data' && (
            <DataImportModule
              projectState={projectState}
              onDataLoaded={handleDataLoaded}
              onLoadSectorBenchmark={loadBenchmarkDataset}
              onUpdateTargetCol={(t) => setProjectState((prev) => ({ ...prev, targetVariable: t }))}
            />
          )}

          {activeModuleId === 'eda' && (
            <EdaModule
              projectState={projectState}
              onUpdateColumnType={handleUpdateColumnType}
              onToggleColumnExclude={handleToggleColumnExclude}
            />
          )}

          {activeModuleId === 'prep' && (
            <DataPrepModule
              projectState={projectState}
              onApplyPipeline={handleApplyPipeline}
            />
          )}

          {activeModuleId === 'math' && <MathFundamentalsModule />}

          {activeModuleId === 'estimation' && (
            <ModelEstimationModule
              projectState={projectState}
              onTrainModel={handleTrainModel}
              onNavigateTo={setActiveModuleId}
            />
          )}

          {activeModuleId === 'stepwise' && (
            <StepwiseModule
              projectState={projectState}
              onApplyStepwiseFeatures={handleApplyStepwiseFeatures}
            />
          )}

          {activeModuleId === 'validation' && (
            <ValidationModule
              projectState={projectState}
              onUpdateSplitConfig={(ratio, seed) =>
                setProjectState((prev) => ({
                  ...prev,
                  trainTestSplitRatio: ratio,
                  randomSeed: seed,
                }))
              }
              onUpdateCvResults={(res) =>
                setProjectState((prev) => ({
                  ...prev,
                  cvResults: res,
                }))
              }
            />
          )}

          {activeModuleId === 'evaluation' && (
            <EvaluationModule
              projectState={projectState}
              onUpdateThreshold={handleUpdateThreshold}
            />
          )}

          {activeModuleId === 'roc_pr' && (
            <EvaluationModule
              projectState={projectState}
              onUpdateThreshold={handleUpdateThreshold}
            />
          )}

          {activeModuleId === 'lift' && (
            <LiftGainsModule
              projectState={projectState}
              onUpdateEconomicParams={(params) =>
                setProjectState((prev) => ({ ...prev, ...params }))
              }
              onApplyOptimalThreshold={handleUpdateThreshold}
            />
          )}

          {activeModuleId === 'diagnostics' && (
            <DiagnosticsModule projectState={projectState} />
          )}

          {activeModuleId === 'calibration' && (
            <DiagnosticsModule projectState={projectState} />
          )}

          {activeModuleId === 'business' && (
            <BusinessRulesModule projectState={projectState} />
          )}

          {activeModuleId === 'simulator' && (
            <SimulatorModule projectState={projectState} />
          )}

          {activeModuleId === 'comparison' && (
            <ModelComparisonModule
              projectState={projectState}
              onSaveCurrentAsModel={handleSaveModel}
            />
          )}

          {activeModuleId === 'ai' && (
            <AiAssistantModule projectState={projectState} />
          )}

          {activeModuleId === 'reports' && (
            <ReportExportModule projectState={projectState} />
          )}
        </main>
      </div>
    </div>
  );
}
