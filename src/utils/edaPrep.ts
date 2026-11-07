import {
  ColumnMetadata,
  VariableType,
  DescriptiveStatsNumeric,
  DescriptiveStatsCategoric,
  BivariateAnalysis,
} from '../types/logit';
import {
  calculateNumericStats,
  calculateCorrelation,
  calculateCramersV,
  zPValue,
} from './mathStats';

/**
 * Automatically infers variable taxonomy from sample data
 */
export function inferColumnMetadata(rows: Record<string, any>[]): ColumnMetadata[] {
  if (rows.length === 0) return [];
  const colNames = Object.keys(rows[0]);
  const n = rows.length;

  return colNames.map((name) => {
    let missingCount = 0;
    const values: any[] = [];
    const uniqueSet = new Set<any>();

    for (let i = 0; i < n; i++) {
      const val = rows[i][name];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        missingCount++;
      } else {
        values.push(val);
        uniqueSet.add(val);
      }
    }

    const uniqueCount = uniqueSet.size;
    const missingPct = n > 0 ? (missingCount / n) * 100 : 0;
    const sampleVals = Array.from(uniqueSet).slice(0, 5);

    // Type detection heuristics
    let type: VariableType = 'categorical_nominal';
    let originalType = 'string';

    const numParsed = values.filter((v) => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));
    const isMostlyNumeric = numParsed.length / (values.length || 1) >= 0.9;

    const lowerName = name.toLowerCase();
    const isIdName = lowerName.includes('id') || lowerName.includes('codigo') || lowerName.includes('rut') || lowerName.includes('uuid');

    if (uniqueCount === 2) {
      type = 'binary';
      originalType = 'boolean/binary';
    } else if (isIdName && uniqueCount > n * 0.8) {
      type = 'identifier';
      originalType = 'identifier';
    } else if (isMostlyNumeric) {
      originalType = 'numeric';
      if (uniqueCount <= 10 && Number.isInteger(Number(values[0]))) {
        type = 'numeric_discrete';
      } else {
        type = 'numeric_continuous';
      }
    } else {
      // Check date format
      const dateCheck = Date.parse(String(values[0]));
      if (!isNaN(dateCheck) && String(values[0]).length >= 8 && (String(values[0]).includes('-') || String(values[0]).includes('/'))) {
        type = 'date';
        originalType = 'date';
      } else {
        type = uniqueCount <= 7 ? 'categorical_nominal' : 'categorical_nominal';
        originalType = 'string';
      }
    }

    return {
      name,
      type,
      originalType,
      missingCount,
      missingPct,
      uniqueValuesCount: uniqueCount,
      sampleValues: sampleVals,
      isExcluded: type === 'identifier' || type === 'date',
      isTarget: false,
    };
  });
}

/**
 * Computes descriptive statistics for a quantitative variable
 */
export function getNumericStats(rows: Record<string, any>[], colName: string): DescriptiveStatsNumeric {
  const nums = rows.map((r) => Number(r[colName])).filter((v) => !isNaN(v) && isFinite(v));
  return calculateNumericStats(nums);
}

/**
 * Computes descriptive statistics for a categorical variable
 */
