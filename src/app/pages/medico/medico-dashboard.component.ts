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
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConsultaTable } from '@pages/appointments/appointment.models';
import { STATUS_CONSULTA_LABEL } from '@pages/appointments/appointment.constants';
import { DoctorProfile } from '@pages/doctors/doctor.models';

interface ResumoDia {
  realizadas: number;
  pendentes: number;
  canceladas: number;
  taxaComparecimento: string;
}

@Component({
  selector: 'app-medico-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  templateUrl: './medico-dashboard.component.html',
  styleUrl: './medico-dashboard.component.css',
})
export class MedicoDashboardComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly snackbar = inject(SnackbarService);

  readonly dataHoje = this.formatarDataHoje();

  // O médico logado é resolvido no back: o perfil vem de /medicos/meu-perfil
  // e a agenda de /consultas (que o back já filtra pelo médico autenticado).
  medico = signal<DoctorProfile | null>(null);
  consultas = signal<ConsultaTable[]>([]);
  carregando = signal(true);
  realizando = signal(false);
  erroPerfil = signal(false);

  // Próxima consulta: a primeira AGENDADA cujo horário ainda não passou.
  proximaConsulta = computed<ConsultaTable | null>(() => {
    const pendentes = this.consultas()
      .filter((c) => c.status === 'AGENDADA')
      .filter((c) => this.minutosAteInicio(c) >= 0);
    return pendentes[0] ?? null;
  });

  resumo = computed<ResumoDia>(() => {
    const lista = this.consultas();
    const realizadas = lista.filter((c) => c.status === 'REALIZADA').length;
    const pendentes = lista.filter((c) => c.status === 'AGENDADA').length;
    const canceladas = lista.filter((c) => c.status === 'CANCELADA').length;
    const base = realizadas + canceladas;
    const taxaComparecimento =
      base === 0 ? '—' : `${Math.round((realizadas / base) * 100)}%`;
    return { realizadas, pendentes, canceladas, taxaComparecimento };
  });

  ngOnInit(): void {
    this.carregarPerfil();
    this.carregarAgenda();
  }

  recarregar(): void {
    this.carregarPerfil();
    this.carregarAgenda();
  }

  private carregarPerfil(): void {
    this.erroPerfil.set(false);
    this.doctorService.meuPerfil().subscribe({
      next: (perfil) => this.medico.set(perfil),
      error: (err) => {
        this.erroPerfil.set(true);
        this.notifyError(err, 'Erro ao carregar os seus dados de médico.');
      },
    });
  }

  carregarAgenda(): void {
    this.carregando.set(true);
    this.appointmentService
      .listarComFiltros(0, 100, { dataAtendimento: this.hojeISO() })
      .subscribe({
        next: (page) => {
          const ordenadas = [...page.content].sort((a, b) =>
            a.horarioAtendimento.localeCompare(b.horarioAtendimento)
          );
          this.consultas.set(ordenadas);
          this.carregando.set(false);
        },
        error: (err) => {
          this.carregando.set(false);
          this.notifyError(err, 'Erro ao carregar a agenda de hoje.');
        },
      });
  }

  iniciarAtendimento(): void {
    const consulta = this.proximaConsulta();
    if (!consulta || this.realizando()) return;

    this.realizando.set(true);
    this.appointmentService.realizar(consulta.id).subscribe({
      next: () => {
        this.realizando.set(false);
        this.snackbar.show('Consulta marcada como realizada.', 'success');
        this.carregarAgenda();
      },
      error: (err) => {
        this.realizando.set(false);
        this.notifyError(err, 'Erro ao marcar a consulta como realizada.');
      },
    });
  }

  // ----- Formatação e helpers de exibição -----

  formatHora(hora: string): string {
    return hora?.length >= 5 ? hora.substring(0, 5) : hora ?? '';
  }

  intervaloHorario(consulta: ConsultaTable): string {
    const inicio = this.formatHora(consulta.horarioAtendimento);
    const fim = this.somarMinutos(inicio, consulta.duracaoEmMinutos);
    return `${inicio} – ${fim}`;
  }

  formatPreco(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor ?? 0);
  }

  iniciais(): string {
    const nome = this.medico()?.nome?.trim();
    if (!nome) return '–';
    const partes = nome.split(/\s+/);
    const primeira = partes[0]?.charAt(0) ?? '';
    const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (primeira + ultima).toUpperCase();
  }

  tempoParaProxima(consulta: ConsultaTable): string {
    const minutos = this.minutosAteInicio(consulta);
    if (minutos <= 0) return 'Agora';
    if (minutos < 60) return `Em ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto === 0 ? `Em ${horas}h` : `Em ${horas}h ${resto}min`;
  }

  timelineClasse(consulta: ConsultaTable): string {
    if (consulta.status === 'REALIZADA') return 'status-done';
    if (consulta.status === 'CANCELADA') return 'status-canceled';
    return consulta.id === this.proximaConsulta()?.id
      ? 'status-now'
      : 'status-pending';
  }

  timelineLabel(consulta: ConsultaTable): string {
    if (
      consulta.status === 'AGENDADA' &&
      consulta.id === this.proximaConsulta()?.id
    ) {
      return 'Próxima';
    }
    return STATUS_CONSULTA_LABEL[consulta.status];
  }

  private minutosAteInicio(consulta: ConsultaTable): number {
    const [h, m] = consulta.horarioAtendimento.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h ?? 0, m ?? 0, 0, 0);
    return Math.round((inicio.getTime() - Date.now()) / 60000);
  }

  private somarMinutos(hora: string, minutos: number): string {
    const [h, m] = hora.split(':').map(Number);
    const total = (h ?? 0) * 60 + (m ?? 0) + (minutos ?? 0);
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  private hojeISO(): string {
    const agora = new Date();
    const offset = agora.getTimezoneOffset() * 60000;
    return new Date(agora.getTime() - offset).toISOString().slice(0, 10);
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
