export const environment = {
  production: true,
  useGateway: false,
  useMonolithApi: true,
  monolithApiBaseUrl: "#{monolithApiBaseUrl}#",
  gatewayBaseUrl : "#{gatewayBaseUrl}#",
  loginDomain: 'andreasorganization.b2clogin.com',
  authTenant: 'andreasorganization',
  authTenantId: '3e43c7d4-5672-4b6f-b26d-0c65646378d8',
  authPolicy: 'B2C_1_SignUpSignIn',
  authRedirectUrl: window.location.origin + "/",
  authClientId: '#{authClientId}#',
  authResponseType: 'code',
  authScope: '#{authScope}#',
  authShowDebugInformation: false,
};
