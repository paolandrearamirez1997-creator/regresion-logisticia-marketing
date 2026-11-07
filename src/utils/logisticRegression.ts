import {
  matrixTranspose,
  matrixMultiply,
  matrixVectorMultiply,
  matrixInverse,
  zPValue,
  chiSquarePValue,
  calculateNumericStats,
} from './mathStats';
import {
  CoefficientRow,
  ModelFitMetrics,
  ConfusionMatrixData,
  RocCurvePoint,
  PrecisionRecallPoint,
  DecileLiftRow,
  CalibrationBin,
  StepwiseIteration,
  CrossValidationFoldResult,
} from '../types/logit';

export interface FitResult {
  coefficients: CoefficientRow[];
  fitMetrics: ModelFitMetrics;
  confusionMatrix: ConfusionMatrixData;
  predictedProbs: number[];
  rocCurve: RocCurvePoint[];
  prCurve: PrecisionRecallPoint[];
  decileLift: DecileLiftRow[];
  calibrationCurve: CalibrationBin[];
  vifList: { variable: string; vif: number }[];
  influentialPoints: { index: number; cooksDistance: number; leverage: number; residual: number }[];
  isSeparationDetected: boolean;
}

/**
 * Fits a Binary Logistic Regression model using Iteratively Reweighted Least Squares (IRLS) / Newton-Raphson.
 * Supports L2 regularization (Ridge), computes full asymptotic covariance matrix, standard errors,
 * Wald z-statistics, p-values, 95% confidence intervals, and odds ratios.
 */
