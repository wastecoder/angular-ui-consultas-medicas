import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MedicoCreate } from '../../medico.models';

@Component({
  selector: 'app-medico-form',
  standalone: true,
  templateUrl: './medico-form.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
})
export class MedicoFormComponent {
  @Output() salvar = new EventEmitter<MedicoCreate>();

  medico: MedicoCreate = {
    nome: '',
    email: '',
    crmSigla: '',
    crmDigitos: '',
    especialidade: '',
    telefone: '',
  };

  // Lista das siglas CRM (mesmo enum do back-end)
  siglasCrm: string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  onSubmit() {
    console.log(JSON.stringify(this.medico, null, 2));
    this.salvar.emit(this.medico);
  }
}
