import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppointmentFormComponent } from '../components/appointment-form/appointment-form.component';
import { AppointmentService } from '@services/apis/appointment/appointment.service';
import { PatientService } from '@services/apis/patient/patient.service';
import { AuthService } from '@services/apis/auth/auth.service';
import { ConsultaCadastroPayload, PessoaResumo } from '../appointment.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [AppointmentFormComponent],
  templateUrl: './appointment-create.component.html',
})
export class AppointmentCreateComponent implements OnInit {
  loading = signal(false);

  // Fluxo de agendamento pelo paciente: o paciente é travado nele mesmo.
  readonly fluxoPaciente: boolean;
  pacienteFixo = signal<PessoaResumo | null>(null);
  erroPerfil = signal(false);

  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private auth: AuthService,
    private router: Router,
    private snackbar: SnackbarService
  ) {
    this.fluxoPaciente =
      this.auth.hasRole('PACIENTE') &&
      !this.auth.hasRole('ADMIN') &&
      !this.auth.hasRole('RECEPCIONISTA');
  }

  ngOnInit(): void {
    if (!this.fluxoPaciente) return;

    this.patientService.meuPerfil().subscribe({
      next: (p) => this.pacienteFixo.set({ id: p.id, nome: p.nome }),
      error: (err) => {
        console.error('Erro ao carregar perfil do paciente', err);
        this.erroPerfil.set(true);
        this.snackbar.show(
          'Não foi possível carregar seus dados para o agendamento.',
          'error'
        );
      },
    });
  }

  cadastrar(consulta: ConsultaCadastroPayload) {
    this.loading.set(true);
    this.appointmentService
      .cadastrar(consulta)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackbar.show('Consulta cadastrada com sucesso!', 'success');
          this.router.navigate(['/appointments']);
        },
        error: (err) => {
          console.error('Erro ao cadastrar consulta', err);

          if (err.status === 409) {
            this.snackbar.show(
              'Horário indisponível para o médico ou paciente selecionado.',
              'warning'
            );
          } else if (err.status === 400) {
            const mensagem =
              err.error?.message ??
              'Dados inválidos para o cadastro da consulta.';
            this.snackbar.show(mensagem, 'warning');
          } else {
            this.snackbar.show(
              'Erro inesperado ao cadastrar consulta.',
              'error'
            );
          }
        },
      });
  }
}
