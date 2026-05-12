import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { DoctorProfile } from '@pages/doctors/doctor.models';
import { FormattingService } from '@shared/services/formatting.service';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css',
})
export class DoctorProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly doctorService = inject(DoctorService);
  private readonly dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  doctor!: DoctorProfile;
  loading = signal(false);

  constructor(private readonly formatting: FormattingService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.doctorService
      .buscarPorId(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.doctor = data;
        },
        error: (err) => {
          console.error('Erro ao carregar médico:', err);
          const mensagemErro = err.error?.message ?? 'Erro ao carregar médico.';
          this.snackbar.show(mensagemErro, 'error');
          this.router.navigate(['/doctors']);
        },
      });
  }

  update(medico: DoctorProfile) {
    this.router.navigate(['/doctors', medico.id, 'edit']);
  }

  async activate(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Ativar médico',
      content: `Tem certeza que deseja ativar o médico ${this.doctor.nome}?`,
    });

    if (confirmed) {
      this.loading.set(true);
      this.doctorService
        .ativar(this.doctor.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.doctor.ativo = true;
            this.snackbar.show('Médico ativado com sucesso!', 'success');
          },
          error: (err) => {
            console.error('Erro ao ativar médico:', err);
            this.snackbar.show('Erro inesperado ao ativar médico.', 'error');
          },
        });
    }
  }

  async deactivate(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Inativar médico',
      content: `Tem certeza que deseja inativar o médico ${this.doctor.nome}?`,
    });

    if (confirmed) {
      this.loading.set(true);
      this.doctorService
        .inativar(this.doctor.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.doctor.ativo = false;
            this.snackbar.show('Médico inativado com sucesso!', 'success');
          },
          error: (err) => {
            console.error('Erro ao inativar médico:', err);
            this.snackbar.show('Erro inesperado ao inativar médico.', 'error');
          },
        });
    }
  }

  async delete(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir médico',
      content: `Tem certeza que deseja excluir o médico ${this.doctor.nome}?`,
    });

    if (confirmed) {
      this.loading.set(true);
      this.doctorService
        .excluir(this.doctor.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: () => {
            this.snackbar.show('Médico excluído com sucesso!', 'success');
            this.router.navigate(['/doctors']);
          },
          error: (err) => {
            console.error('Erro ao excluir médico:', err);
            this.snackbar.show('Erro inesperado ao excluir médico.', 'error');
          },
        });
    }
  }

  get crmFormatted(): string {
    return this.formatting.formatCrm(this.doctor);
  }

  get telephoneFormatted(): string {
    return this.formatting.formatTelephone(this.doctor.telefone);
  }
}
