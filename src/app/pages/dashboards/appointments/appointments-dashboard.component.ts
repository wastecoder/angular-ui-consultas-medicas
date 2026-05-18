import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { finalize } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ArcElement,
  BarElement,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartConfiguration,
  ChartData,
} from 'chart.js';

import { PageResponse } from '@shared/models/pagination.model';
import { FormatoExportacao } from '@shared/models/formato-exportacao';
import { SnackbarService } from '@shared/services/snackbar.service';
import { FileDownloadService } from '@shared/services/file-download.service';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { PessoaResumo } from '@pages/appointments/appointment.models';
import { PersonAutocompleteComponent } from '@pages/appointments/components/person-autocomplete/person-autocomplete.component';
import { RelatorioConsultaService } from '@services/apis/relatorio-consulta/relatorio-consulta.service';
import {
  ConsultaResumoDto,
  ConsultasPorAnoDto,
  ConsultasPorEspecialidadeDto,
  ConsultasPorMesDto,
  ConsultasPorStatusDto,
} from './appointments.models';

Chart.register(
  ArcElement,
  BarElement,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const ORDER_STATUS: StatusConsulta[] = ['AGENDADA', 'REALIZADA', 'CANCELADA'];
const COLOR_STATUS: Record<StatusConsulta, string> = {
  AGENDADA: '#1976D2',
  REALIZADA: '#4CAF50',
  CANCELADA: '#F44336',
};

const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const COLOR_ESPECIALIDADE: Record<string, string> = {
  CARDIOLOGIA:   '#E53935',
  DERMATOLOGIA:  '#FB8C00',
  HEMATOLOGIA:   '#8E24AA',
  INFECTOLOGIA:  '#43A047',
  NEUROLOGIA:    '#1E88E5',
  OFTALMOLOGIA:  '#00ACC1',
  ORTOPEDIA:     '#6D4C41',
  PEDIATRIA:     '#FDD835',
  PSIQUIATRIA:   '#3949AB',
  RADIOLOGIA:    '#7CB342',
};
const FALLBACK_COLORS = ['#90A4AE', '#A1887F', '#9575CD', '#4DB6AC', '#FF8A65'];

interface PeriodoForm {
  inicio: FormControl<Date | null>;
  fim: FormControl<Date | null>;
}

@Component({
  selector: 'app-appointments-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    BaseChartDirective,
    PersonAutocompleteComponent,
  ],
  templateUrl: './appointments-dashboard.component.html',
  styleUrl: './appointments-dashboard.component.css',
})
export class AppointmentsDashboardComponent implements OnInit {
  private readonly service = inject(RelatorioConsultaService);
  private readonly snackbar = inject(SnackbarService);
  private readonly fileDownload = inject(FileDownloadService);

  readonly pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  // ---- Status: KPIs + doughnut ----
  status = signal<ConsultasPorStatusDto | null>(null);
  statusLoading = signal(false);

  // ---- Datasets agregados (chart + tabela): size grande única vez ----
  porMesAll = signal<ConsultasPorMesDto[]>([]);
  porMesLoading = signal(false);

  porAnoAll = signal<ConsultasPorAnoDto[]>([]);
  porAnoLoading = signal(false);

  porEspecialidadeAll = signal<ConsultasPorEspecialidadeDto[]>([]);
  porEspecialidadeLoading = signal(false);

  // ---- Listas paginadas (ConsultaResumoDto) ----
  periodoPage = signal<PageResponse<ConsultaResumoDto> | null>(null);
  periodoLoading = signal(false);

  pacienteSelecionado = signal<PessoaResumo | null>(null);
  pacientePage = signal<PageResponse<ConsultaResumoDto> | null>(null);
  pacienteLoading = signal(false);

  medicoSelecionado = signal<PessoaResumo | null>(null);
  medicoPage = signal<PageResponse<ConsultaResumoDto> | null>(null);
  medicoLoading = signal(false);

  // ---- Período (form) ----
  readonly periodoForm = new FormGroup<PeriodoForm>({
    inicio: new FormControl<Date | null>(null),
    fim: new FormControl<Date | null>(null),
  });

  readonly consultaColumns = ['data', 'horario', 'medico', 'paciente', 'status'];
  readonly porMesColumns = ['mes', 'total'];
  readonly porAnoColumns = ['ano', 'total'];
  readonly porEspecialidadeColumns = ['especialidade', 'total'];

