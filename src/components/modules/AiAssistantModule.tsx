import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
  Info,
} from 'lucide-react';
import { ProjectState } from '../../types/logit';

interface AiAssistantModuleProps {
  projectState: ProjectState;
}

export const AiAssistantModule: React.FC<AiAssistantModuleProps> = ({ projectState }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; isFallback?: boolean; note?: string }[]
  >([
    {
      role: 'assistant',
      text: `Hola. Soy su Consultor Senior en Econometría y Machine Learning. He auditado los resultados calculados por máxima verosimilitud (MLE) de su modelo logístico para el sector **${
        projectState.sector.toUpperCase()
      }** (Variable Y: "${projectState.targetVariable}").\n\nPuede formularme preguntas libres o seleccionar cualquiera de las consultas metodológicas predeterminadas para interpretar la ecuación estimada, los Odds Ratios, el AUC, los diagnósticos de multicolinealidad o las recomendaciones de negocio.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const presetQuestions = [
    '¿Qué significa la ecuación estimada y qué variables tienen mayor impacto?',
    '¿Cuáles variables son estadísticamente significativas y qué implican sus Odds Ratios?',
    '¿Qué variables incrementan o reducen las odds de ocurrencia del evento?',
    '¿Cómo interpretar el AUC-ROC y la matriz de confusión para este sector?',
    '¿Qué umbral de decisión (τ) debería utilizar según el objetivo del negocio?',
    '¿El modelo está bien calibrado y presenta riesgos de sobreajuste?',
    '¿Existen problemas de multicolinealidad o variables redundantes (VIF)?',
    '¿Qué recomendaciones operativas y estratégicas se derivan del modelo?',
  ];

  const handleSendQuestion = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const payload = {
        question: q,
        coefficients: projectState.coefficients,
        metrics: projectState.fitMetrics,
        vifList: projectState.coefficients
          .filter((c) => c.variable !== '(Intercepto)')
          .map((c) => ({ variable: c.variable, vif: c.vif || 1.0 })),
        confusionMatrix: projectState.confusionMatrix,
        sector: projectState.sector,
        targetName: projectState.targetVariable,
        positiveLabel: projectState.positiveClassLabel,
        negativeLabel: projectState.negativeClassLabel,
      };

      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.interpretation || 'No se obtuvo respuesta del motor de análisis.',
          isFallback: data.isFallback,
          note: data.note,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Ocurrió un error al contactar al motor de interpretación: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Asistente de Inteligencia Artificial para Interpretación Econométrica
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Análisis automatizado con Gemini 3.8 Flash grounded exclusivamente en los coeficientes reales, p-valores, Odds Ratios y métricas estimadas en su modelo.
        </p>
      </div>

      {/* Preset Queries Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
          Preguntas Metodológicas Rápidas (Un Clic):
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {presetQuestions.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(pq)}
              disabled={isLoading}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/30 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl border leading-relaxed text-xs ${
                isUser
                  ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 ml-8 font-medium'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 mr-8 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  {isUser ? 'Su Consulta' : 'Dictamen Econométrico & IA'}
                </span>
                {!isUser && (
                  <button
                    onClick={() => handleCopy(m.text, idx)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIdx === idx ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>

              <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                {m.text}
              </div>

              {m.note && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 italic">
                  {m.note}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 text-xs text-indigo-600 dark:text-indigo-400 mr-8 shadow-xs">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Consultando los parámetros estadísticos del modelo con Gemini 3.8 Flash...</span>
          </div>
        )}
      </div>

      {/* Freeform Query Input Bar */}
      <div className="sticky bottom-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg flex items-center gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
          placeholder="Escriba una pregunta sobre los coeficientes, el AUC, supuestos o recomendaciones del modelo..."
          className="flex-1 bg-transparent border-none text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
        />
        <button
          onClick={() => handleSendQuestion()}
          disabled={!question.trim() || isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Preguntar</span>
        </button>
      </div>
    </div>
  );
};
