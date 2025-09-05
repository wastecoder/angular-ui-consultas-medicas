import { Injectable } from '@angular/core';
import { DoctorProfile } from '@pages/doctors/doctor.models';

@Injectable({
  providedIn: 'root',
})
export class FormattingService {
  formatCrm(doctor: Pick<DoctorProfile, 'crmSigla' | 'crmDigitos'>): string {
    return `CRM/${doctor.crmSigla} ${doctor.crmDigitos}`;
  }

  formatTelephone(telefone: string): string {
    if (!telefone) return '';
    const clean = telefone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return telefone;
  }
}