  // ---- Chart options ----
  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#FFF' } },
    },
  };

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#FFF' }, grid: { color: '#333' } },
      y: {
        ticks: { color: '#FFF', stepSize: 1 },
        grid: { color: '#333' },
        beginAtZero: true,
      },
    },
  };

  readonly barHorizontalOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: '#FFF', stepSize: 1 },
        grid: { color: '#333' },
        beginAtZero: true,
      },
      y: { ticks: { color: '#FFF' }, grid: { color: '#333' } },
    },
  };

  // ---- Chart data ----
  statusChart = computed<ChartData<'doughnut', number[], string>>(() => {
    const s = this.status();
    const valores: Record<StatusConsulta, number> = {
      AGENDADA: Number(s?.agendada ?? 0),
      REALIZADA: Number(s?.realizada ?? 0),
      CANCELADA: Number(s?.cancelada ?? 0),
    };
    return {
      labels: ORDER_STATUS.map((st) => STATUS_CONSULTA_LABEL[st]),
      datasets: [
        {
          data: ORDER_STATUS.map((st) => valores[st]),
          backgroundColor: ORDER_STATUS.map((st) => COLOR_STATUS[st]),
          borderColor: '#202020',
        },
      ],
    };
  });

  porMesChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.porMesAll()].sort((a, b) => a.mes - b.mes);
    return {
      labels: items.map((i) => MESES_CURTOS[i.mes - 1] ?? String(i.mes)),
      datasets: [
        {
          label: 'Consultas',
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

  porAnoChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.porAnoAll()].sort((a, b) => a.ano - b.ano);
    return {
      labels: items.map((i) => String(i.ano)),
      datasets: [
        {
          label: 'Consultas',
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

  porEspecialidadeChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.porEspecialidadeAll()].sort(
      (a, b) => Number(b.total ?? 0) - Number(a.total ?? 0)
    );
    return {
      labels: items.map((i) => this.formatEspecialidade(i.especialidade)),
      datasets: [
        {
          label: 'Consultas',
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: items.map((i, idx) => this.corEspecialidade(i.especialidade, idx)),
        },
      ],
    };
  });

  corEspecialidade(especialidade: string, idx: number): string {
    return COLOR_ESPECIALIDADE[especialidade] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  }

  indexEspecialidade(especialidade: string): number {
    return this.porEspecialidadeAll().findIndex((i) => i.especialidade === especialidade);
  }

  // ---- Flags utilitárias ----
  hasStatus = computed(() => {
    const s = this.status();
    if (!s) return false;
    return (
      Number(s.agendada ?? 0) +
        Number(s.realizada ?? 0) +
        Number(s.cancelada ?? 0) >
      0
    );
  });
  hasPorMes = computed(() => this.porMesAll().length > 0);
  hasPorAno = computed(() => this.porAnoAll().length > 0);
  hasPorEspecialidade = computed(() => this.porEspecialidadeAll().length > 0);

  ngOnInit(): void {
    // Default período = últimos 30 dias.
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    this.periodoForm.patchValue({ inicio, fim });

    this.loadStatus();
    this.loadPorMes();
    this.loadPorAno();
    this.loadPorEspecialidade();
    this.aplicarPeriodo();
  }

  // ---- Carregamentos ----
  private loadStatus(): void {
    this.statusLoading.set(true);
    this.service
      .consultasPorStatus()
      .pipe(finalize(() => this.statusLoading.set(false)))
      .subscribe({
        next: (data) => this.status.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas por status.'),
      });
  }

  private loadPorMes(): void {
    this.porMesLoading.set(true);
    this.service
      .porMes(0, 100)
      .pipe(finalize(() => this.porMesLoading.set(false)))
      .subscribe({
        next: (data) => this.porMesAll.set(data.content ?? []),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas por mês.'),
      });
  }

  private loadPorAno(): void {
    this.porAnoLoading.set(true);
    this.service
      .porAno(0, 100)
      .pipe(finalize(() => this.porAnoLoading.set(false)))
      .subscribe({
        next: (data) => this.porAnoAll.set(data.content ?? []),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas por ano.'),
      });
  }

  private loadPorEspecialidade(): void {
    this.porEspecialidadeLoading.set(true);
    this.service
      .porEspecialidade(0, 100)
      .pipe(finalize(() => this.porEspecialidadeLoading.set(false)))
      .subscribe({
        next: (data) => this.porEspecialidadeAll.set(data.content ?? []),
        error: (err) =>
          this.notifyError(
            err,
            'Erro ao carregar consultas por especialidade.'
          ),
      });
  }

  loadPeriodo(page: number, size: number): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) return;
    const inicioIso = this.toIso(inicio);
    const fimIso = this.toIso(fim);

    this.periodoLoading.set(true);
    this.service
      .porPeriodo(inicioIso, fimIso, page, size)
      .pipe(finalize(() => this.periodoLoading.set(false)))
      .subscribe({
        next: (data) => this.periodoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao consultar o período selecionado.'),
      });
  }

  aplicarPeriodo(): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) {
      this.snackbar.show(
        'Selecione a data inicial e a data final.',
        'warning'
      );
      return;
    }
    if (inicio > fim) {
      this.snackbar.show(
        'A data inicial deve ser anterior ou igual à final.',
        'warning'
      );
      return;
    }
    this.loadPeriodo(0, this.pageSize);
  }

  loadPaciente(page: number, size: number): void {
    const pessoa = this.pacienteSelecionado();
    if (!pessoa) return;
    this.pacienteLoading.set(true);
    this.service
      .porPaciente(pessoa.id, page, size)
      .pipe(finalize(() => this.pacienteLoading.set(false)))
      .subscribe({
        next: (data) => this.pacientePage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas do paciente.'),
      });
  }

  loadMedico(page: number, size: number): void {
    const pessoa = this.medicoSelecionado();
    if (!pessoa) return;
    this.medicoLoading.set(true);
    this.service
      .porMedico(pessoa.id, page, size)
      .pipe(finalize(() => this.medicoLoading.set(false)))
      .subscribe({
        next: (data) => this.medicoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas do médico.'),
      });
  }

  // ---- Eventos do template ----
  onPeriodoPage(e: PageEvent): void {
    this.loadPeriodo(e.pageIndex, e.pageSize);
  }

  onPacienteSelecionado(pessoa: PessoaResumo | null): void {
    this.pacienteSelecionado.set(pessoa);
    if (pessoa) {
      this.loadPaciente(0, this.pageSize);
    } else {
      this.pacientePage.set(null);
    }
  }

  onPacientePage(e: PageEvent): void {
    this.loadPaciente(e.pageIndex, e.pageSize);
  }

  onMedicoSelecionado(pessoa: PessoaResumo | null): void {
    this.medicoSelecionado.set(pessoa);
    if (pessoa) {
      this.loadMedico(0, this.pageSize);
    } else {
      this.medicoPage.set(null);
    }
  }

  onMedicoPage(e: PageEvent): void {
    this.loadMedico(e.pageIndex, e.pageSize);
  }

  // ---- Helpers de template ----
  statusLabel(status: StatusConsulta): string {
    return STATUS_CONSULTA_LABEL[status];
  }

  formatHora(hora: string): string {
    return hora?.length >= 5 ? hora.substring(0, 5) : hora ?? '';
  }

  formatData(iso: string): string {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  formatMes(mes: number): string {
    return MESES_LONGOS[mes - 1] ?? String(mes);
  }

  formatEspecialidade(valor: string): string {
    if (!valor) return '';
    return valor.charAt(0) + valor.slice(1).toLowerCase();
  }

  private toIso(date: Date): string {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // ---- Downloads ----
  baixar(
    path: string,
    formato: FormatoExportacao,
    nomeArquivo: string,
    extraParams: Record<string, string | number> = {}
  ): void {
    this.service.baixar(path, formato, extraParams).subscribe({
      next: (blob) =>
        this.fileDownload.salvar(
          blob,
          `${nomeArquivo}.${formato.toLowerCase()}`
        ),
      error: (err) => this.notifyError(err, 'Erro ao baixar o arquivo.'),
    });
  }

  baixarPorPeriodo(formato: FormatoExportacao): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) {
      this.snackbar.show(
        'Selecione a data inicial e a data final para baixar.',
        'warning'
      );
      return;
    }
    if (inicio > fim) {
      this.snackbar.show(
        'A data inicial deve ser anterior ou igual à final.',
        'warning'
      );
      return;
    }
    this.baixar('por-periodo', formato, 'consultas-por-periodo', {
      inicio: this.toIso(inicio),
      fim: this.toIso(fim),
    });
  }

  baixarPorPaciente(formato: FormatoExportacao): void {
    const pessoa = this.pacienteSelecionado();
    if (!pessoa) {
      this.snackbar.show('Selecione um paciente para baixar.', 'warning');
      return;
    }
    this.baixar(
      `por-paciente/${pessoa.id}`,
      formato,
      `consultas-por-paciente-${pessoa.id}`
    );
  }

  baixarPorMedico(formato: FormatoExportacao): void {
    const pessoa = this.medicoSelecionado();
    if (!pessoa) {
      this.snackbar.show('Selecione um médico para baixar.', 'warning');
      return;
    }
    this.baixar(
      `por-medico/${pessoa.id}`,
      formato,
      `consultas-por-medico-${pessoa.id}`
    );
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
