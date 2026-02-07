export function getAuthHeaders(contentType = 'application/json') {
  const accessToken = localStorage.getItem('accessToken');
  const headers = { 'Content-Type': contentType };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return headers;
}

export function getBearerToken() {
  return localStorage.getItem('accessToken') || null;
}
