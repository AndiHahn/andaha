// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  dapr: true,
  useMonolithApi: true,
  monolithApiBaseUrl: "http://localhost:9900",
  gatewayBaseUrl : "http://localhost:9000",
  authIssuerUrl: 'http://localhost:9100',
  authRedirectUrl: window.location.origin,
  authClientId: 'miniclient',
  authResponseType: 'code',
  authScope: 'openid profile offline_access shopping collaboration budgetplan monolith',
  authShowDebugInformation: true,
};

/*
export const environment = {
  production: false,
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
*/

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
