import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MedicoFormComponent } from '../components/medico-form/medico-form.component';
import { MedicoService } from '../../services/apis/medicos/medico.service';
import { MedicoCreate } from '../medico.models';

@Component({
  selector: 'app-novo-medico',
  standalone: true,
  imports: [MedicoFormComponent],
  templateUrl: './novo-medico.component.html',
})
export class NovoMedicoComponent {
  mensagemErro: string | null = null;

  constructor(private medicoService: MedicoService, private router: Router) {}

  cadastrar(medico: MedicoCreate) {
    this.mensagemErro = null; // limpa erro anterior

    this.medicoService.cadastrar(medico).subscribe({
      next: () => {
        alert('Médico cadastrado com sucesso!');
        this.router.navigate(['/medicos/lista']);
      },
      error: (err) => {
        console.error('Erro ao cadastrar médico', err);
        if (err.status === 409) {
          this.mensagemErro =
            err.error?.message || 'Erro de conflito ao cadastrar.';
        } else {
          this.mensagemErro = 'Erro inesperado ao cadastrar médico.';
        }
      },
    });
  }
}
