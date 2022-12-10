export const environment = {
  production: true,
  dapr: false,
  useMonolithApi: true,
  monolithApiBaseUrl: "https://localhost:8900",
  gatewayBaseUrl : "https://localhost:8000",
  authIssuerUrl: 'https://localhost:8100',
  authRedirectUrl: window.location.origin,
  authClientId: 'miniclient',
  authResponseType: 'code',
  authScope: 'openid profile offline_access shopping collaboration budgetplan monolith',
  authShowDebugInformation: true,
};
