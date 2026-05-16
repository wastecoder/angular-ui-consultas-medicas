import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PatientFormComponent } from '../components/patient-form/patient-form.component';
import { PatientService } from '@services/apis/patient/patient.service';
import { PacientePayload, PacienteProfile } from '../patient.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-patient-edit',
  standalone: true,
  imports: [PatientFormComponent],
  templateUrl: './patient-edit.component.html',
})
export class PatientEditComponent implements OnInit {
  pacienteId!: number;
  paciente: PacienteProfile | null = null;
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private pacienteService: PatientService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.pacienteId = Number(idParam);

    if (!this.pacienteId) {
      this.snackbar.show('ID de paciente inválido.', 'error');
      return;
    }

    this.loading.set(true);
    this.pacienteService
      .buscarPorId(this.pacienteId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dados: PacienteProfile) => {
          this.paciente = dados;
        },
        error: (err) => {
          console.error('Erro ao carregar paciente:', err);
          const errorMessage =
            err.error?.message ?? 'Erro ao carregar dados do paciente.';
          this.snackbar.show(errorMessage, 'error');
          this.router.navigate(['/patients']);
        },
      });
  }

  onSalvar(pacienteAtualizado: PacientePayload) {
    this.loading.set(true);
    this.pacienteService
      .atualizar(this.pacienteId, pacienteAtualizado)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Paciente atualizado com sucesso!', 'success');
          this.router.navigate([`/patients/${this.pacienteId}/profile`]);
        },
        error: (err) => {
          console.error('Erro ao atualizar paciente:', err);

          if (err.status === 409) {
            this.snackbar.show('Conflito: algum dado duplicado.', 'warning');
          } else {
            this.snackbar.show(
              'Erro inesperado ao atualizar paciente.',
              'error'
            );
          }
        },
      });
  }
}