export function fitLogisticRegression(
  X_data: number[][], // rows x features (without intercept; intercept is added automatically)
  y_data: number[], // 0 or 1
  featureNames: string[],
  options: {
    regularization?: 'none' | 'l1' | 'l2';
    regLambda?: number;
    threshold?: number;
    maxIterations?: number;
    tolerance?: number;
  } = {}
): FitResult {
  const n = X_data.length;
  const p = featureNames.length;
  const threshold = options.threshold ?? 0.5;
  const maxIterations = options.maxIterations ?? 35;
  const tolerance = options.tolerance ?? 1e-6;
  const regLambda = options.regularization === 'l2' ? (options.regLambda ?? 0.01) : 0;

  if (n === 0 || p === 0) {
    throw new Error('Datos insuficientes para ajustar el modelo de regresión logística.');
  }

  // Construct Design Matrix X with leading column of 1s for the intercept
  const k = p + 1; // total parameters
  const X: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(k);
    row[0] = 1.0; // intercept
    for (let j = 0; j < p; j++) {
      row[j + 1] = X_data[i][j] ?? 0;
    }
    return row;
  });

  // Calculate base event rate and null log-likelihood
  let sumY = 0;
  for (let i = 0; i < n; i++) sumY += y_data[i];
  const yBar = Math.max(1e-6, Math.min(1 - 1e-6, sumY / n));
  const nullLogLikelihood = n * (yBar * Math.log(yBar) + (1 - yBar) * Math.log(1 - yBar));

  // Initialize beta with zeros (or log-odds for intercept)
  let beta: number[] = new Array(k).fill(0);
  beta[0] = Math.log(yBar / (1 - yBar));

  let probs: number[] = new Array(n).fill(0.5);
  let converged = false;
  let logLikelihood = nullLogLikelihood;
  let XT_W_X_inv: number[][] | null = null;
  let isSeparationDetected = false;

  // IRLS (Newton-Raphson) Iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    // 1. Calculate linear predictor z_i and probabilities p_i
    for (let i = 0; i < n; i++) {
      let zi = 0;
      for (let j = 0; j < k; j++) {
        zi += X[i][j] * beta[j];
      }
      // Clip z to prevent numerical overflow in exp(-z)
      const clampedZ = Math.max(-25, Math.min(25, zi));
      const pi = 1.0 / (1.0 + Math.exp(-clampedZ));
      probs[i] = Math.max(1e-15, Math.min(1 - 1e-15, pi));
    }

    // 2. Compute Log-Likelihood
    let currentLL = 0;
    for (let i = 0; i < n; i++) {
      const yi = y_data[i];
      const pi = probs[i];
      currentLL += yi * Math.log(pi) + (1 - yi) * Math.log(1 - pi);
    }
    if (regLambda > 0) {
      // Subtract L2 penalty on non-intercept coefficients
      let penalty = 0;
      for (let j = 1; j < k; j++) penalty += beta[j] * beta[j];
      currentLL -= 0.5 * regLambda * penalty;
    }

    // 3. Compute Gradient g = X^T (y - p) - lambda * beta
    const gradient = new Array(k).fill(0);
    for (let j = 0; j < k; j++) {
      let g_j = 0;
      for (let i = 0; i < n; i++) {
        g_j += X[i][j] * (y_data[i] - probs[i]);
      }
      if (regLambda > 0 && j > 0) {
        g_j -= regLambda * beta[j];
      }
      gradient[j] = g_j;
    }

    // 4. Compute Hessian H = X^T W X + lambda * I
    const H: number[][] = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < n; i++) {
      const wi = probs[i] * (1.0 - probs[i]);
      for (let r = 0; r < k; r++) {
        const x_ir = X[i][r];
        if (x_ir === 0) continue;
        const wx_ir = wi * x_ir;
        for (let c = r; c < k; c++) {
          H[r][c] += wx_ir * X[i][c];
        }
      }
    }
    // Symmetrize H and add regularization
    for (let r = 0; r < k; r++) {
      for (let c = r + 1; c < k; c++) {
        H[c][r] = H[r][c];
      }
      if (regLambda > 0 && r > 0) {
        H[r][r] += regLambda;
      } else {
        H[r][r] += 1e-9; // tiny ridge for numerical stability
      }
    }

    // Invert Hessian
    const H_inv = matrixInverse(H);
    if (!H_inv) {
      isSeparationDetected = true;
      break;
    }
    XT_W_X_inv = H_inv;

    // 5. Newton step: delta_beta = H^(-1) * g
    const deltaBeta = matrixVectorMultiply(H_inv, gradient);

    let maxChange = 0;
    for (let j = 0; j < k; j++) {
      beta[j] += deltaBeta[j];
      const absChange = Math.abs(deltaBeta[j]);
      if (absChange > maxChange) maxChange = absChange;
    }

    logLikelihood = currentLL;

    if (maxChange < tolerance) {
      converged = true;
      break;
    }
  }

  // Check for quasi-complete separation (extreme coefficients)
  for (let j = 0; j < k; j++) {
    if (Math.abs(beta[j]) > 15) {
      isSeparationDetected = true;
    }
  }

  // Ensure covariance matrix exists
  if (!XT_W_X_inv) {
    XT_W_X_inv = Array.from({ length: k }, (_, r) => {
      const row = new Array(k).fill(0);
      row[r] = 1.0;
      return row;
    });
  }

  // Build Coefficients table
  const allNames = ['(Intercepto)', ...featureNames];
  const coefficients: CoefficientRow[] = [];

  for (let j = 0; j < k; j++) {
    const varName = allNames[j];
    const b = beta[j];
    const var_j = Math.max(1e-12, XT_W_X_inv[j][j]);
    const se = Math.sqrt(var_j);
    const z = se > 0 ? b / se : 0;
    const pVal = zPValue(z);

    const ciLowerBeta = b - 1.95996 * se;
    const ciUpperBeta = b + 1.95996 * se;

    // Odds Ratio = exp(beta)
    // Guard against overflow when computing exp
    const clampedB = Math.max(-30, Math.min(30, b));
    const or = Math.exp(clampedB);
    const ciLowerOR = Math.exp(Math.max(-30, Math.min(30, ciLowerBeta)));
    const ciUpperOR = Math.exp(Math.max(-30, Math.min(30, ciUpperBeta)));

    let stars = 'ns';
    if (pVal < 0.001) stars = '***';
    else if (pVal < 0.01) stars = '**';
    else if (pVal < 0.05) stars = '*';
    else if (pVal < 0.1) stars = '·';

    coefficients.push({
      variable: varName,
      coef: b,
      stdErr: se,
      zStat: z,
      pValue: pVal,
      ciLowerBeta,
      ciUpperBeta,
      oddsRatio: or,
      ciLowerOR,
      ciUpperOR,
      significanceStars: stars,
    });
  }

  // Calculate Variance Inflation Factor (VIF) for features
  const vifList = calculateVIF(X_data, featureNames);
  vifList.forEach((vItem) => {
    const found = coefficients.find((c) => c.variable === vItem.variable);
    if (found) found.vif = vItem.vif;
  });

  // Calculate Global Fit Metrics
  const lrStat = Math.max(0, 2 * (logLikelihood - nullLogLikelihood));
  const lrPValue = chiSquarePValue(lrStat, p);
  const mcfaddenR2 = nullLogLikelihood !== 0 ? 1 - logLikelihood / nullLogLikelihood : 0;
  const adjMcFaddenR2 = nullLogLikelihood !== 0 ? 1 - (logLikelihood - k) / nullLogLikelihood : 0;

  // Cox-Snell and Nagelkerke R2
  const coxSnellR2 = 1 - Math.exp((-2 / n) * (logLikelihood - nullLogLikelihood));
  const maxCoxSnell = 1 - Math.exp((2 / n) * nullLogLikelihood);
  const nagelkerkeR2 = maxCoxSnell > 0 ? coxSnellR2 / maxCoxSnell : 0;

  const deviance = -2 * logLikelihood;
  const aic = 2 * k - 2 * logLikelihood;
  const bic = k * Math.log(n) - 2 * logLikelihood;

  // Confusion matrix & classification metrics at selected threshold
  const confusion = calculateConfusionMatrix(probs, y_data, threshold);
  const classMetrics = calculateMetricsFromConfusion(confusion);

  // ROC Curve & AUC
  const rocCurve = computeRocCurve(probs, y_data);
  const auc = calculateAreaUnderCurve(rocCurve.map((pt) => ({ x: pt.fpr, y: pt.tpr })));

  // Precision-Recall Curve & Average Precision
  const prCurve = computePrecisionRecallCurve(probs, y_data);
  const averagePrecision = calculateAreaUnderCurve(prCurve.map((pt) => ({ x: pt.recall, y: pt.precision })));

  // Brier Score
  let brierSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = probs[i] - y_data[i];
    brierSum += diff * diff;
  }
  const brierScore = brierSum / n;

  // Decile Lift & Gains Table
  const decileLift = computeDecileLift(probs, y_data);

  // Calibration curve
  const calibrationCurve = computeCalibrationBins(probs, y_data, 10);

  // High influence & Cook's distance diagnostics
  const influentialPoints = computeInfluence(X, probs, y_data, XT_W_X_inv, k);

  const fitMetrics: ModelFitMetrics = {
    nObs: n,
    trainSize: n,
    testSize: 0,
    kParameters: k,
    logLikelihood,
    nullLogLikelihood,
    lrStat,
    lrPValue,
    mcfaddenR2: Math.max(0, Math.min(1, mcfaddenR2)),
    adjMcFaddenR2: Math.max(0, Math.min(1, adjMcFaddenR2)),
    coxSnellR2: Math.max(0, Math.min(1, coxSnellR2)),
    nagelkerkeR2: Math.max(0, Math.min(1, nagelkerkeR2)),
    deviance,
    aic,
    bic,
    auc,
    averagePrecision,
    brierScore,
    threshold,
    ...classMetrics,
  };

  return {
    coefficients,
    fitMetrics,
    confusionMatrix: confusion,
    predictedProbs: probs,
    rocCurve,
    prCurve,
    decileLift,
    calibrationCurve,
    vifList,
    influentialPoints,
    isSeparationDetected,
  };
}

