import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideNgxMask } from 'ngx-mask'; // Importando ngx-mask
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/apis/auth/auth.interceptor';
import { loadingInterceptor } from './services/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNgxMask(),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor]))
  ],
};
