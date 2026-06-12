import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function askGemini(prompt) {
  if (!GEMINI_KEY || GEMINI_KEY.trim() === '') {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Empty response from Gemini API');
    }
    return { success: true, text: content };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

export async function askOpenAI(prompt) {
  if (!OPENAI_KEY || OPENAI_KEY.trim() === '') {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }
    return { success: true, text: content };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}
