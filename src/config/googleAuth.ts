export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export const GOOGLE_OAUTH_CONFIG = {
  clientId: GOOGLE_CLIENT_ID,
  scope: 'openid email profile',
  redirectUri: window.location.origin + '/auth/callback'
};

// Debug logging
console.log('Google OAuth Config:', {
  hasClientId: !!GOOGLE_CLIENT_ID,
  clientIdLength: GOOGLE_CLIENT_ID.length
}); 