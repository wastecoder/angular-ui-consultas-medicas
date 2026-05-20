import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppointmentService } from '@services/apis/appointment/appointment.service';
import { PatientService } from '@services/apis/patient/patient.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConsultaTable } from '@pages/appointments/appointment.models';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { PacienteProfile } from '@pages/patients/patient.models';

const BADGE_CLASSE: Record<StatusConsulta, string> = {
  AGENDADA: 'pending',
  REALIZADA: 'done',
  CANCELADA: 'missed',
};

@Component({
  selector: 'app-paciente-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  templateUrl: './paciente-dashboard.component.html',
  styleUrl: './paciente-dashboard.component.css',
})
export class PacienteDashboardComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly snackbar = inject(SnackbarService);

  // O paciente logado é resolvido no back: o perfil vem de /pacientes/meu-perfil
  // e as consultas de /consultas (que o back já filtra pelo paciente autenticado).
  paciente = signal<PacienteProfile | null>(null);
  consultas = signal<ConsultaTable[]>([]);
  carregando = signal(true);
  erroPerfil = signal(false);

  primeiroNome = computed<string>(() => {
    const nome = this.paciente()?.nome?.trim();
    return nome ? nome.split(/\s+/)[0] : '';
  });

  // Link "Meus dados" — só navega depois que o perfil (e o id) carregam.
  meusDadosLink = computed<(string | number)[] | null>(() => {
    const id = this.paciente()?.id;
    return id ? ['/patients', id, 'profile'] : null;
  });

  // Próxima consulta: a primeira AGENDADA cujo horário ainda não passou.
  proximaConsulta = computed<ConsultaTable | null>(() => {
    const agora = Date.now();
    const pendentes = this.consultas()
      .filter((c) => c.status === 'AGENDADA')
      .filter((c) => this.dataHora(c).getTime() >= agora);
    return pendentes[0] ?? null;
  });

  // Últimas consultas: as que já passaram, da mais recente para a mais antiga.
  historico = computed<ConsultaTable[]>(() => {
    const agora = Date.now();
    return this.consultas()
      .filter((c) => this.dataHora(c).getTime() < agora)
      .sort((a, b) => this.dataHora(b).getTime() - this.dataHora(a).getTime())
      .slice(0, 6);
  });

  ngOnInit(): void {
    this.carregarPerfil();
    this.carregarConsultas();
  }

  recarregar(): void {
    this.carregarPerfil();
    this.carregarConsultas();
  }

  private carregarPerfil(): void {
    this.erroPerfil.set(false);
    this.patientService.meuPerfil().subscribe({
      next: (perfil) => this.paciente.set(perfil),
      error: (err) => {
        this.erroPerfil.set(true);
        this.notifyError(err, 'Erro ao carregar os seus dados de paciente.');
      },
    });
  }

  private carregarConsultas(): void {
    this.carregando.set(true);
    this.appointmentService.listarComFiltros(0, 100, {}).subscribe({
      next: (page) => {
        const ordenadas = [...page.content].sort((a, b) =>
          this.chaveOrdenacao(a).localeCompare(this.chaveOrdenacao(b))
        );
        this.consultas.set(ordenadas);
        this.carregando.set(false);
      },
      error: (err) => {
        this.carregando.set(false);
        this.notifyError(err, 'Erro ao carregar as suas consultas.');
      },
    });
  }

  // ----- Formatação e helpers de exibição -----

  mesAbreviado(consulta: ConsultaTable): string {
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(this.dataHora(consulta))
      .replace('.', '');
    return mes.charAt(0).toUpperCase() + mes.slice(1);
  }

  diaDoMes(consulta: ConsultaTable): string {
    return String(this.dataHora(consulta).getDate()).padStart(2, '0');
  }

  diaDaSemana(consulta: ConsultaTable): string {
    const dia = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(
      this.dataHora(consulta)
    );
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  }

  dataHoraExtenso(consulta: ConsultaTable): string {
    const dataFmt = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(this.dataHora(consulta));
    const hora = this.formatHora(consulta.horarioAtendimento).replace(':', 'h');
    return `${this.diaDaSemana(consulta)}, ${dataFmt} às ${hora}`;
  }

  dataCurta(consulta: ConsultaTable): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(this.dataHora(consulta));
  }

  formatHora(hora: string): string {
    return hora?.length >= 5 ? hora.substring(0, 5) : hora ?? '';
  }

  formatPreco(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor ?? 0);
  }

  badgeClasse(status: StatusConsulta): string {
    return BADGE_CLASSE[status];
  }

  badgeLabel(status: StatusConsulta): string {
    return STATUS_CONSULTA_LABEL[status];
  }

  private dataHora(consulta: ConsultaTable): Date {
    const [ano, mes, dia] = consulta.dataAtendimento.split('-').map(Number);
    const [hora, min] = (consulta.horarioAtendimento ?? '00:00')
      .split(':')
      .map(Number);
    return new Date(ano, (mes ?? 1) - 1, dia ?? 1, hora ?? 0, min ?? 0);
  }

  private chaveOrdenacao(consulta: ConsultaTable): string {
    return `${consulta.dataAtendimento}T${consulta.horarioAtendimento}`;
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
