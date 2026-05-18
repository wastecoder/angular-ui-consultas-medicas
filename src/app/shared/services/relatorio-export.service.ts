import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormatoExportacao } from '@shared/models/formato-exportacao';

@Injectable({ providedIn: 'root' })
export class RelatorioExportService {
  private readonly http = inject(HttpClient);

  baixar(
    baseUrl: string,
    path: string,
    formato: FormatoExportacao,
    extraParams: Record<string, string | number> = {}
  ): Observable<Blob> {
    let params = new HttpParams().set('formato', formato);
    for (const [chave, valor] of Object.entries(extraParams)) {
      params = params.set(chave, valor);
    }
    return this.http.get(`${baseUrl}/${path}`, {
      params,
      responseType: 'blob',
    });
  }
}