/**
 * Predicts probability for a given feature vector
 */
export function predictProbability(coefficients: CoefficientRow[], features: Record<string, number>): number {
  let z = 0;
  for (const c of coefficients) {
    if (c.variable === '(Intercepto)') {
      z += c.coef;
    } else if (features[c.variable] !== undefined) {
      z += c.coef * features[c.variable];
    }
  }
  const clampedZ = Math.max(-25, Math.min(25, z));
  return 1.0 / (1.0 + Math.exp(-clampedZ));
}

// -------------------------------------------------------------
// METRICS & EVALUATION FUNCTIONS
// -------------------------------------------------------------

export function calculateConfusionMatrix(probs: number[], actual: number[], threshold = 0.5): ConfusionMatrixData {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  const n = probs.length;

  for (let i = 0; i < n; i++) {
    const pred = probs[i] >= threshold ? 1 : 0;
    const act = actual[i] === 1 ? 1 : 0;
    if (pred === 1 && act === 1) tp++;
    else if (pred === 0 && act === 0) tn++;
    else if (pred === 1 && act === 0) fp++;
    else if (pred === 0 && act === 1) fn++;
  }

  return { tp, tn, fp, fn, total: n };
}

export function calculateMetricsFromConfusion(cm: ConfusionMatrixData) {
  const { tp, tn, fp, fn, total } = cm;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0; // Sensitivity
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const balancedAccuracy = (recall + specificity) / 2;
  const totalErrorRate = total > 0 ? (fp + fn) / total : 0;
  const npv = tn + fn > 0 ? tn / (tn + fn) : 0;
  const youdenJ = recall + specificity - 1;

  return {
    accuracy,
    precision,
    recall,
    specificity,
    f1,
    balancedAccuracy,
    totalErrorRate,
    npv,
    youdenJ,
  };
}

