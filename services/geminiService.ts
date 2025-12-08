
import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatio, Language, Transaction } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Flash Lite for quick, low-latency categorization or simple tips.
 */
export const getQuickAnalysis = async (transactionsSummary: string, lang: Language): Promise<string> => {
  const prompt = lang === 'es' 
    ? `Analiza brevemente estos datos financieros y dame 3 consejos muy cortos y rápidos (máximo 1 frase cada uno) para mejorar el ahorro: ${transactionsSummary}`
    : `Briefly analyze these financial data and give me 3 very short and quick tips (max 1 sentence each) to improve savings: ${transactionsSummary}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    return response.text || (lang === 'es' ? "No se pudo generar el análisis." : "Could not generate analysis.");
  } catch (error) {
    console.error("Error in quick analysis:", error);
    return lang === 'es' ? "Error al conectar con el asistente rápido." : "Error connecting to quick assistant.";
  }
};

/**
 * Chat with context about specific transactions.
 */
export const sendFinancialChatMessage = async (
  message: string, 
  transactions: Transaction[], 
  lang: Language, 
  currency: string
): Promise<string> => {
  
  // Create a lightweight CSV-like string representation of transactions for the AI
  const transactionData = transactions.map(t => 
    `- ${t.date}: ${t.description} (${t.category}) | ${t.type === 'income' ? '+' : '-'}${t.amount}`
  ).join('\n');

  const systemPrompt = lang === 'es'
    ? `Eres un asistente financiero inteligente integrado en una app. 
       Tienes acceso a la lista de transacciones del usuario. 
       
       DATOS DEL USUARIO (Moneda: ${currency}):
       ${transactionData}

       INSTRUCCIONES:
       1. Responde preguntas específicas sobre gastos (ej: "¿Cuál es mi gasto más caro?", "¿Cuánto gasté en comida?").
       2. Sé conciso, directo y profesional (estilo "Whoop" o deportivo/técnico).
       3. Si te preguntan algo fuera de los datos, da consejos financieros generales.
       4. Usa formato Markdown para resaltar cifras importantes.`
    : `You are a smart financial assistant embedded in an app.
       You have access to the user's transaction list.

       USER DATA (Currency: ${currency}):
       ${transactionData}

       INSTRUCTIONS:
       1. Answer specific questions about spending (e.g., "What is my most expensive expense?", "How much did I spend on food?").
       2. Be concise, direct, and professional (high-performance/tech style).
       3. If asked about something outside the data, give general financial advice.
       4. Use Markdown to highlight important figures.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Chat error:", error);
    return lang === 'es' ? "Lo siento, tuve un problema analizando tus datos." : "Sorry, I had trouble analyzing your data.";
  }
};

/**
 * Uses Search Grounding to find real-time financial data.
 */
export const searchFinancialInfo = async (query: string, lang: Language) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query + (lang === 'es' ? " (Responde en Español)" : " (Respond in English)"),
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((item: any) => item !== null) || [];

    return { text, sources };
  } catch (error) {
    console.error("Error in search grounding:", error);
    throw error;
  }
};

/**
 * Uses Thinking Mode (Pro model) for complex financial advice.
 */
export const getComplexFinancialAdvice = async (query: string, context: string, lang: Language) => {
  const systemInstruction = lang === 'es'
    ? `Contexto Financiero del Usuario: ${context}\n\nPregunta del Usuario: ${query}\n\nActúa como un asesor financiero experto. Tómate tu tiempo para pensar paso a paso una estrategia detallada. Responde en Español.`
    : `User Financial Context: ${context}\n\nUser Question: ${query}\n\nAct as an expert financial advisor. Take your time to think step-by-step about a detailed strategy. Respond in English.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: systemInstruction,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep reasoning
      }
    });
    return response.text || (lang === 'es' ? "No se pudo generar el consejo detallado." : "Could not generate detailed advice.");
  } catch (error) {
    console.error("Error in complex advice:", error);
    return lang === 'es' ? "Lo siento, hubo un problema al procesar tu solicitud compleja." : "Sorry, there was a problem processing your complex request.";
  }
};

/**
 * Generates an image for a savings goal.
 */
export const generateGoalImage = async (prompt: string, aspectRatio: AspectRatio) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K",
        }
      }
    });

    let imageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        imageUrl = `data:image/png;base64,${base64}`;
        break;
      }
    }
    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};