import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppointmentFormComponent } from '../components/appointment-form/appointment-form.component';
import { AppointmentService } from '@services/apis/appointment/appointment.service';
import {
  ConsultaAtualizacaoPayload,
  ConsultaCadastroPayload,
  ConsultaProfile,
} from '../appointment.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-appointment-edit',
  standalone: true,
  imports: [AppointmentFormComponent],
  templateUrl: './appointment-edit.component.html',
})
export class AppointmentEditComponent implements OnInit {
  consultaId!: number;
  consulta: ConsultaProfile | null = null;
  loading = signal(false);

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.consultaId = Number(idParam);

    if (!this.consultaId) {
      this.snackbar.show('ID de consulta inválido.', 'error');
      return;
    }

    this.loading.set(true);
    this.appointmentService
      .buscarPorId(this.consultaId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dados: ConsultaProfile) => {
          this.consulta = dados;
        },
        error: (err) => {
          console.error('Erro ao carregar consulta:', err);
          const errorMessage =
            err.error?.message ?? 'Erro ao carregar dados da consulta.';
          this.snackbar.show(errorMessage, 'error');
          this.router.navigate(['/appointments']);
        },
      });
  }

  onSalvar(consultaAtualizada: ConsultaCadastroPayload) {
    if (!this.consulta) return;

    // Preserva o status atual — mudança de status só acontece pelo perfil.
    const payload: ConsultaAtualizacaoPayload = {
      ...consultaAtualizada,
      status: this.consulta.status,
    };

    this.loading.set(true);
    this.appointmentService
      .atualizar(this.consultaId, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Consulta atualizada com sucesso!', 'success');
          this.router.navigate([`/appointments/${this.consultaId}/profile`]);
        },
        error: (err) => {
          console.error('Erro ao atualizar consulta:', err);

          if (err.status === 409) {
            this.snackbar.show(
              'Horário indisponível para o médico ou paciente selecionado.',
              'warning'
            );
          } else if (err.status === 400) {
            const mensagem =
              err.error?.message ??
              'Dados inválidos para a atualização da consulta.';
            this.snackbar.show(mensagem, 'warning');
          } else {
            this.snackbar.show(
              'Erro inesperado ao atualizar consulta.',
              'error'
            );
          }
        },
      });
  }
}