/**
 * Computes ROC Curve points across threshold sweeps
 */
export function computeRocCurve(probs: number[], actual: number[]): RocCurvePoint[] {
  const n = probs.length;
  let totalPos = 0;
  for (let i = 0; i < n; i++) if (actual[i] === 1) totalPos++;
  const totalNeg = n - totalPos;

  if (totalPos === 0 || totalNeg === 0) {
    return [
      { threshold: 1, tpr: 0, fpr: 0, sensitivity: 0, specificity: 1, youdenJ: 0 },
      { threshold: 0, tpr: 1, fpr: 1, sensitivity: 1, specificity: 0, youdenJ: 0 },
    ];
  }

  // Sort by probability descending
  const indices = Array.from({ length: n }, (_, i) => i).sort((a, b) => probs[b] - probs[a]);

  const points: RocCurvePoint[] = [];
  points.push({ threshold: 1.0, tpr: 0, fpr: 0, sensitivity: 0, specificity: 1, youdenJ: 0 });

  let curTP = 0;
  let curFP = 0;

  for (let idx = 0; idx < n; idx++) {
    const i = indices[idx];
    if (actual[i] === 1) curTP++;
    else curFP++;

    const isLast = idx === n - 1;
    const nextDiff = isLast || probs[i] !== probs[indices[idx + 1]];

    if (nextDiff) {
      const tpr = curTP / totalPos;
      const fpr = curFP / totalNeg;
      const sensitivity = tpr;
      const specificity = 1 - fpr;
      const youdenJ = sensitivity + specificity - 1;
      points.push({
        threshold: probs[i],
        tpr,
        fpr,
        sensitivity,
        specificity,
        youdenJ,
      });
    }
  }

  points.push({ threshold: 0.0, tpr: 1, fpr: 1, sensitivity: 1, specificity: 0, youdenJ: 0 });
  return points;
}

/**
 * Computes Precision-Recall Curve points
 */
export function computePrecisionRecallCurve(probs: number[], actual: number[]): PrecisionRecallPoint[] {
  const n = probs.length;
  let totalPos = 0;
  for (let i = 0; i < n; i++) if (actual[i] === 1) totalPos++;

  if (totalPos === 0) {
    return [{ threshold: 0.5, precision: 0, recall: 0 }];
  }

  const indices = Array.from({ length: n }, (_, i) => i).sort((a, b) => probs[b] - probs[a]);
  const points: PrecisionRecallPoint[] = [];

  let curTP = 0;
  let curFP = 0;

  for (let idx = 0; idx < n; idx++) {
    const i = indices[idx];
    if (actual[i] === 1) curTP++;
    else curFP++;

    const isLast = idx === n - 1;
    const nextDiff = isLast || probs[i] !== probs[indices[idx + 1]];

    if (nextDiff) {
      const recall = curTP / totalPos;
      const precision = curTP / (curTP + curFP);
      points.push({
        threshold: probs[i],
        precision,
        recall,
      });
    }
  }

  return points;
}

