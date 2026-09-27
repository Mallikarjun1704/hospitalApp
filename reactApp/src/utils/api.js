/**
 * API Client Configuration & Dynamic Base URL Utility
 * Supports runtime switching between Localhost (Main System) and Remote IP (Second System).
 */

const STORAGE_KEY = 'hospital_api_base_url';
const DEFAULT_PORT = '8889';
const DEFAULT_BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${DEFAULT_PORT}`;

/**
 * Normalizes an IP, hostname, or full URL into a valid API base URL.
 * e.g., "192.168.1.50" -> "http://192.168.1.50:8889"
 *       "192.168.1.50:5000" -> "http://192.168.1.50:5000"
 *       "http://192.168.1.50:8889/" -> "http://192.168.1.50:8889"
 */
export function normalizeApiUrl(input) {
  if (!input || !input.trim()) {
    return DEFAULT_BASE_URL;
  }

  let url = input.trim();

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // If no port specified and it's an IP or localhost, append default port
  try {
    const parsed = new URL(url);
    if (!parsed.port) {
      parsed.port = DEFAULT_PORT;
      url = parsed.origin;
    }
  } catch (e) {
    // If URL parsing fails, attempt basic regex check
    if (!/:\d+$/.test(url)) {
      url = `${url}:${DEFAULT_PORT}`;
    }
  }

  return url;
}

/**
 * Retrieves the active API Base URL dynamically from localStorage or environment fallback.
 */
export function getApiBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('serverBaseUrl') || localStorage.getItem('serverIp');
  if (saved && saved.trim()) {
    return normalizeApiUrl(saved);
  }
  return DEFAULT_BASE_URL;
}

/**
 * Persists a new API Base URL to localStorage and notifies the application.
 */
export function setApiBaseUrl(input) {
  const normalized = normalizeApiUrl(input);
  localStorage.setItem(STORAGE_KEY, normalized);
  localStorage.setItem('serverBaseUrl', normalized);

  // Dispatch event for reactive listeners in the React app
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hospital_api_url_changed', { detail: normalized }));
  }
  return normalized;
}

/**
 * Resets the API Base URL to localhost default.
 */
export function resetApiBaseUrl() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('serverBaseUrl');
  localStorage.removeItem('serverIp');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hospital_api_url_changed', { detail: DEFAULT_BASE_URL }));
  }
  return DEFAULT_BASE_URL;
}

/**
 * Tests connection to a given target API server with a timeout and latency measurement.
 */
export async function testServerConnection(targetInput) {
  const targetUrl = normalizeApiUrl(targetInput);
  const startTime = Date.now();

  // Create an abort controller with 5-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // First try the health endpoint
    let res;
    try {
      res = await fetch(`${targetUrl}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
    } catch (healthErr) {
      // Fallback check to check-admin if health route is unmapped
      res = await fetch(`${targetUrl}/api/v1/check-admin`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
    }

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (res && (res.ok || res.status < 500)) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        latency,
        url: targetUrl,
        data
      };
    } else {
      return {
        success: false,
        url: targetUrl,
        error: `Server responded with status HTTP ${res.status}`
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    let errorMessage = err.message || 'Connection failed';
    if (err.name === 'AbortError') {
      errorMessage = 'Connection timed out (5s). Please verify the IP address, Port, and Wi-Fi network.';
    } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      errorMessage = 'Unable to reach the server. Ensure the Main System is running and both systems are on the same Wi-Fi.';
    }
    return {
      success: false,
      url: targetUrl,
      error: errorMessage
    };
  }
}

/**
 * Builds standard authentication headers with Bearer token.
 */
export function getAuthHeaders(contentType = 'application/json') {
  const accessToken = localStorage.getItem('accessToken');
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

/**
 * Returns currently saved Bearer token.
 */
export function getBearerToken() {
  return localStorage.getItem('accessToken') || null;
}

/**
 * Helper fetch wrapper that automatically prefixes the active Base URL.
 */
export async function apiFetch(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    ...getAuthHeaders(options.contentType !== undefined ? options.contentType : 'application/json'),
    ...(options.headers || {})
  };

  // If body is FormData, don't set Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}
