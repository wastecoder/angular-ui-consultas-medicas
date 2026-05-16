import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { PatientService } from '@services/apis/patient/patient.service';
import { PacienteProfile } from '@pages/patients/patient.models';
import { FormattingService } from '@shared/services/formatting.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.css',
})
export class PatientProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientService = inject(PatientService);
  private readonly dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  patient!: PacienteProfile;
  loading = signal(false);

  constructor(private readonly formatting: FormattingService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.patientService
      .buscarPorId(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.patient = data;
        },
        error: (err) => {
          console.error('Erro ao carregar paciente:', err);
          const mensagemErro =
            err.error?.message ?? 'Erro ao carregar paciente.';
          this.snackbar.show(mensagemErro, 'error');
          this.router.navigate(['/patients']);
        },
      });
  }

  update(paciente: PacienteProfile) {
    this.router.navigate(['/patients', paciente.id, 'edit']);
  }

  async activate(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Ativar paciente',
      content: `Tem certeza que deseja ativar o paciente ${this.patient.nome}?`,
      type: 'activate',
    });

    if (confirmed) {
      this.loading.set(true);
      this.patientService
        .ativar(this.patient.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.patient.ativo = true;
            this.snackbar.show('Paciente ativado com sucesso!', 'success');
          },
          error: (err) => {
            console.error('Erro ao ativar paciente:', err);
            this.snackbar.show('Erro inesperado ao ativar paciente.', 'error');
          },
        });
    }
  }

  async deactivate(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Inativar paciente',
      content: `Tem certeza que deseja inativar o paciente ${this.patient.nome}?`,
      type: 'deactivate',
    });

    if (confirmed) {
      this.loading.set(true);
      this.patientService
        .inativar(this.patient.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.patient.ativo = false;
            this.snackbar.show('Paciente inativado com sucesso!', 'success');
          },
          error: (err) => {
            console.error('Erro ao inativar paciente:', err);
            this.snackbar.show('Erro inesperado ao inativar paciente.', 'error');
          },
        });
    }
  }

  async delete(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir paciente',
      content: `Tem certeza que deseja excluir o paciente ${this.patient.nome}?`,
      type: 'delete',
    });

    if (confirmed) {
      this.loading.set(true);
      this.patientService
        .excluir(this.patient.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.snackbar.show('Paciente excluído com sucesso!', 'success');
            this.router.navigate(['/patients']);
          },
          error: (err) => {
            console.error('Erro ao excluir paciente:', err);
            this.snackbar.show('Erro inesperado ao excluir paciente.', 'error');
          },
        });
    }
  }

  get cpfFormatted(): string {
    return this.formatting.formatCpf(this.patient.cpf);
  }

  get telephoneFormatted(): string {
    return this.formatting.formatTelephone(this.patient.telefone);
  }

  get initials(): string {
    const words = this.patient.nome.split(/\s+/).filter((w) => w.length > 0);
    const first = words[0]?.[0] ?? '';
    const second = words[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  }
}