/**
 * Calculates Area Under Curve using Trapezoidal integration
 */
export function calculateAreaUnderCurve(pts: { x: number; y: number }[]): number {
  if (pts.length < 2) return 0.5;
  // Sort by x ascending
  const sorted = [...pts].sort((a, b) => a.x - b.x);
  let area = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].x - sorted[i - 1].x;
    const avgY = (sorted[i].y + sorted[i - 1].y) / 2;
    area += dx * avgY;
  }
  return Math.max(0, Math.min(1.0, area));
}

/**
 * Decile Lift & Cumulative Gains Table (Reproducing R's ROCR / lift package logic)
 */
export function computeDecileLift(probs: number[], actual: number[]): DecileLiftRow[] {
  const n = probs.length;
  if (n === 0) return [];

  let totalPositives = 0;
  for (let i = 0; i < n; i++) if (actual[i] === 1) totalPositives++;
  const overallRate = totalPositives / n;

  // Sort descending by predicted probability
  const indices = Array.from({ length: n }, (_, i) => i).sort((a, b) => probs[b] - probs[a]);

  const rows: DecileLiftRow[] = [];
  const decileSize = Math.ceil(n / 10);
  let cumulativePositives = 0;
  let cumulativeTotal = 0;

  for (let d = 1; d <= 10; d++) {
    const startIdx = (d - 1) * decileSize;
    const endIdx = Math.min(n, d * decileSize);
    const countInDecile = Math.max(0, endIdx - startIdx);

    let posInDecile = 0;
    for (let idx = startIdx; idx < endIdx; idx++) {
      if (actual[indices[idx]] === 1) posInDecile++;
    }

    const negInDecile = countInDecile - posInDecile;
    cumulativePositives += posInDecile;
    cumulativeTotal += countInDecile;

    const responseRate = countInDecile > 0 ? (posInDecile / countInDecile) * 100 : 0;
    const cumCaptureRate = totalPositives > 0 ? (cumulativePositives / totalPositives) * 100 : 0;

    const nonCumLift = overallRate > 0 && countInDecile > 0 ? (posInDecile / countInDecile) / overallRate : 1.0;
    const cumLift =
      overallRate > 0 && cumulativeTotal > 0
        ? (cumulativePositives / cumulativeTotal) / overallRate
        : 1.0;

    rows.push({
      decile: d,
      totalCount: countInDecile,
      positives: posInDecile,
      negatives: negInDecile,
      responseRate,
      cumTotal: cumulativeTotal,
      cumPositives: cumulativePositives,
      cumCaptureRate,
      cumLift,
      nonCumLift,
    });
  }

  return rows;
}

/**
 * Calibration Bins (Reliability diagram / Deciles of risk)
 */
export function computeCalibrationBins(probs: number[], actual: number[], numBins = 10): CalibrationBin[] {
  const n = probs.length;
  if (n === 0) return [];

  // Sort by probability ascending
  const indices = Array.from({ length: n }, (_, i) => i).sort((a, b) => probs[a] - probs[b]);
  const binSize = Math.ceil(n / numBins);
  const bins: CalibrationBin[] = [];

  for (let b = 1; b <= numBins; b++) {
    const start = (b - 1) * binSize;
    const end = Math.min(n, b * binSize);
    const count = end - start;
    if (count <= 0) continue;

    let sumP = 0;
    let sumAct = 0;
    for (let idx = start; idx < end; idx++) {
      const i = indices[idx];
      sumP += probs[i];
      sumAct += actual[i];
    }

    bins.push({
      decile: b,
      meanPredicted: sumP / count,
      observedFraction: sumAct / count,
      count,
    });
  }

  return bins;
}

/**
 * Computes Variance Inflation Factor (VIF) by regressing each feature on the others
 */
