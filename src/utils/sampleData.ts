import { SectorDefinition, SectorType } from '../types/logit';

export const SECTOR_DEFINITIONS: Record<SectorType, SectorDefinition> = {
  financiero: {
    id: 'financiero',
    name: 'Financiero y Bancario',
    defaultPositive: 'Cliente en Incumplimiento (Default)',
    defaultNegative: 'Cliente al Día (No Default)',
    description: 'Modelos de Score de Crédito, riesgo de impago y probabilidad de mora en carteras de consumo y microfinanzas.',
    sampleDatasetKey: 'credit_default',
    iconName: 'Landmark',
  },
  seguros: {
    id: 'seguros',
    name: 'Seguros y Actuaría',
    defaultPositive: 'Ocurrencia de Siniestro',
    defaultNegative: 'Póliza sin Reclamación',
    description: 'Modelos actuariales de frecuencia siniestral y probabilidad de reclamación de pólizas de vida y vehículos.',
    sampleDatasetKey: 'insurance_claim',
    iconName: 'ShieldAlert',
  },
  fintech: {
    id: 'fintech',
    name: 'Fintech y Neobancos',
    defaultPositive: 'Transacción Fraudulenta',
    defaultNegative: 'Transacción Legítima',
    description: 'Detección de patrones anómalos, fraude en pagos digitales y aprobación de microcréditos instantáneos.',
    sampleDatasetKey: 'fraud_detection',
    iconName: 'Zap',
  },
  comercio: {
    id: 'comercio',
    name: 'Comercio y Retail',
    defaultPositive: 'Compra Efectiva en Carrito',
    defaultNegative: 'Abandono de Carrito',
    description: 'Conversión de ecommerce, probabilidad de recompra y respuesta a descuentos promocionales.',
    sampleDatasetKey: 'marketing_campaign',
    iconName: 'ShoppingCart',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing y Publicidad',
    defaultPositive: 'Conversión de Campaña',
    defaultNegative: 'No Responde a Campaña',
    description: 'Modelos de propensión de compra, lead scoring y optimización de presupuesto de pauta comercial.',
    sampleDatasetKey: 'marketing_campaign',
    iconName: 'Megaphone',
  },
  telecom: {
    id: 'telecom',
    name: 'Telecomunicaciones',
    defaultPositive: 'Deserción / Abandono (Churn)',
    defaultNegative: 'Permanencia / Retención',
    description: 'Modelos de fuga de clientes pospago, fidelización y respuesta a ofertas de retención de valor.',
    sampleDatasetKey: 'telco_churn',
    iconName: 'Radio',
  },
  salud: {
    id: 'salud',
    name: 'Salud y Medicina',
    defaultPositive: 'Diagnóstico Positivo / Riesgo Clínico',
    defaultNegative: 'Paciente Sano / Sin Condición',
    description: 'Modelos epidemiológicos de riesgo cardiovascular, diabetes y reingreso hospitalario no planificado.',
    sampleDatasetKey: 'health_risk',
    iconName: 'HeartPulse',
  },
  educacion: {
    id: 'educacion',
    name: 'Educación y Universidades',
    defaultPositive: 'Deserción Universitaria',
    defaultNegative: 'Graduación / Continuidad',
    description: 'Identificación temprana de estudiantes en riesgo de deserción académica y becas de apoyo.',
    sampleDatasetKey: 'student_dropout',
    iconName: 'GraduationCap',
  },
  manufactura: {
    id: 'manufactura',
    name: 'Manufactura e Industria',
    defaultPositive: 'Falla Mecánica de Maquinaria',
    defaultNegative: 'Operación Óptima',
    description: 'Mantenimiento predictivo industrial y control de calidad de lotes en planta.',
    sampleDatasetKey: 'machine_failure',
    iconName: 'Factory',
  },
  transporte: {
    id: 'transporte',
    name: 'Transporte y Logística',
    defaultPositive: 'Retraso Crítico en Entrega',
    defaultNegative: 'Entrega a Tiempo',
    description: 'Cumplimiento de SLA en última milla y probabilidad de incidencias en rutas logísticas.',
    sampleDatasetKey: 'logistics_delay',
    iconName: 'Truck',
  },
  inmobiliario: {
    id: 'inmobiliario',
    name: 'Construcción e Inmobiliario',
    defaultPositive: 'Cierre de Venta Inmueble',
    defaultNegative: 'Desiste de Compra',
    description: 'Propensión de compra de vivienda y riesgo de mora en cartera hipotecaria.',
    sampleDatasetKey: 'real_estate',
    iconName: 'Building',
  },
  rrhh: {
    id: 'rrhh',
    name: 'Recursos Humanos',
    defaultPositive: 'Renuncia Voluntaria (Attrition)',
    defaultNegative: 'Permanencia en Empresa',
    description: 'Predicción de retención de talento clave, clima laboral y rotación no deseada.',
    sampleDatasetKey: 'hr_attrition',
    iconName: 'Users',
  },
  servicios: {
    id: 'servicios',
    name: 'Servicios Profesionales',
    defaultPositive: 'Renovación de Contrato',
    defaultNegative: 'Cancelación de Servicio',
    description: 'Modelos de valor de vida del cliente (LTV) y renovación de suscripciones anuales.',
    sampleDatasetKey: 'telco_churn',
    iconName: 'Briefcase',
  },
  agricultura: {
    id: 'agricultura',
    name: 'Agricultura y Agroindustria',
    defaultPositive: 'Pérdida de Cosecha por Plaga',
    defaultNegative: 'Cosecha Saludable',
    description: 'Factores climáticos, humedad del suelo y probabilidad de afectación por patógenos agrícolas.',
    sampleDatasetKey: 'crop_risk',
    iconName: 'Wheat',
  },
  otros: {
    id: 'otros',
    name: 'Otros Sectores / General',
    defaultPositive: 'Evento de Interés (1)',
    defaultNegative: 'Evento Base (0)',
    description: 'Configuración general universal para cualquier base de datos con variable dicotómica.',
    sampleDatasetKey: 'credit_default',
    iconName: 'Folder',
  },
};

