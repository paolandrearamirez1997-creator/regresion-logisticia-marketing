/**
 * Mathematical and Statistical computation library for Econometrics and GLM Logistic Regression.
 * Includes exact Maximum Likelihood equations, matrix operations, statistical distributions,
 * and hypothesis testing routines.
 */

// Lanczos approximation coefficients for log-gamma
const LANCZOS_G = 7;
const LANCZOS_COEFFS = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.32342877765313,
  -176.61502916214059,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7,
];

export function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = LANCZOS_COEFFS[0];
  for (let i = 1; i < LANCZOS_G + 2; i++) {
    x += LANCZOS_COEFFS[i] / (z + i);
  }
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Incomplete Gamma function P(a, x) = gamma(a, x) / Gamma(a)
export function lowerIncompleteGamma(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    // Series expansion
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-12 * Math.abs(sum)) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  } else {
    // Continued fraction expansion Q(a, x), then 1 - Q
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 100; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    const q = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    return Math.max(0, Math.min(1, 1 - q));
  }
}

/**
 * Cumulative Distribution Function for Chi-Square distribution:
 * P(X <= x) with k degrees of freedom.
 */
export function chiSquareCdf(x: number, df: number): number {
  if (x <= 0) return 0;
  if (df <= 0) return 0;
  return lowerIncompleteGamma(df / 2, x / 2);
}

/**
 * P-value for Chi-Square test with df degrees of freedom: P(X >= x)
 */
export function chiSquarePValue(x: number, df: number): number {
  if (x <= 0) return 1;
  const cdf = chiSquareCdf(x, df);
  return Math.max(0, Math.min(1, 1 - cdf));
}

/**
 * Error Function erf(x) via Chebyshev fitting
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/**
 * Standard Normal CDF Phi(z)
 */
export function normalCdf(z: number): number {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

/**
 * Two-tailed p-value for a z-score
 */
export function zPValue(z: number): number {
  if (isNaN(z)) return 1.0;
  const absZ = Math.abs(z);
  const p = 2.0 * (1.0 - normalCdf(absZ));
  return Math.max(0, Math.min(1, p));
}

// -------------------------------------------------------------
// LINEAR ALGEBRA & MATRIX COMPUTATION
// -------------------------------------------------------------

export function matrixTranspose(A: number[][]): number[][] {
  const rows = A.length;
  if (rows === 0) return [];
  const cols = A[0].length;
  const AT: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      AT[j][i] = A[i][j];
    }
  }
  return AT;
}

export function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix multiplication dimension mismatch: ${rowsA}x${colsA} and ${rowsB}x${colsB}`);
  }

  const C: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const aik = A[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < colsB; j++) {
        C[i][j] += aik * B[k][j];
      }
    }
  }
  return C;
}

export function matrixVectorMultiply(A: number[][], x: number[]): number[] {
  const rows = A.length;
  const cols = A[0].length;
  const result: number[] = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * x[j];
    }
    result[i] = sum;
  }
  return result;
}

/**
 * Matrix Inversion using Gauss-Jordan elimination with partial pivoting.
 * Includes ridge stabilization epsilon for near-singular matrices.
 */
export function matrixInverse(A: number[][], epsilon = 1e-12): number[][] | null {
  const n = A.length;
  if (n === 0 || A[0].length !== n) return null;

  // Augmented matrix [A | I]
  const M: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(2 * n).fill(0);
    for (let j = 0; j < n; j++) {
      row[j] = A[i][j];
    }
    row[n + i] = 1.0;
    return row;
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < n; r++) {
      const val = Math.abs(M[r][i]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }

    if (maxVal < epsilon) {
      // Near singular: add small regularizer to diagonal
      M[i][i] += 1e-6;
    }

    if (maxRow !== i) {
      const tmp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = tmp;
    }

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-15) {
      return null;
    }

    // Scale row
    for (let j = 0; j < 2 * n; j++) {
      M[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = M[r][i];
      if (Math.abs(factor) < 1e-15) continue;
      for (let j = 0; j < 2 * n; j++) {
        M[r][j] -= factor * M[i][j];
      }
    }
  }

  // Extract right half
  const inv: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      row[j] = M[i][n + j];
    }
    return row;
  });

  return inv;
}

// -------------------------------------------------------------
// DESCRIPTIVE STATISTICS
// -------------------------------------------------------------

export function calculateNumericStats(values: number[]): {
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
  cv: number;
  skewness: number;
  kurtosis: number;
} {
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  const n = valid.length;
  if (n === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      mode: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      p25: 0,
      p75: 0,
      iqr: 0,
      cv: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }

  const sorted = [...valid].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];

  let sum = 0;
  for (let i = 0; i < n; i++) sum += sorted[i];
  const mean = sum / n;

  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Percentiles
  const p25 = getPercentile(sorted, 0.25);
  const p75 = getPercentile(sorted, 0.75);
  const iqr = p75 - p25;

  // Mode
  const counts: Record<number, number> = {};
  let maxCount = 0;
  let mode = sorted[0];
  for (const val of sorted) {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      mode = val;
    }
  }

  // Variance & Moments
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of sorted) {
    const diff = v - mean;
    const diff2 = diff * diff;
    m2 += diff2;
    m3 += diff2 * diff;
    m4 += diff2 * diff2;
  }

  const variance = n > 1 ? m2 / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  // Sample Skewness and Kurtosis
  let skewness = 0;
  let kurtosis = 0;
  if (n > 2 && stdDev > 0) {
    const s3 = Math.pow(stdDev, 3);
    skewness = (n / ((n - 1) * (n - 2))) * (m3 / s3);
  }
  if (n > 3 && stdDev > 0) {
    const s4 = Math.pow(stdDev, 4);
    kurtosis =
      ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * (m4 / s4) -
      (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  return {
    count: n,
    mean,
    median,
    mode,
    stdDev,
    variance,
    min,
    max,
    p25,
    p75,
    iqr,
    cv,
    skewness,
    kurtosis,
  };
}

export function getPercentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const idx = p * (n - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculates Pearson correlation coefficient between two numeric arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let sumX = 0,
    sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0,
    denX = 0,
    denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

/**
 * Calculates Cramér's V association metric for 2xK categorical vs binary target contingency table
 */
export function calculateCramersV(table: number[][]): number {
  const r = table.length;
  if (r === 0) return 0;
  const c = table[0].length;
  if (c === 0) return 0;

  let grandTotal = 0;
  const rowSums = new Array(r).fill(0);
  const colSums = new Array(c).fill(0);

  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const v = table[i][j];
      grandTotal += v;
      rowSums[i] += v;
      colSums[j] += v;
    }
  }

  if (grandTotal === 0) return 0;

  let chi2 = 0;
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const expected = (rowSums[i] * colSums[j]) / grandTotal;
      if (expected > 0) {
        const diff = table[i][j] - expected;
        chi2 += (diff * diff) / expected;
      }
    }
  }

  const minDim = Math.min(r - 1, c - 1);
  if (minDim <= 0) return 0;

  const v = Math.sqrt(chi2 / (grandTotal * minDim));
  return Math.min(1.0, Math.max(0, v));
}
