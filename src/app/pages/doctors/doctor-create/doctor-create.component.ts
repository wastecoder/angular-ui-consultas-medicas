import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorFormComponent } from '../components/doctor-form/doctor-form.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { CreateDoctor } from '../doctor.models';
import { SnackbarService } from '@shared/snackbar/snackbar.service';

@Component({
  selector: 'app-doctor-create',
  standalone: true,
  imports: [DoctorFormComponent],
  templateUrl: './doctor-create.component.html',
})
export class DoctorCreateComponent {
  constructor(
    private medicoService: DoctorService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  cadastrar(medico: CreateDoctor) {
    this.medicoService.cadastrar(medico).subscribe({
      next: () => {
        this.snackbar.show('Médico cadastrado com sucesso!', 'success');
        this.router.navigate(['/doctors']);
      },
      error: (err) => {
        console.error('Erro ao cadastrar médico', err);

        if (err.status === 409) {
          this.snackbar.show('Conflito: algum dado duplicado.', 'warning');
        } else {
          this.snackbar.show('Erro inesperado ao cadastrar médico.', 'error');
        }
      },
    });
  }
}
