// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

/*
export const environment = {
  production: false,
  useGateway: false,
  useMonolithApi: true,
  monolithApiBaseUrl: "http://localhost:9900",
  gatewayBaseUrl : "http://localhost:9000",
  loginDomain: 'login.andaha.work',
  authTenant: 'andreasorganization',
  authTenantId: '3e43c7d4-5672-4b6f-b26d-0c65646378d8',
  authPolicy: 'B2C_1_SignUpSignIn',
  authRedirectUrl: window.location.origin + "/",
  authClientId: 'bfbbb429-801d-4ac2-8dcf-f9d51bb010dc',
  authResponseType: 'code',
  authScope: 'https://andreasorganization.onmicrosoft.com/3b6deee3-2974-4acf-87e8-a0013be3bc8d/access_as_user',
  authShowDebugInformation: true,
};
*/

export const environment = {
  production: false,
  useGateway: false,
  useMonolithApi: true,
  monolithApiBaseUrl: "https://localhost:8900",
  gatewayBaseUrl : "https://localhost:8000",
  loginDomain: 'login.andaha.work',
  authTenant: 'andreasorganization',
  authTenantId: '3e43c7d4-5672-4b6f-b26d-0c65646378d8',
  authPolicy: 'B2C_1_SignUpSignIn',
  authRedirectUrl: window.location.origin + "/",
  authClientId: 'bfbbb429-801d-4ac2-8dcf-f9d51bb010dc',
  authResponseType: 'code',
  authScope: 'https://andreasorganization.onmicrosoft.com/3b6deee3-2974-4acf-87e8-a0013be3bc8d/access_as_user',
  authShowDebugInformation: true,
};
