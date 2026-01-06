
import { GoogleGenAI, Type } from "@google/genai";
import { GameStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCoachFeedback = async (stats: GameStats, totalTargets: number) => {
  try {
    const prompt = `
      Você é um Treinador de Mira IA futurista, levemente sarcástico, mas profissional, em um jogo com temática neon.
      Estatísticas Atuais da Sessão:
      - Pontuação: ${stats.score}
      - Acertos: ${stats.hits}
      - Precisão: ${stats.accuracy.toFixed(1)}%
      - Combo Máximo: ${stats.maxCombo}
      - Total de Alvos Tentados: ${totalTargets}

      Forneça um feedback curto de uma frase em PORTUGUÊS BRASILEIRO. 
      Se as estatísticas forem altas, mostre-se impressionado. Se forem baixas, seja motivador ou sarcástico.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um cyber-treinador. Mantenha as respostas curtas, impactantes e atmosféricas. Use gírias cyberpunk brasileiras quando apropriado. Responda APENAS em Português Brasileiro.",
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            sentiment: { 
              type: Type.STRING, 
              enum: ['positive', 'neutral', 'negative', 'sarcastic'] 
            }
          },
          required: ["text", "sentiment"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"text": "Escaneando seus sinais vitais. Continue atirando.", "sentiment": "neutral"}');
    return result;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Conexão perdida com o uplink tático. Prossiga.", sentiment: "neutral" };
  }
};
