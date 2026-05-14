import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DoctorFormComponent } from '../components/doctor-form/doctor-form.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { DoctorPayload, DoctorProfile } from '../doctor.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-doctor-edit',
  standalone: true,
  imports: [DoctorFormComponent],
  templateUrl: './doctor-edit.component.html',
})
export class DoctorEditComponent implements OnInit {
  medicoId!: number;
  medico: DoctorProfile | null = null;
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private medicoService: DoctorService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.medicoId = Number(idParam);

    if (!this.medicoId) {
      this.snackbar.show('ID de médico inválido.', 'error');
      return;
    }

    this.loading.set(true);
    this.medicoService
      .buscarPorId(this.medicoId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dados: DoctorProfile) => {
          this.medico = dados;
        },
        error: (err) => {
          console.error('Erro ao carregar médico:', err);
          const errorMessage =
            err.error?.message ?? 'Erro ao carregar dados do médico.';
          this.snackbar.show(errorMessage, 'error');
          this.router.navigate(['/doctors']);
        },
      });
  }

  onSalvar(medicoAtualizado: DoctorPayload) {
    this.loading.set(true);
    this.medicoService
      .atualizar(this.medicoId, medicoAtualizado)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Médico atualizado com sucesso!', 'success');
          this.router.navigate([`/doctors/${this.medicoId}/profile`]);
        },
        error: (err) => {
          console.error('Erro ao atualizar médico:', err);

          if (err.status === 409) {
            this.snackbar.show('Conflito: algum dado duplicado.', 'warning');
          } else {
            this.snackbar.show('Erro inesperado ao atualizar médico.', 'error');
          }
        },
      });
  }
}
