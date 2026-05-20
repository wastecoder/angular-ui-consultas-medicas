import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { RelatorioOperacionalService } from '@services/apis/relatorio-operacional/relatorio-operacional.service';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { PatientService } from '@services/apis/patient/patient.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AuthService } from '@services/apis/auth/auth.service';
import { ConsultasPorData } from '@pages/dashboards/operational/operational.models';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';

const STATUS_CLASSE: Record<StatusConsulta, string> = {
  AGENDADA: 'status-waiting',
  REALIZADA: 'status-done',
  CANCELADA: 'status-late',
};

@Component({
  selector: 'app-recepcionista-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  templateUrl: './recepcionista-dashboard.component.html',
  styleUrl: './recepcionista-dashboard.component.css',
})
export class RecepcionistaDashboardComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioOperacionalService);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly snackbar = inject(SnackbarService);
  private readonly auth = inject(AuthService);

  consultasHoje = signal<ConsultasPorData[]>([]);
  totalConsultasHoje = signal<number | null>(null);
  medicosAtivos = signal<number | null>(null);
  pacientesAtivos = signal<number | null>(null);

  readonly nomeUsuario = this.resolverNomeUsuario();
  readonly dataHoje = this.formatarDataHoje();

  ngOnInit(): void {
    this.relatorioService.consultasPorData(0, 50).subscribe({
      next: (page) => {
        this.consultasHoje.set(page.content);
        this.totalConsultasHoje.set(page.totalElements);
      },
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar as consultas de hoje.'),
    });

    this.doctorService.listarComFiltros(0, 1, { ativo: true }).subscribe({
      next: (page) => this.medicosAtivos.set(page.totalElements),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar os médicos ativos.'),
    });

    this.patientService.listarComFiltros(0, 1, { ativo: true }).subscribe({
      next: (page) => this.pacientesAtivos.set(page.totalElements),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar os pacientes ativos.'),
    });
  }

  formatHora(hora: string): string {
    return hora?.length >= 5 ? hora.substring(0, 5) : hora ?? '';
  }

  statusLabel(status: StatusConsulta): string {
    return STATUS_CONSULTA_LABEL[status];
  }

  statusClasse(status: StatusConsulta): string {
    return STATUS_CLASSE[status];
  }

  private resolverNomeUsuario(): string {
    const data = this.auth.getUserData();
    return data?.nome ?? data?.name ?? data?.username ?? 'Recepcionista';
  }

  private formatarDataHoje(): string {
    const formatado = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    return formatado.charAt(0).toUpperCase() + formatado.slice(1);
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
