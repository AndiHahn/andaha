export const environment = {
  production: true,
  dapr: true,
  gatewayBaseUrl : "#{gatewayBaseUrl}#",
  authIssuerUrl: '#{authIssuerUrl}#',
  authRedirectUrl: window.location.origin,
  authClientId: 'miniclient',
  authResponseType: 'code',
  authScope: 'openid profile offline_access shopping collaboration',
  authShowDebugInformation: true,
};
