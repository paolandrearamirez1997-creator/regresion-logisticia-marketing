export type SectorType =
  | 'financiero'
  | 'seguros'
  | 'fintech'
  | 'comercio'
  | 'marketing'
  | 'telecom'
  | 'salud'
  | 'educacion'
  | 'manufactura'
  | 'transporte'
  | 'inmobiliario'
  | 'rrhh'
  | 'servicios'
  | 'agricultura'
  | 'otros';

export interface SectorDefinition {
  id: SectorType;
  name: string;
  defaultPositive: string;
  defaultNegative: string;
  description: string;
  sampleDatasetKey: string;
  iconName: string;
}

export type VariableType =
  | 'numeric_continuous'
  | 'numeric_discrete'
  | 'categorical_nominal'
  | 'categorical_ordinal'
  | 'binary'
  | 'date'
  | 'identifier';

export interface ColumnMetadata {
  name: string;
  type: VariableType;
  originalType: string;
  missingCount: number;
  missingPct: number;
  uniqueValuesCount: number;
  sampleValues: (string | number)[];
  isExcluded: boolean;
  isTarget: boolean;
}

export interface DescriptiveStatsNumeric {
  count: number;
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  iqr: number;
  cv: number; // Coefficient of variation %
  skewness: number;
  kurtosis: number;
}

export interface DescriptiveStatsCategoric {
  count: number;
  cardinality: number;
  modeCategory: string;
  modeCount: number;
  modePct: number;
  frequencyTable: { category: string; count: number; pct: number }[];
}

export interface BivariateAnalysis {
  variable: string;
  isNumeric: boolean;
  group0Mean?: number;
  group1Mean?: number;
  diffMean?: number;
  tStat?: number;
  pValTTest?: number;
  correlationWithTarget?: number;
  cramersV?: number;
  contingencyTable?: { category: string; count0: number; count1: number; ratePositive: number }[];
  summaryNarrative: string;
}

export interface CoefficientRow {
  variable: string;
  coef: number;
  stdErr: number;
  zStat: number;
  pValue: number;
  ciLowerBeta: number;
  ciUpperBeta: number;
  oddsRatio: number;
  ciLowerOR: number;
  ciUpperOR: number;
  significanceStars: string;
  vif?: number;
}

export interface ModelFitMetrics {
  nObs: number;
  trainSize: number;
  testSize: number;
  kParameters: number;
  logLikelihood: number;
  nullLogLikelihood: number;
  lrStat: number;
  lrPValue: number;
  mcfaddenR2: number;
  adjMcFaddenR2: number;
  coxSnellR2: number;
  nagelkerkeR2: number;
  deviance: number;
  aic: number;
  bic: number;
  auc: number;
  averagePrecision: number;
  brierScore: number;
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  balancedAccuracy: number;
  totalErrorRate: number;
  npv: number;
  youdenJ: number;
}

export interface ConfusionMatrixData {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  total: number;
}

export interface RocCurvePoint {
  threshold: number;
  tpr: number; // sensitivity / recall
  fpr: number; // 1 - specificity
  sensitivity: number;
  specificity: number;
  youdenJ: number;
}

export interface PrecisionRecallPoint {
  threshold: number;
  precision: number;
  recall: number;
}

export interface DecileLiftRow {
  decile: number;
  totalCount: number;
  positives: number;
  negatives: number;
  responseRate: number; // % in decile
  cumTotal: number;
  cumPositives: number;
  cumCaptureRate: number; // Gains %
  cumLift: number; // Lift factor
  nonCumLift: number;
}

export interface CalibrationBin {
  decile: number;
  meanPredicted: number;
  observedFraction: number;
  count: number;
}

export interface StepwiseIteration {
  step: number;
  action: 'ADD' | 'REMOVE' | 'START' | 'STOP';
  variableName: string;
  direction: 'forward' | 'backward' | 'both';
  aic: number;
  bic: number;
  pValCriterion: number;
  activeVariables: string[];
  rationale: string;
}

export interface CrossValidationFoldResult {
  fold: number;
  trainSize: number;
  valSize: number;
  auc: number;
  accuracy: number;
  logLoss: number;
  brierScore: number;
}

export interface ModelComparisonSpec {
  id: string;
  name: string;
  method: string;
  features: string[];
  metrics: ModelFitMetrics;
  isBaseline?: boolean;
}

export interface ProjectState {
  projectName: string;
  projectObjective: string;
  sector: SectorType;
  targetVariable: string;
  positiveClassValue: string | number;
  positiveClassLabel: string;
  negativeClassValue: string | number;
  negativeClassLabel: string;
  
  // Data State
  rawRows: Record<string, any>[];
  columns: ColumnMetadata[];
  cleanRows: Record<string, any>[];
  transformedRows: Record<string, any>[];
  trainRows: Record<string, any>[];
  testRows: Record<string, any>[];
  
  // Pipeline Operations Record
  transformPipeline: {
    missingImputation: Record<string, string>;
    outlierTreatment: Record<string, string>;
    encodingApplied: Record<string, string>;
    standardizedColumns: string[];
  };
  
  // Model Settings
  selectedFeatures: string[];
  regularization: 'none' | 'l1' | 'l2';
  regLambda: number;
  trainTestSplitRatio: number; // e.g. 0.75
  randomSeed: number;
  classificationThreshold: number; // e.g. 0.5
  
  // Fitted Model Results
  coefficients: CoefficientRow[];
  fitMetrics: ModelFitMetrics | null;
  trainMetrics: ModelFitMetrics | null;
  testMetrics: ModelFitMetrics | null;
  confusionMatrix: ConfusionMatrixData | null;
  rocCurve: RocCurvePoint[];
  prCurve: PrecisionRecallPoint[];
  decileLift: DecileLiftRow[];
  calibrationCurve: CalibrationBin[];
  stepwiseHistory: StepwiseIteration[];
  cvResults: CrossValidationFoldResult[];
  savedModels: ModelComparisonSpec[];
  
  // Economic parameters
  costPerContact: number;
  benefitPerPositive: number;
  costFalsePositive: number;
  costFalseNegative: number;
  totalBudget: number;
}
