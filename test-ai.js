require('dotenv').config({ path: '.env' });
const { GoogleGenAI } = require('@google/genai');

async function testGemini() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY_ANSWER_SOLVER });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Hello',
    });
    console.log('Gemini 2.0:', response.text);
  } catch (e) {
    console.error('Gemini 2.0 Error:', e.message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY_ANSWER_SOLVER });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Hello',
    });
    console.log('Gemini 1.5:', response.text);
  } catch (e) {
    console.error('Gemini 1.5 Error:', e.message);
  }
}

testGemini();
