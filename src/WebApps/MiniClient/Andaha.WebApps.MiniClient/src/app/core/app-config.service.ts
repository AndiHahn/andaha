import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface AppConfig {
  gatewayBaseUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private cachedAppConfig?: AppConfig;

  constructor(private http: HttpClient) { }

  private fetchAppConfig(): Promise<AppConfig> {
    return new Promise((resolve, reject) => {
      const url = `assets/appConfig/appConfig.json`;
      return this.http.get<AppConfig>(url).subscribe(resolve, reject);
    });
  }

  public async init(): Promise<AppConfig> {
    this.cachedAppConfig = await this.fetchAppConfig();
    return this.cachedAppConfig;
  }

  public getAppConfigFromCache(): AppConfig {
    if (!this.cachedAppConfig) {
      throw new Error('Before using the config service you need to call and wait for init() to finish.');
    }
    return this.cachedAppConfig;
  }

  public async getAppConfig(): Promise<AppConfig> {
    if (!this.cachedAppConfig) {
      return this.init();
    }
    return Promise.resolve(this.cachedAppConfig);
  }
}
