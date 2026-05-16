import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AppointmentService } from '@services/apis/appointment/appointment.service';
import { ConsultaProfile } from '@pages/appointments/appointment.models';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { DialogService } from '@shared/components/yes-no-dialog/dialog.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

@Component({
  selector: 'app-appointment-profile',
  standalone: true,
  imports: [CommonModule, HasRoleDirective],
  templateUrl: './appointment-profile.component.html',
  styleUrl: './appointment-profile.component.css',
})
export class AppointmentProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentService = inject(AppointmentService);
  private readonly dialogService = inject(DialogService);
  private readonly snackbar = inject(SnackbarService);

  consulta!: ConsultaProfile;
  loading = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.appointmentService
      .buscarPorId(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.consulta = data;
        },
        error: (err) => {
          console.error('Erro ao carregar consulta:', err);
          const mensagemErro =
            err.error?.message ?? 'Erro ao carregar consulta.';
          this.snackbar.show(mensagemErro, 'error');
          this.router.navigate(['/appointments']);
        },
      });
  }

  update() {
    this.router.navigate(['/appointments', this.consulta.id, 'edit']);
  }

  async realizar(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Marcar consulta como realizada',
      content: `Confirma que a consulta de ${this.consulta.paciente.nome} com Dr(a). ${this.consulta.medico.nome} foi realizada?`,
      type: 'activate',
    });

    if (!confirmed) return;
    this.alterarStatus('REALIZADA', 'Consulta marcada como realizada.');
  }

  async cancelar(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Cancelar consulta',
      content: `Tem certeza que deseja cancelar a consulta de ${this.consulta.paciente.nome} com Dr(a). ${this.consulta.medico.nome}?`,
      type: 'deactivate',
    });

    if (!confirmed) return;
    this.alterarStatus('CANCELADA', 'Consulta cancelada com sucesso.');
  }

  async delete(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir consulta',
      content: `Tem certeza que deseja excluir esta consulta?`,
      type: 'delete',
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.appointmentService
      .excluir(this.consulta.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Consulta excluída com sucesso!', 'success');
          this.router.navigate(['/appointments']);
        },
        error: (err) => {
          console.error('Erro ao excluir consulta:', err);
          this.snackbar.show('Erro inesperado ao excluir consulta.', 'error');
        },
      });
  }

  get dataAtendimentoBR(): string {
    return new Date(this.consulta.dataAtendimento + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  get dataAgendamentoBR(): string {
    if (!this.consulta?.dataAgendamento) return '—';
    return new Date(this.consulta.dataAgendamento).toLocaleString('pt-BR');
  }

  get horaFormatada(): string {
    const h = this.consulta.horarioAtendimento ?? '';
    return h.length >= 5 ? h.substring(0, 5) : h;
  }

  get precoFormatado(): string {
    return Number(this.consulta.preco ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  get statusLabel(): string {
    return STATUS_CONSULTA_LABEL[this.consulta.status];
  }

  statusClasse(status: StatusConsulta): string {
    return `status-${status.toLowerCase()}`;
  }

  private alterarStatus(novoStatus: StatusConsulta, mensagemSucesso: string): void {
    this.loading.set(true);
    this.appointmentService
      .alterarStatus(this.consulta.id, novoStatus, this.consulta)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.consulta.status = novoStatus;
          this.snackbar.show(mensagemSucesso, 'success');
        },
        error: (err) => {
          console.error('Erro ao alterar status da consulta:', err);
          const mensagem =
            err.error?.message ?? 'Erro inesperado ao alterar status da consulta.';
          this.snackbar.show(mensagem, 'error');
        },
      });
  }
}
