import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SHODAN_API_KEY;

function isConfigured() {
  return !!API_KEY && API_KEY.trim() !== '';
}

export async function searchDevice(ip) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get(`https://api.shodan.io/shodan/host/${ip}`, {
      params: { key: API_KEY }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

export async function getPortsInfo() {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get('https://api.shodan.io/shodan/ports', {
      params: { key: API_KEY }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

export async function getBanners(query) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get('https://api.shodan.io/shodan/host/search', {
      params: { key: API_KEY, query: query }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}
