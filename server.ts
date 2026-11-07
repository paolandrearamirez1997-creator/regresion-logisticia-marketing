import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Statistical & Business Interpretation endpoint
  app.post('/api/ai/interpret', async (req, res) => {
    try {
      const {
        question,
        modelSummary,
        coefficients,
        metrics,
        vifList,
        confusionMatrix,
        sector,
        targetName,
        positiveLabel,
        negativeLabel,
      } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          interpretation: generateLocalStatisticalInterpretation({
            question,
            coefficients,
            metrics,
            vifList,
            confusionMatrix,
            sector,
            targetName,
            positiveLabel,
            negativeLabel,
          }),
          isFallback: true,
          note: 'Respuesta generada con el motor estadístico local integrado. Para análisis cualitativo avanzado con Gemini 3.8 Flash, configure GEMINI_API_KEY en Settings > Secrets.',
        });
      }

      const promptContext = `
Actúa como un Senior Data Scientist y Consultor Econométrico de alto nivel especializado en Modelos Lineales Generalizados (GLM) y Regresión Logística.
El usuario está evaluando un modelo predictivo con las siguientes especificaciones:

- Sector Económico: ${sector || 'General'}
- Variable Objetivo (Y): "${targetName}"
  * Evento positivo (Y=1): "${positiveLabel}"
  * Evento negativo (Y=0): "${negativeLabel}"

RESULTADOS ESTADÍSTICOS ESTIMADOS POR MÁXIMA VEROSIMILITUD:
- Número de observaciones: ${metrics?.nObs || 'N/A'} (Train: ${metrics?.trainSize || 'N/A'}, Test: ${metrics?.testSize || 'N/A'})
- Log-Likelihood del modelo: ${metrics?.logLikelihood ? metrics.logLikelihood.toFixed(3) : 'N/A'}
- Log-Likelihood nulo: ${metrics?.nullLogLikelihood ? metrics.nullLogLikelihood.toFixed(3) : 'N/A'}
- LR Test Chi-cuadrado: ${metrics?.lrStat ? metrics.lrStat.toFixed(2) : 'N/A'} (p-value: ${metrics?.lrPValue !== undefined ? metrics.lrPValue.toExponential(3) : 'N/A'})
- Pseudo R² de McFadden: ${metrics?.mcfaddenR2 ? (metrics.mcfaddenR2 * 100).toFixed(2) + '%' : 'N/A'}
- AIC: ${metrics?.aic ? metrics.aic.toFixed(2) : 'N/A'}
- BIC: ${metrics?.bic ? metrics.bic.toFixed(2) : 'N/A'}
- AUC-ROC: ${metrics?.auc ? metrics.auc.toFixed(3) : 'N/A'}
- Average Precision (PR-AUC): ${metrics?.averagePrecision ? metrics.averagePrecision.toFixed(3) : 'N/A'}
- Brier Score (Calibración): ${metrics?.brierScore ? metrics.brierScore.toFixed(4) : 'N/A'}
- Umbral de clasificación actual: ${metrics?.threshold !== undefined ? metrics.threshold : 0.5}

TABLA DE COEFICIENTES ESTIMADOS, ERRORES ESTÁNDAR, ODDS RATIOS (OR) Y SIGNIFICANCIA:
${(coefficients || [])
  .map(
    (c: any) =>
      `* ${c.variable}: Coeficiente (beta) = ${c.coef.toFixed(4)}, Error Estándar = ${c.stdErr.toFixed(4)}, Wald z = ${c.zStat.toFixed(3)}, p-valor = ${c.pValue < 0.001 ? '<0.001' : c.pValue.toFixed(4)}, Odds Ratio (e^beta) = ${c.oddsRatio.toFixed(3)} [95% CI: ${c.ciLowerOR ? c.ciLowerOR.toFixed(3) : 'N/A'} - ${c.ciUpperOR ? c.ciUpperOR.toFixed(3) : 'N/A'}], Significativo (p<0.05): ${c.pValue < 0.05 ? 'SÍ' : 'NO'}`
  )
  .join('\n')}

MATRIZ DE CONFUSIÓN Y RENDIMIENTO EN DATOS DE PRUEBA:
- Matriz: TP=${confusionMatrix?.tp ?? 'N/A'}, TN=${confusionMatrix?.tn ?? 'N/A'}, FP=${confusionMatrix?.fp ?? 'N/A'}, FN=${confusionMatrix?.fn ?? 'N/A'}
- Accuracy: ${metrics?.accuracy ? (metrics.accuracy * 100).toFixed(1) + '%' : 'N/A'}
- Sensibilidad / Recall: ${metrics?.recall ? (metrics.recall * 100).toFixed(1) + '%' : 'N/A'}
- Especificidad: ${metrics?.specificity ? (metrics.specificity * 100).toFixed(1) + '%' : 'N/A'}
- Precisión (VPP): ${metrics?.precision ? (metrics.precision * 100).toFixed(1) + '%' : 'N/A'}
- F1-Score: ${metrics?.f1 ? metrics.f1.toFixed(3) : 'N/A'}

MULTICOLINEALIDAD (VIF):
${(vifList || []).map((v: any) => `* ${v.variable}: VIF = ${v.vif.toFixed(2)} (${v.vif > 10 ? 'ALERTA SEVERA' : v.vif > 5 ? 'MODERADO' : 'ACEPTABLE'})`).join('\n')}

PREGUNTA ESPECÍFICA DEL USUARIO:
"${question}"

INSTRUCCIONES CLAVE DE RESPUESTA:
1. Responde de forma rigurosa, clara, didáctica y orientada al negocio en español neutro profesional.
2. Utiliza estrictamente los datos calculados reales proporcionados arriba. NO inventes cifras, métricas ni estadísticos.
3. Diferencia explícitamente entre:
   - Asociación estadística (significancia de p-valores y coeficientes)
   - Magnitud del efecto (Odds Ratios)
   - Capacidad discriminativa (AUC, Matriz de Confusión)
   - Causalidad vs Correlación (adviértelo con prudencia metodológica)
4. Explica el significado empresarial específico para el sector ${sector || 'seleccionado'}.
5. Formatea con subtítulos claros, viñetas analíticas y recomendaciones de acción concretas.
`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera excedido con la API de Gemini')), 9000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContext,
          config: {
            systemInstruction:
              'Eres un experto mundial en Econometría, Machine Learning y Regresión Logística. Tu estilo es técnico, preciso, pedagógico y enfocado en la toma de decisiones empresariales basadas en evidencia cuantitativa.',
          },
        }),
        timeoutPromise,
      ]);

      return res.json({
        interpretation: response.text,
        isFallback: false,
      });
    } catch (err: any) {
      console.error('Error generating AI interpretation:', err);
      return res.status(200).json({
        interpretation: generateLocalStatisticalInterpretation(req.body),
        isFallback: true,
        error: err.message || 'Error en servicio Gemini',
      });
    }
  });

  // Fallback local statistical interpretation engine if API key isn't configured
  function generateLocalStatisticalInterpretation(data: any): string {
    const { coefficients = [], metrics = {}, sector = 'General', positiveLabel = 'Evento Positivo' } = data;
    const significantVars = coefficients.filter((c: any) => c.variable !== '(Intercepto)' && c.pValue < 0.05);
    const nonSigVars = coefficients.filter((c: any) => c.variable !== '(Intercepto)' && c.pValue >= 0.05);

    const riskIncreasing = coefficients
      .filter((c: any) => c.variable !== '(Intercepto)' && c.coef > 0 && c.pValue < 0.05)
      .sort((a: any, b: any) => b.oddsRatio - a.oddsRatio);

    const riskDecreasing = coefficients
      .filter((c: any) => c.variable !== '(Intercepto)' && c.coef < 0 && c.pValue < 0.05)
      .sort((a: any, b: any) => a.oddsRatio - b.oddsRatio);

    let report = `### Síntesis Econométrica y Diagnóstico del Modelo (${sector})\n\n`;

    report += `#### 1. Capacidad Predictiva y Ajuste Global\n`;
    report += `- **Discriminación (AUC-ROC)**: El modelo alcanza un AUC de **${metrics.auc ? metrics.auc.toFixed(3) : 'N/A'}**, lo cual califica como una capacidad de discriminación ${
      (metrics.auc || 0) >= 0.85 ? 'excelente' : (metrics.auc || 0) >= 0.75 ? 'buena' : 'aceptable'
    }.\n`;
    report += `- **Bondad de Ajuste (Pseudo R² de McFadden)**: **${
      metrics.mcfaddenR2 ? (metrics.mcfaddenR2 * 100).toFixed(1) + '%' : 'N/A'
    }**. En modelos de probabilidad no lineal, valores entre 20% y 40% representan un ajuste sumamente sólido.\n`;
    report += `- **Calibración (Brier Score)**: **${
      metrics.brierScore ? metrics.brierScore.toFixed(4) : 'N/A'
    }** (más cercano a 0 indica mejores estimaciones probabilísticas).\n\n`;

    report += `#### 2. Variables Estadísticamente Significativas (p < 0.05)\n`;
    report += `Se identificaron **${significantVars.length} variables con evidencia estadística robusta** de asociación con "${positiveLabel}":\n`;
    significantVars.forEach((v: any) => {
      const pctChange = ((v.oddsRatio - 1) * 100).toFixed(1);
      const direction = v.coef > 0 ? 'incrementa' : 'reduce';
      report += `- **${v.variable}** (β = ${v.coef.toFixed(3)}, p = ${v.pValue < 0.001 ? '<0.001' : v.pValue.toFixed(3)}): Un aumento unitario **${direction} las odds en un ${Math.abs(Number(pctChange))}%** (OR = ${v.oddsRatio.toFixed(3)}).\n`;
    });

    if (nonSigVars.length > 0) {
      report += `\n*Variables sin evidencia concluyente (p >= 0.05)*: ${nonSigVars.map((v: any) => v.variable).join(', ')}. Se sugiere evaluar su remoción mediante Stepwise para preservar parsimonia.\n`;
    }

    report += `\n#### 3. Factores Clave de Decisión en el Sector ${sector}\n`;
    if (riskIncreasing.length > 0) {
      report += `- **Principales inductores de riesgo/evento**: ${riskIncreasing.map((v: any) => `${v.variable} (OR ${v.oddsRatio.toFixed(2)})`).join(', ')}.\n`;
    }
    if (riskDecreasing.length > 0) {
      report += `- **Principales factores protectores/moderadores**: ${riskDecreasing.map((v: any) => `${v.variable} (OR ${v.oddsRatio.toFixed(2)})`).join(', ')}.\n`;
    }

    report += `\n#### 4. Recomendación Operativa\n`;
    report += `El umbral estándar de 0.50 debe contrastarse con la matriz de costos y beneficios del negocio en la pestaña de Ganancias Económicas para fijar el punto de corte óptimo financiero.`;

    return report;
  }

  // Vite integration
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LogitAnalytics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
