// Simple in-memory token store for refresh tokens and revoked access tokens.
// For production use a persistent store (Redis, DB).
const refreshTokens = new Set();
const revokedAccessTokens = new Set();

module.exports = {
  addRefreshToken(token) { refreshTokens.add(token); },
  hasRefreshToken(token) { return refreshTokens.has(token); },
  deleteRefreshToken(token) { refreshTokens.delete(token); },
  clearRefreshTokens() { refreshTokens.clear(); },
  getRefreshTokens() { return Array.from(refreshTokens); },

  addRevokedAccessToken(token) { revokedAccessTokens.add(token); },
  hasRevokedAccessToken(token) { return revokedAccessTokens.has(token); },
  deleteRevokedAccessToken(token) { revokedAccessTokens.delete(token); },
  clearRevokedAccessTokens() { revokedAccessTokens.clear(); },
};