/**
 * High-fidelity synthetic benchmark datasets with genuine statistical signal, realistic correlations,
 * non-linearities, and proper econometric distributions.
 */

// 1. Credit Default Dataset (Banking / Fintech)
export function generateCreditDefaultData(n = 600, seed = 42): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  function prng(idx: number, offset = 0) {
    const x = Math.sin(seed + idx * 12.9898 + offset * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  for (let i = 0; i < n; i++) {
    const age = Math.round(21 + prng(i, 1) * 45); // 21 to 66
    const income = Math.round(1800 + prng(i, 2) * 8500); // 1800 to 10300 USD
    const creditScore = Math.round(450 + prng(i, 3) * 400); // 450 to 850
    const dti = parseFloat((0.1 + prng(i, 4) * 0.65).toFixed(3)); // Debt to Income ratio 0.10 to 0.75
    const delinquentLines = prng(i, 5) > 0.65 ? Math.floor(prng(i, 6) * 4) + 1 : 0; // 0 to 4
    const loanAmount = Math.round(3000 + prng(i, 7) * 45000); // Loan amount
    const employmentYears = Math.round(prng(i, 8) * 20); // 0 to 20 years

    // Latent log-odds equation
    // Default increases with: higher DTI, delinquent lines, lower credit score, lower income
    const z =
      -0.8 +
      3.2 * dti +
      0.65 * delinquentLines -
      0.007 * (creditScore - 600) -
      0.00015 * (income - 4000) -
      0.04 * employmentYears;

    const p = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, z))));
    const defaultEvent = prng(i, 9) < p ? 1 : 0;

    rows.push({
      ID_Cliente: `CLI-${1000 + i}`,
      Edad: age,
      Ingreso_Mensual: income,
      Score_Crediticio: creditScore,
      Relacion_Deuda_Ingreso: dti,
      Lineas_en_Mora: delinquentLines,
      Monto_Prestamo: loanAmount,
      Antiguedad_Laboral: employmentYears,
      Incumplimiento: defaultEvent,
    });
  }

  return rows;
}

