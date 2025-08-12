import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateDoctor,
  EditDoctor,
  DoctorTable,
} from '@pages/doctors/doctor.models';
import { environment } from '@env/environments';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly medicoUrl = environment.apiUrl + 'medicos';

  constructor(private http: HttpClient) {}

  listar(): Observable<DoctorTable[]> {
    return this.http.get<DoctorTable[]>(this.medicoUrl);
  }

  buscarPorId(id: number): Observable<EditDoctor> {
    return this.http.get<EditDoctor>(`${this.medicoUrl}/${id}`);
  }

  cadastrar(medico: CreateDoctor): Observable<DoctorTable> {
    return this.http.post<DoctorTable>(this.medicoUrl, medico);
  }

  atualizar(id: number, medico: EditDoctor): Observable<DoctorTable> {
    return this.http.put<DoctorTable>(`${this.medicoUrl}/${id}`, medico);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicoUrl}/${id}`);
  }

  ativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.medicoUrl}/ativar/${id}`, {});
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.medicoUrl}/inativar/${id}`, {});
  }
}