export function getCategoricalStats(rows: Record<string, any>[], colName: string): DescriptiveStatsCategoric {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const r of rows) {
    const val = r[colName] !== null && r[colName] !== undefined && r[colName] !== '' ? String(r[colName]) : '(Faltante)';
    counts[val] = (counts[val] || 0) + 1;
    total++;
  }

  const table = Object.entries(counts)
    .map(([cat, cnt]) => ({
      category: cat,
      count: cnt,
      pct: total > 0 ? (cnt / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const modeCategory = table[0]?.category || 'N/A';
  const modeCount = table[0]?.count || 0;
  const modePct = table[0]?.pct || 0;

  return {
    count: total,
    cardinality: table.length,
    modeCategory,
    modeCount,
    modePct,
    frequencyTable: table,
  };
}

/**
 * Runs Bivariate Analysis comparing independent predictor against binary target variable
 */
export function performBivariateAnalysis(
  rows: Record<string, any>[],
  varName: string,
  varType: VariableType,
  targetName: string,
  posLabel: string,
  negLabel: string
): BivariateAnalysis {
  const isNumeric = varType === 'numeric_continuous' || varType === 'numeric_discrete';

  if (isNumeric) {
    const g0: number[] = [];
    const g1: number[] = [];
    const allX: number[] = [];
    const allY: number[] = [];

    for (const r of rows) {
      const x = Number(r[varName]);
      const y = Number(r[targetName]);
      if (!isNaN(x) && !isNaN(y)) {
        allX.push(x);
        allY.push(y);
        if (y === 1) g1.push(x);
        else g0.push(x);
      }
    }

    const stats0 = calculateNumericStats(g0);
    const stats1 = calculateNumericStats(g1);
    const diff = stats1.mean - stats0.mean;

    // Welch's t-statistic
    const seDiff = Math.sqrt(
      (stats0.variance / (stats0.count || 1)) + (stats1.variance / (stats1.count || 1))
    );
    const tStat = seDiff > 0 ? diff / seDiff : 0;
    const pVal = zPValue(tStat);
    const corr = calculateCorrelation(allX, allY);

    const isSignificant = pVal < 0.05;
    const direction = diff > 0 ? 'mayor' : 'menor';
    const summaryNarrative = isSignificant
      ? `Existe asociación estadística significativa (p = ${pVal < 0.001 ? '<0.001' : pVal.toFixed(3)}): las observaciones de "${posLabel}" presentan un valor promedio significativamente ${direction} (${stats1.mean.toFixed(2)}) comparado con "${negLabel}" (${stats0.mean.toFixed(2)}). Correlación lineal r = ${corr.toFixed(3)}.`
      : `No se observa diferencia estadísticamente concluyente (p = ${pVal.toFixed(3)}) entre las medias de "${posLabel}" (${stats1.mean.toFixed(2)}) y "${negLabel}" (${stats0.mean.toFixed(2)}).`;

    return {
      variable: varName,
      isNumeric: true,
      group0Mean: stats0.mean,
      group1Mean: stats1.mean,
      diffMean: diff,
      tStat,
      pValTTest: pVal,
      correlationWithTarget: corr,
      summaryNarrative,
    };
  } else {
    // Categorical contingency table
    const tableMap: Record<string, { count0: number; count1: number }> = {};
    for (const r of rows) {
      const cat = r[varName] !== null && r[varName] !== undefined && r[varName] !== '' ? String(r[varName]) : '(Faltante)';
      const y = Number(r[targetName]);
      if (!tableMap[cat]) tableMap[cat] = { count0: 0, count1: 0 };
      if (y === 1) tableMap[cat].count1++;
      else tableMap[cat].count0++;
    }

    const contingencyTable = Object.entries(tableMap).map(([cat, counts]) => {
      const totalCat = counts.count0 + counts.count1;
      return {
        category: cat,
        count0: counts.count0,
        count1: counts.count1,
        ratePositive: totalCat > 0 ? (counts.count1 / totalCat) * 100 : 0,
      };
    });

    const matrix2xK = [
      contingencyTable.map((t) => t.count0),
      contingencyTable.map((t) => t.count1),
    ];
    const cramersV = calculateCramersV(matrix2xK);

    let strength = 'débil';
    if (cramersV > 0.3) strength = 'fuerte';
    else if (cramersV > 0.15) strength = 'moderada';

    const maxRateCat = [...contingencyTable].sort((a, b) => b.ratePositive - a.ratePositive)[0];
    const minRateCat = [...contingencyTable].sort((a, b) => a.ratePositive - b.ratePositive)[0];

    const summaryNarrative = `La asociación nominal alcanza una V de Cramér de ${cramersV.toFixed(3)} (asociación ${strength}). La tasa más alta de "${posLabel}" se concentra en la categoría "${maxRateCat?.category}" (${maxRateCat?.ratePositive.toFixed(1)}%), mientras que "${minRateCat?.category}" presenta la menor tasa (${minRateCat?.ratePositive.toFixed(1)}%).`;

    return {
      variable: varName,
      isNumeric: false,
      cramersV,
      contingencyTable,
      summaryNarrative,
    };
  }
}

/**
 * Data Cleaning & Preparation Pipeline:
 * Imputes missing values, caps outliers, applies transformations.
 * Learns parameters strictly on train set to prevent Data Leakage.
 */
export interface PipelineFittedParams {
  numericImputeValues: Record<string, number>;
  categoricImputeValues: Record<string, string>;
  outlierBounds: Record<string, { lower: number; upper: number }>;
  scalerParams: Record<string, { mean: number; std: number; min: number; max: number }>;
  categoricalDummies: Record<string, string[]>; // column -> dummy categories (reference category excluded)
}

export function fitDataPipeline(
  trainRows: Record<string, any>[],
  columns: ColumnMetadata[],
  targetCol: string,
  settings: {
    missingMethodNumeric: 'mean' | 'median' | 'zero';
    missingMethodCategoric: 'mode' | 'unknown';
    outlierMethod: 'none' | 'iqr' | 'zscore' | 'winsorize';
    scalingMethod: 'none' | 'standard' | 'minmax';
  }
): PipelineFittedParams {
  const numericImputeValues: Record<string, number> = {};
  const categoricImputeValues: Record<string, string> = {};
  const outlierBounds: Record<string, { lower: number; upper: number }> = {};
  const scalerParams: Record<string, { mean: number; std: number; min: number; max: number }> = {};
  const categoricalDummies: Record<string, string[]> = {};

  for (const col of columns) {
    if (col.isExcluded || col.name === targetCol) continue;

    const isNumeric = col.type === 'numeric_continuous' || col.type === 'numeric_discrete';

    if (isNumeric) {
      const nums = trainRows
        .map((r) => Number(r[col.name]))
        .filter((v) => !isNaN(v) && isFinite(v));
      const stats = calculateNumericStats(nums);

      // Missing imputation value
      if (settings.missingMethodNumeric === 'median') {
        numericImputeValues[col.name] = stats.median;
      } else if (settings.missingMethodNumeric === 'zero') {
        numericImputeValues[col.name] = 0;
      } else {
        numericImputeValues[col.name] = stats.mean;
      }

      // Outlier bounds
      if (settings.outlierMethod === 'iqr') {
        outlierBounds[col.name] = {
          lower: stats.p25 - 1.5 * stats.iqr,
          upper: stats.p75 + 1.5 * stats.iqr,
        };
      } else if (settings.outlierMethod === 'zscore') {
        outlierBounds[col.name] = {
          lower: stats.mean - 3.0 * stats.stdDev,
          upper: stats.mean + 3.0 * stats.stdDev,
        };
      } else if (settings.outlierMethod === 'winsorize') {
        const sorted = [...nums].sort((a, b) => a - b);
        const p01 = sorted[Math.floor(0.01 * sorted.length)] || stats.min;
        const p99 = sorted[Math.floor(0.99 * sorted.length)] || stats.max;
        outlierBounds[col.name] = { lower: p01, upper: p99 };
      }

      // Scaler params
      scalerParams[col.name] = {
        mean: stats.mean,
        std: stats.stdDev > 0 ? stats.stdDev : 1,
        min: stats.min,
        max: stats.max > stats.min ? stats.max : stats.min + 1,
      };
    } else {
      // Categorical
      const counts: Record<string, number> = {};
      trainRows.forEach((r) => {
        const val = r[col.name] !== null && r[col.name] !== undefined ? String(r[col.name]) : '';
        if (val !== '') counts[val] = (counts[val] || 0) + 1;
      });

      const sortedCats = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      categoricImputeValues[col.name] = settings.missingMethodCategoric === 'unknown' ? 'Desconocido' : sortedCats[0]?.[0] || 'Desconocido';

      // One-hot dummy levels: exclude the most frequent category to serve as reference level (avoids dummy trap)
      const allLevels = sortedCats.map((c) => c[0]);
      if (allLevels.length > 1) {
        categoricalDummies[col.name] = allLevels.slice(1); // reference level is allLevels[0]
      }
    }
  }

  return {
    numericImputeValues,
    categoricImputeValues,
    outlierBounds,
    scalerParams,
    categoricalDummies,
  };
}

/**
 * Transforms raw dataset using fitted pipeline parameters without Data Leakage
 */
export function transformDatasetWithPipeline(
  rows: Record<string, any>[],
  columns: ColumnMetadata[],
  targetCol: string,
  fitted: PipelineFittedParams,
  settings: {
    outlierMethod: 'none' | 'iqr' | 'zscore' | 'winsorize';
    scalingMethod: 'none' | 'standard' | 'minmax';
  }
): {
  transformedRows: Record<string, any>[];
  featureColumns: string[];
} {
  const transformedRows: Record<string, any>[] = [];
  const featureColsSet = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const trans: Record<string, any> = {};

    // Target variable preserved as 0 or 1
    if (raw[targetCol] !== undefined) {
      trans[targetCol] = Number(raw[targetCol]) === 1 ? 1 : 0;
    }

    for (const col of columns) {
      if (col.isExcluded || col.name === targetCol) continue;

      const isNumeric = col.type === 'numeric_continuous' || col.type === 'numeric_discrete';

      if (isNumeric) {
        let val = Number(raw[col.name]);
        if (isNaN(val) || val === null || val === undefined) {
          val = fitted.numericImputeValues[col.name] ?? 0;
        }

        // Apply outlier treatment if configured
        if (settings.outlierMethod !== 'none' && fitted.outlierBounds[col.name]) {
          const { lower, upper } = fitted.outlierBounds[col.name];
          val = Math.max(lower, Math.min(upper, val));
        }

        // Apply scaling if configured
        if (settings.scalingMethod === 'standard' && fitted.scalerParams[col.name]) {
          const { mean, std } = fitted.scalerParams[col.name];
          val = (val - mean) / std;
        } else if (settings.scalingMethod === 'minmax' && fitted.scalerParams[col.name]) {
          const { min, max } = fitted.scalerParams[col.name];
          val = (val - min) / (max - min);
        }

        trans[col.name] = val;
        featureColsSet.add(col.name);
      } else {
        // Categorical
        let rawCat = raw[col.name] !== null && raw[col.name] !== undefined ? String(raw[col.name]) : '';
        if (rawCat === '') {
          rawCat = fitted.categoricImputeValues[col.name] ?? 'Desconocido';
        }

        const dummyLevels = fitted.categoricalDummies[col.name] || [];
        if (dummyLevels.length > 0) {
          for (const lvl of dummyLevels) {
            const dummyName = `${col.name}_${lvl}`;
            trans[dummyName] = rawCat === lvl ? 1 : 0;
            featureColsSet.add(dummyName);
          }
        } else {
          // Binary or single category
          trans[col.name] = rawCat === '1' || rawCat.toLowerCase() === 'si' || rawCat.toLowerCase() === 'yes' ? 1 : 0;
          featureColsSet.add(col.name);
        }
      }
    }

    transformedRows.push(trans);
  }

  return {
    transformedRows,
    featureColumns: Array.from(featureColsSet),
  };
}
