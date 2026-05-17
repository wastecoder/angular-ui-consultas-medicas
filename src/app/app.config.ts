import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideNgxMask } from 'ngx-mask'; // Importando ngx-mask
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { ptBR } from 'date-fns/locale';
import { authInterceptor } from './services/apis/auth/auth.interceptor';
import { loadingInterceptor } from './services/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNgxMask(),
    provideDateFnsAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: ptBR },
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor]))
  ],
};
