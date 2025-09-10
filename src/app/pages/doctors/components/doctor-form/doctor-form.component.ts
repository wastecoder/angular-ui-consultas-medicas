import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { EditDoctor } from '@pages/doctors/doctor.models';
import { NgxMaskDirective } from 'ngx-mask';
import { SIGLAS_CRM, ESPECIALIDADES } from '@pages/doctors/doctor.constants';

@Component({
  selector: 'app-doctor-form',
  standalone: true,
  templateUrl: './doctor-form.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    NgxMaskDirective,
  ],
})
export class DoctorFormComponent {
  @Output() salvar = new EventEmitter<EditDoctor>();

  @Input() titulo: string = '';
  @Input() medico: EditDoctor = {
    nome: '',
    email: '',
    crmSigla: '',
    crmDigitos: '',
    especialidade: '',
    telefone: '',
  };

  siglasCrm = SIGLAS_CRM;
  especialidades = ESPECIALIDADES;

  onSubmit() {
    console.log(JSON.stringify(this.medico, null, 2));
    this.salvar.emit(this.medico);
  }

  shouldShowError(control: NgModel | null): boolean {
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(
    errors: ValidationErrors | null,
    fieldLabel: string,
    patternMessage?: string
  ): string {
    if (!errors) return '';

    if (errors['required']) {
      return `${fieldLabel} é obrigatório.`;
    } else if (errors['pattern'] && patternMessage) {
      return patternMessage || `${fieldLabel} está em formato inválido.`;
    } else if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldLabel} deve ter no mínimo ${requiredLength} caracteres.`;
    } else if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `${fieldLabel} deve ter no máximo ${requiredLength} caracteres.`;
    }

    return '';
  }
}
