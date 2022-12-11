export const environment = {
  production: true,
  useGateway: false,
  useMonolithApi: true,
  monolithApiBaseUrl: "#{monolithApiBaseUrl}#",
  gatewayBaseUrl : "#{gatewayBaseUrl}#",
  authIssuerUrl: '#{authIssuerUrl}#',
  authRedirectUrl: window.location.origin,
  authClientId: 'miniclient',
  authResponseType: 'code',
  authScope: 'openid profile offline_access shopping collaboration budgetplan monolith',
  authShowDebugInformation: true,
};