export function calculateVIF(X_data: number[][], featureNames: string[]): { variable: string; vif: number }[] {
  const n = X_data.length;
  const p = featureNames.length;
  if (p <= 1 || n <= p + 1) {
    return featureNames.map((name) => ({ variable: name, vif: 1.0 }));
  }

  const results: { variable: string; vif: number }[] = [];

  for (let targetIdx = 0; targetIdx < p; targetIdx++) {
    // Target is column targetIdx
    const y: number[] = new Array(n);
    for (let i = 0; i < n; i++) y[i] = X_data[i][targetIdx];

    // Predictors are other columns + constant 1
    const otherColsCount = p - 1;
    const X_sub: number[][] = Array.from({ length: n }, (_, i) => {
      const row = new Array(otherColsCount + 1);
      row[0] = 1.0;
      let colIdx = 1;
      for (let j = 0; j < p; j++) {
        if (j !== targetIdx) {
          row[colIdx++] = X_data[i][j];
        }
      }
      return row;
    });

    // OLS: beta = (X^T X)^(-1) X^T y
    const XT = matrixTranspose(X_sub);
    const XTX = matrixMultiply(XT, X_sub);
    // Add small ridge to avoid singularity in collinear data
    for (let r = 0; r < XTX.length; r++) XTX[r][r] += 1e-7;

    const invXTX = matrixInverse(XTX);
    if (!invXTX) {
      results.push({ variable: featureNames[targetIdx], vif: 99.9 });
      continue;
    }

    const XTy = matrixVectorMultiply(XT, y);
    const beta_ols = matrixVectorMultiply(invXTX, XTy);

    // Compute R2 of this regression
    let meanY = 0;
    for (let i = 0; i < n; i++) meanY += y[i];
    meanY /= n;

    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      let yPred = 0;
      for (let j = 0; j < X_sub[i].length; j++) {
        yPred += X_sub[i][j] * beta_ols[j];
      }
      const dy = y[i] - meanY;
      const res = y[i] - yPred;
      ssTot += dy * dy;
      ssRes += res * res;
    }

    const r2 = ssTot > 0 ? Math.max(0, Math.min(0.9999, 1 - ssRes / ssTot)) : 0;
    const vif = 1 / Math.max(0.0001, 1 - r2);

    results.push({
      variable: featureNames[targetIdx],
      vif: Math.min(100, vif),
    });
  }

  return results;
}

/**
 * Computes Cook's Distance and Leverage for outlier and influence diagnostics
 */
export function computeInfluence(
  X: number[][],
  probs: number[],
  actual: number[],
  XT_W_X_inv: number[][],
  k: number
): { index: number; cooksDistance: number; leverage: number; residual: number }[] {
  const n = X.length;
  const results: { index: number; cooksDistance: number; leverage: number; residual: number }[] = [];

  for (let i = 0; i < n; i++) {
    const pi = probs[i];
    const wi = pi * (1.0 - pi);
    const yi = actual[i];

    // Leverage h_ii = w_i * x_i^T * (X^T W X)^(-1) * x_i
    let xi_inv: number[] = new Array(k).fill(0);
    for (let c = 0; c < k; c++) {
      let sum = 0;
      for (let r = 0; r < k; r++) {
        sum += X[i][r] * XT_W_X_inv[r][c];
      }
      xi_inv[c] = sum;
    }

    let hii = 0;
    for (let c = 0; c < k; c++) {
      hii += xi_inv[c] * X[i][c];
    }
    hii = Math.max(1e-6, Math.min(0.999, wi * hii));

    // Standardized Pearson residual
    const seRes = Math.sqrt(Math.max(1e-12, wi * (1 - hii)));
    const pearsonRes = (yi - pi) / seRes;

    // Cook's Distance D_i = (r_i^2 * h_ii) / (k * (1 - h_ii)^2)
    const cooksD = (pearsonRes * pearsonRes * hii) / (k * Math.pow(1 - hii, 2));

    results.push({
      index: i + 1,
      cooksDistance: Math.max(0, cooksD),
      leverage: hii,
      residual: pearsonRes,
    });
  }

  return results;
}

// -------------------------------------------------------------
// STEPWISE AUTOMATIC SELECTION (Forward, Backward, Both)
// -------------------------------------------------------------