// 2. Telco Churn Dataset (Telecomunicaciones / Servicios)
export function generateTelcoChurnData(n = 600, seed = 101): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  const contracts = ['Mes a Mes', 'Un Ano', 'Dos Anos'];
  const paymentMethods = ['Debito Automatico', 'Tarjeta Credito', 'Transferencia', 'Efectivo'];

  function prng(idx: number, offset = 0) {
    const x = Math.sin(seed + idx * 17.123 + offset * 91.456) * 31415.9265;
    return x - Math.floor(x);
  }

  for (let i = 0; i < n; i++) {
    const tenureMonths = Math.round(1 + prng(i, 1) * 71); // 1 to 72 months
    const monthlyCharges = parseFloat((25 + prng(i, 2) * 95).toFixed(2)); // 25 to 120 USD
    const totalCharges = parseFloat((tenureMonths * monthlyCharges * (0.95 + prng(i, 3) * 0.1)).toFixed(2));
    const contractType = contracts[Math.floor(prng(i, 4) * contracts.length)];
    const paymentMethod = paymentMethods[Math.floor(prng(i, 5) * paymentMethods.length)];
    const techSupportCalls = Math.floor(prng(i, 6) * 6); // 0 to 5 calls
    const fiberOptic = prng(i, 7) > 0.5 ? 1 : 0;

    // Churn latent equation
    let z = -0.5 - 0.04 * tenureMonths + 0.02 * (monthlyCharges - 60) + 0.35 * techSupportCalls;
    if (contractType === 'Mes a Mes') z += 0.9;
    if (contractType === 'Dos Anos') z -= 1.1;
    if (fiberOptic === 1) z += 0.4;

    const p = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, z))));
    const churn = prng(i, 8) < p ? 1 : 0;

    rows.push({
      ID_Abonado: `TEL-${2000 + i}`,
      Meses_Antiguedad: tenureMonths,
      Cargo_Mensual: monthlyCharges,
      Facturacion_Total: totalCharges,
      Tipo_Contrato: contractType,
      Metodo_Pago: paymentMethod,
      Llamadas_Soporte: techSupportCalls,
      Tiene_Fibra_Optica: fiberOptic,
      Desercion_Churn: churn,
    });
  }

  return rows;
}

// 3. Health & Cardiovascular Risk Dataset (Salud / Epidemiología)
export function generateHealthRiskData(n = 600, seed = 202): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  function prng(idx: number, offset = 0) {
    const x = Math.sin(seed + idx * 23.456 + offset * 63.789) * 27182.8182;
    return x - Math.floor(x);
  }

  for (let i = 0; i < n; i++) {
    const age = Math.round(30 + prng(i, 1) * 50); // 30 to 80 years
    const bmi = parseFloat((18.5 + prng(i, 2) * 22).toFixed(1)); // 18.5 to 40.5 BMI
    const systolicBP = Math.round(105 + prng(i, 3) * 75); // 105 to 180 mmHg
    const fastingGlucose = Math.round(75 + prng(i, 4) * 125); // 75 to 200 mg/dL
    const totalCholesterol = Math.round(140 + prng(i, 5) * 160); // 140 to 300 mg/dL
    const smoker = prng(i, 6) > 0.68 ? 1 : 0;
    const familyHistory = prng(i, 7) > 0.6 ? 1 : 0;

    // Latent cardiovascular event risk
    const z =
      -6.8 +
      0.06 * age +
      0.08 * (bmi - 25) +
      0.025 * (systolicBP - 120) +
      0.015 * (fastingGlucose - 100) +
      0.65 * smoker +
      0.75 * familyHistory;

    const p = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, z))));
    const event = prng(i, 8) < p ? 1 : 0;

    rows.push({
      ID_Paciente: `MED-${3000 + i}`,
      Edad: age,
      Indice_Masa_Corporal: bmi,
      Presion_Sistolica: systolicBP,
      Glucosa_Ayunas: fastingGlucose,
      Colesterol_Total: totalCholesterol,
      Fumador_Activo: smoker,
      Antecedentes_Familiares: familyHistory,
      Evento_Cardiovascular: event,
    });
  }

  return rows;
}

