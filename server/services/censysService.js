import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.CENSYS_API_KEY;

function isConfigured() {
  return !!API_KEY && API_KEY.trim() !== '';
}

// Helper to get Auth headers
function getHeaders() {
  // Try using the key directly as username, empty password
  const token = Buffer.from(`${API_KEY}:`).toString('base64');
  return {
    'Authorization': `Basic ${token}`,
    'Accept': 'application/json'
  };
}

export async function searchHost(ip) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get(`https://search.censys.io/api/v2/hosts/${ip}`, {
      headers: getHeaders()
    });
    return { success: true, data: response.data.result };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

export async function searchCertificates(query) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get('https://search.censys.io/api/v2/certificates', {
      headers: getHeaders(),
      params: { q: query, per_page: 5 }
    });
    return { success: true, data: response.data.result };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

export async function discoverServices(ip) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    // Censys v2 returns host services directly in the host details
    const response = await axios.get(`https://search.censys.io/api/v2/hosts/${ip}`, {
      headers: getHeaders()
    });
    return { success: true, data: response.data.result?.services || [] };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}
