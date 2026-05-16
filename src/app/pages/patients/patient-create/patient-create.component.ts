import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientFormComponent } from '../components/patient-form/patient-form.component';
import { PatientService } from '@services/apis/patient/patient.service';
import { PacientePayload } from '../patient.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-patient-create',
  standalone: true,
  imports: [PatientFormComponent],
  templateUrl: './patient-create.component.html',
})
export class PatientCreateComponent {
  loading = signal(false);

  constructor(
    private pacienteService: PatientService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  cadastrar(paciente: PacientePayload) {
    this.loading.set(true);
    this.pacienteService
      .cadastrar(paciente)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Paciente cadastrado com sucesso!', 'success');
          this.router.navigate(['/patients']);
        },
        error: (err) => {
          console.error('Erro ao cadastrar paciente', err);

          if (err.status === 409) {
            this.snackbar.show('Conflito: algum dado duplicado.', 'warning');
          } else {
            this.snackbar.show(
              'Erro inesperado ao cadastrar paciente.',
              'error'
            );
          }
        },
      });
  }
}
