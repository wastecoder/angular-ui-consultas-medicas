import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DoctorFormComponent } from '../components/doctor-form/doctor-form.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { DoctorPayload } from '../doctor.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-doctor-create',
  standalone: true,
  imports: [DoctorFormComponent],
  templateUrl: './doctor-create.component.html',
})
export class DoctorCreateComponent {
  loading = signal(false);

  constructor(
    private medicoService: DoctorService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  cadastrar(medico: DoctorPayload) {
    this.loading.set(true);
    this.medicoService
      .cadastrar(medico)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
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
