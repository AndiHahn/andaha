export const environment = {
  production: true,
  gatewayBaseUrl : "https://localhost:8000",
  authIssuerUrl: 'https://localhost:8100',
  authRedirectUrl: window.location.origin,
  authClientId: 'miniclient',
  authResponseType: 'code',
  authScope: 'openid profile offline_access shopping',
  authShowDebugInformation: true,
};
