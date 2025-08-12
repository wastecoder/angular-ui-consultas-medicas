import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorFormComponent } from '../components/doctor-form/doctor-form.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { CreateDoctor } from '../doctor.models';

@Component({
  selector: 'app-doctor-create',
  standalone: true,
  imports: [DoctorFormComponent],
  templateUrl: './doctor-create.component.html',
})
export class DoctorCreateComponent {
  mensagemErro: string | null = null;

  constructor(private medicoService: DoctorService, private router: Router) {}

  cadastrar(medico: CreateDoctor) {
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