export function runStepwiseSelection(
  X_data: number[][],
  y_data: number[],
  allFeatureNames: string[],
  direction: 'both' | 'forward' | 'backward' = 'both',
  criterion: 'aic' | 'bic' = 'aic'
): {
  finalFeatures: string[];
  iterations: StepwiseIteration[];
} {
  const p = allFeatureNames.length;
  let activeFeatures: string[] =
    direction === 'forward' ? [] : [...allFeatureNames];

  const iterations: StepwiseIteration[] = [];
  let step = 0;

  // Helper to fit candidate subset
  const fitSubset = (names: string[]) => {
    if (names.length === 0) {
      // Intercept-only model
      let sumY = 0;
      const n = y_data.length;
      for (let i = 0; i < n; i++) sumY += y_data[i];
      const yBar = Math.max(1e-6, Math.min(1 - 1e-6, sumY / n));
      const nullLL = n * (yBar * Math.log(yBar) + (1 - yBar) * Math.log(1 - yBar));
      const aic = 2 * 1 - 2 * nullLL;
      const bic = 1 * Math.log(n) - 2 * nullLL;
      return { aic, bic, ll: nullLL };
    }
    const subIndices = names.map((name) => allFeatureNames.indexOf(name));
    const subX = X_data.map((row) => subIndices.map((idx) => row[idx]));
    const fit = fitLogisticRegression(subX, y_data, names);
    return { aic: fit.fitMetrics.aic, bic: fit.fitMetrics.bic, ll: fit.fitMetrics.logLikelihood };
  };

  let currentFit = fitSubset(activeFeatures);
  let currentScore = criterion === 'aic' ? currentFit.aic : currentFit.bic;

  iterations.push({
    step: 0,
    action: 'START',
    variableName: activeFeatures.length === 0 ? 'Modelo nulo (solo intercepto)' : 'Modelo completo inicial',
    direction,
    aic: currentFit.aic,
    bic: currentFit.bic,
    pValCriterion: 0,
    activeVariables: [...activeFeatures],
    rationale: `Punto de partida con ${activeFeatures.length} variables. ${criterion.toUpperCase()} = ${currentScore.toFixed(2)}`,
  });

  const maxSteps = p * 2;

  while (step < maxSteps) {
    step++;
    let bestScore = currentScore;
    let bestAction: 'ADD' | 'REMOVE' | null = null;
    let bestVar: string | null = null;

    // Check additions (if forward or both)
    if (direction === 'forward' || direction === 'both') {
      const candidates = allFeatureNames.filter((f) => !activeFeatures.includes(f));
      for (const cand of candidates) {
        const testSet = [...activeFeatures, cand];
        const testFit = fitSubset(testSet);
        const testScore = criterion === 'aic' ? testFit.aic : testFit.bic;
        if (testScore < bestScore - 0.05) {
          bestScore = testScore;
          bestAction = 'ADD';
          bestVar = cand;
        }
      }
    }

    // Check removals (if backward or both)
    if (direction === 'backward' || direction === 'both') {
      for (const cand of activeFeatures) {
        const testSet = activeFeatures.filter((f) => f !== cand);
        const testFit = fitSubset(testSet);
        const testScore = criterion === 'aic' ? testFit.aic : testFit.bic;
        if (testScore < bestScore - 0.05) {
          bestScore = testScore;
          bestAction = 'REMOVE';
          bestVar = cand;
        }
      }
    }

    // Check if an improvement was found
    if (!bestAction || !bestVar) {
      iterations.push({
        step,
        action: 'STOP',
        variableName: 'Criterio de convergencia',
        direction,
        aic: currentFit.aic,
        bic: currentFit.bic,
        pValCriterion: 0,
        activeVariables: [...activeFeatures],
        rationale: `Ninguna incorporación o exclusión reduce el ${criterion.toUpperCase()} en al menos 0.05 puntos. Parada óptima alcanzada.`,
      });
      break;
    }

    // Apply best move
    if (bestAction === 'ADD') {
      activeFeatures.push(bestVar);
      currentFit = fitSubset(activeFeatures);
      currentScore = criterion === 'aic' ? currentFit.aic : currentFit.bic;
      iterations.push({
        step,
        action: 'ADD',
        variableName: bestVar,
        direction,
        aic: currentFit.aic,
        bic: currentFit.bic,
        pValCriterion: 0,
        activeVariables: [...activeFeatures],
        rationale: `Se incorporó "${bestVar}" logrando una reducción de ${criterion.toUpperCase()} de ${(currentScore - bestScore).toFixed(2)} puntos.`,
      });
    } else {
      activeFeatures = activeFeatures.filter((f) => f !== bestVar);
      currentFit = fitSubset(activeFeatures);
      currentScore = criterion === 'aic' ? currentFit.aic : currentFit.bic;
      iterations.push({
        step,
        action: 'REMOVE',
        variableName: bestVar,
        direction,
        aic: currentFit.aic,
        bic: currentFit.bic,
        pValCriterion: 0,
        activeVariables: [...activeFeatures],
        rationale: `Se eliminó "${bestVar}" por redundancia estadística, mejorando el ${criterion.toUpperCase()} a ${currentScore.toFixed(2)}.`,
      });
    }
  }

  return {
    finalFeatures: activeFeatures,
    iterations,
  };
}