// 4. HR Employee Turnover Dataset (Recursos Humanos)
export function generateHrAttritionData(n = 600, seed = 303): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  function prng(idx: number, offset = 0) {
    const x = Math.sin(seed + idx * 31.789 + offset * 47.123) * 14142.1356;
    return x - Math.floor(x);
  }

  for (let i = 0; i < n; i++) {
    const age = Math.round(22 + prng(i, 1) * 40); // 22 to 62
    const yearsAtCompany = Math.round(prng(i, 2) * 15);
    const monthlySalary = Math.round(2200 + prng(i, 3) * 9500);
    const jobSatisfaction = Math.floor(prng(i, 4) * 4) + 1; // 1 to 4 scale
    const workLifeBalance = Math.floor(prng(i, 5) * 4) + 1; // 1 to 4 scale
    const overtime = prng(i, 6) > 0.65 ? 1 : 0;
    const distanceKm = Math.round(2 + prng(i, 7) * 38); // 2 to 40 km
    const promotionsLast5Y = prng(i, 8) > 0.7 ? 1 : 0;

    // Latent turnover probability
    const z =
      0.4 -
      0.55 * (jobSatisfaction - 2.5) -
      0.4 * (workLifeBalance - 2.5) +
      0.85 * overtime +
      0.02 * distanceKm -
      0.00018 * (monthlySalary - 4500) -
      0.6 * promotionsLast5Y;

    const p = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, z))));
    const attrition = prng(i, 9) < p ? 1 : 0;

    rows.push({
      ID_Empleado: `EMP-${4000 + i}`,
      Edad: age,
      Anos_en_Empresa: yearsAtCompany,
      Salario_Mensual: monthlySalary,
      Satisfaccion_Laboral: jobSatisfaction,
      Equilibrio_Vida_Trabajo: workLifeBalance,
      Horas_Extra_Habitual: overtime,
      Distancia_Trabajo_Km: distanceKm,
      Ascenso_Ultimos_5Anos: promotionsLast5Y,
      Renuncia_Voluntaria: attrition,
    });
  }

  return rows;
}

// 5. Marketing Campaign Response (Marketing / Retail)
export function generateMarketingData(n = 600, seed = 404): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  function prng(idx: number, offset = 0) {
    const x = Math.sin(seed + idx * 41.111 + offset * 83.222) * 17320.508;
    return x - Math.floor(x);
  }

  for (let i = 0; i < n; i++) {
    const age = Math.round(20 + prng(i, 1) * 55);
    const bankBalance = Math.round(150 + prng(i, 2) * 14000);
    const callDurationSec = Math.round(45 + prng(i, 3) * 650); // call duration
    const previousCampaigns = Math.floor(prng(i, 4) * 6);
    const previousOutcome = prng(i, 5) > 0.8 ? 1 : 0;
    const daysSinceLastContact = Math.round(prng(i, 6) * 180);

    // Conversion probability
    const z =
      -2.6 +
      0.004 * callDurationSec +
      0.0001 * (bankBalance - 2000) +
      0.9 * previousOutcome +
      0.15 * previousCampaigns -
      0.005 * daysSinceLastContact;

    const p = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, z))));
    const conversion = prng(i, 7) < p ? 1 : 0;

    rows.push({
      ID_Prospecto: `LEAD-${5000 + i}`,
      Edad: age,
      Saldo_Bancario: bankBalance,
      Duracion_Llamada_Seg: callDurationSec,
      Contactos_Previos: previousCampaigns,
      Exito_Campana_Anterior: previousOutcome,
      Dias_Desde_Contacto: daysSinceLastContact,
      Conversion_Compra: conversion,
    });
  }

  return rows;
}
