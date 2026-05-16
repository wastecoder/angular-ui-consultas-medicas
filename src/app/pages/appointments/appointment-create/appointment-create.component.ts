import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppointmentFormComponent } from '../components/appointment-form/appointment-form.component';
import { AppointmentService } from '@services/apis/appointment/appointment.service';
import { ConsultaCadastroPayload } from '../appointment.models';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [AppointmentFormComponent],
  templateUrl: './appointment-create.component.html',
})
export class AppointmentCreateComponent {
  loading = signal(false);

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

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