// -------------------------------------------------------------
// STRATIFIED K-FOLD CROSS VALIDATION
// -------------------------------------------------------------

export function runStratifiedCrossValidation(
  X_data: number[][],
  y_data: number[],
  featureNames: string[],
  kFolds = 5
): CrossValidationFoldResult[] {
  const n = y_data.length;
  const posIndices: number[] = [];
  const negIndices: number[] = [];

  for (let i = 0; i < n; i++) {
    if (y_data[i] === 1) posIndices.push(i);
    else negIndices.push(i);
  }

  // Shuffle deterministic
  const shuffle = (arr: number[]) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = (i * 37 + 11) % (i + 1);
      const tmp = res[i];
      res[i] = res[j];
      res[j] = tmp;
    }
    return res;
  };

  const shuffPos = shuffle(posIndices);
  const shuffNeg = shuffle(negIndices);

  const foldBuckets: number[][] = Array.from({ length: kFolds }, () => []);

  shuffPos.forEach((idx, i) => foldBuckets[i % kFolds].push(idx));
  shuffNeg.forEach((idx, i) => foldBuckets[i % kFolds].push(idx));

  const results: CrossValidationFoldResult[] = [];

  for (let f = 0; f < kFolds; f++) {
    const valIndices = foldBuckets[f];
    const trainIndices = foldBuckets.filter((_, idx) => idx !== f).flat();

    const trainX = trainIndices.map((i) => X_data[i]);
    const trainY = trainIndices.map((i) => y_data[i]);
    const valX = valIndices.map((i) => X_data[i]);
    const valY = valIndices.map((i) => y_data[i]);

    try {
      const model = fitLogisticRegression(trainX, trainY, featureNames);
      // Score validation fold
      const valProbs = valX.map((row) => {
        const featObj: Record<string, number> = {};
        featureNames.forEach((name, idx) => {
          featObj[name] = row[idx];
        });
        return predictProbability(model.coefficients, featObj);
      });

      const roc = computeRocCurve(valProbs, valY);
      const auc = calculateAreaUnderCurve(roc.map((p) => ({ x: p.fpr, y: p.tpr })));
      const cm = calculateConfusionMatrix(valProbs, valY, 0.5);
      const acc = (cm.tp + cm.tn) / (cm.total || 1);

      let brier = 0;
      let logLoss = 0;
      for (let i = 0; i < valY.length; i++) {
        const p_i = Math.max(1e-15, Math.min(1 - 1e-15, valProbs[i]));
        const y_i = valY[i];
        brier += Math.pow(p_i - y_i, 2);
        logLoss -= y_i * Math.log(p_i) + (1 - y_i) * Math.log(1 - p_i);
      }
      brier /= valY.length;
      logLoss /= valY.length;

      results.push({
        fold: f + 1,
        trainSize: trainIndices.length,
        valSize: valIndices.length,
        auc,
        accuracy: acc,
        logLoss,
        brierScore: brier,
      });
    } catch {
      results.push({
        fold: f + 1,
        trainSize: trainIndices.length,
        valSize: valIndices.length,
        auc: 0.5,
        accuracy: 0.5,
        logLoss: 0.693,
        brierScore: 0.25,
      });
    }
  }

  return results;
}
