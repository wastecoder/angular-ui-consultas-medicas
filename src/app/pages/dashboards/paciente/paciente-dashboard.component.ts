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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { finalize, forkJoin } from 'rxjs';
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
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { PessoaResumo } from '@pages/appointments/appointment.models';
import { PersonAutocompleteComponent } from '@pages/appointments/components/person-autocomplete/person-autocomplete.component';
import { RelatorioPacienteService } from '@services/apis/relatorio-paciente/relatorio-paciente.service';
import {
  CancelamentosPorPaciente,
  DistribuicaoPacientesPorFaixaEtaria,
  DistribuicaoPacientesPorSexo,
  HistoricoConsultaPaciente,
  PacientesComMaisConsultas,
  Sexo,
} from './paciente.models';

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

const ORDER_SEXO: Sexo[] = ['MASCULINO', 'FEMININO', 'OUTRO'];

const COLOR_SEXO: Record<Sexo, string> = {
  MASCULINO: '#1E88E5',
  FEMININO: '#E91E63',
  OUTRO: '#9E9E9E',
};

const SEXO_LABEL: Record<Sexo, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
};

// Ordem fixa das faixas devolvidas pelo back (PacienteRepository.distribuicaoPorFaixaEtaria).
const ORDEM_FAIXA_ETARIA: readonly string[] = [
  'Menor de 18',
  '18-29',
  '30-44',
  '45-59',
  'Maior de 60',
];

interface PeriodoForm {
  inicio: FormControl<Date | null>;
  fim: FormControl<Date | null>;
}

@Component({
  selector: 'app-paciente-dashboard',
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
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    BaseChartDirective,
    PersonAutocompleteComponent,
  ],
  templateUrl: './paciente-dashboard.component.html',
  styleUrl: './paciente-dashboard.component.css',
})
export class PatientDashboardComponent implements OnInit {
  private readonly service = inject(RelatorioPacienteService);
  private readonly snackbar = inject(SnackbarService);

  readonly pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  // Datasets cheios (size grande) para alimentar KPIs/gráficos.
  distribuicaoSexoAll = signal<DistribuicaoPacientesPorSexo[]>([]);
  distribuicaoFaixaEtariaAll = signal<DistribuicaoPacientesPorFaixaEtaria[]>([]);
  cancelamentosAll = signal<CancelamentosPorPaciente[]>([]);
  maisConsultasAll = signal<PacientesComMaisConsultas[]>([]);
  cardsLoading = signal(false);

  // Tabelas paginadas independentes.
  distribuicaoSexoPage = signal<PageResponse<DistribuicaoPacientesPorSexo> | null>(null);
  distribuicaoSexoLoading = signal(false);

  distribuicaoFaixaEtariaPage = signal<PageResponse<DistribuicaoPacientesPorFaixaEtaria> | null>(null);
  distribuicaoFaixaEtariaLoading = signal(false);

  cancelamentosPage = signal<PageResponse<CancelamentosPorPaciente> | null>(null);
  cancelamentosLoading = signal(false);

  maisConsultasPage = signal<PageResponse<PacientesComMaisConsultas> | null>(null);
  maisConsultasLoading = signal(false);

  // Histórico — depende do paciente selecionado.
  pacienteSelecionado = signal<PessoaResumo | null>(null);
  historicoPage = signal<PageResponse<HistoricoConsultaPaciente> | null>(null);
  historicoLoading = signal(false);

  // ---- Período (form) ----
  readonly periodoForm = new FormGroup<PeriodoForm>({
    inicio: new FormControl<Date | null>(null),
    fim: new FormControl<Date | null>(null),
  });

  // Colunas das tabelas.
  readonly distribuicaoSexoColumns = ['sexo', 'total'];
  readonly distribuicaoFaixaEtariaColumns = ['faixa', 'total'];
  readonly maisConsultasColumns = ['nome', 'total'];
  readonly cancelamentosColumns = ['nome', 'total'];
  readonly historicoColumns = ['data', 'horario', 'medico', 'status'];

  // ---- KPIs computados ----
  kpiTotalPacientes = computed(() =>
    this.distribuicaoSexoAll().reduce(
      (acc, item) => acc + Number(item.totalPacientes ?? 0),
      0
    )
  );

  kpiTotalCancelamentos = computed(() =>
    this.cancelamentosAll().reduce(
      (acc, item) => acc + Number(item.totalCancelamentos ?? 0),
      0
    )
  );

  kpiTotalConsultasPeriodo = computed(() =>
    this.maisConsultasAll().reduce(
      (acc, item) => acc + Number(item.totalConsultas ?? 0),
      0
    )
  );

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
  sexoChart = computed<ChartData<'doughnut', number[], string>>(() => {
    const items = this.distribuicaoSexoAll();
    const mapa = new Map<Sexo, number>();
    for (const it of items) {
      mapa.set(it.sexo, Number(it.totalPacientes ?? 0));
    }
    const presentes = ORDER_SEXO.filter((s) => mapa.has(s));
    return {
      labels: presentes.map((s) => SEXO_LABEL[s]),
      datasets: [
        {
          data: presentes.map((s) => mapa.get(s) ?? 0),
          backgroundColor: presentes.map((s) => COLOR_SEXO[s]),
          borderColor: '#202020',
        },
      ],
    };
  });

  faixaEtariaChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.distribuicaoFaixaEtariaAll()].sort(
      (a, b) =>
        this.indiceFaixaEtaria(a.faixaEtaria) -
        this.indiceFaixaEtaria(b.faixaEtaria)
    );
    return {
      labels: items.map((i) => i.faixaEtaria),
      datasets: [
        {
          label: 'Pacientes',
          data: items.map((i) => Number(i.totalPacientes ?? 0)),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

  topMaisConsultasChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.maisConsultasAll()]
      .sort((a, b) => Number(b.totalConsultas ?? 0) - Number(a.totalConsultas ?? 0))
      .slice(0, 10);
    return {
      labels: items.map((i) => i.nomePaciente),
      datasets: [
        {
          label: 'Consultas',
          data: items.map((i) => Number(i.totalConsultas ?? 0)),
          backgroundColor: '#43A047',
        },
      ],
    };
  });

  topCancelamentosChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.cancelamentosAll()]
      .sort(
        (a, b) =>
          Number(b.totalCancelamentos ?? 0) - Number(a.totalCancelamentos ?? 0)
      )
      .slice(0, 10);
    return {
      labels: items.map((i) => i.nomePaciente),
      datasets: [
        {
          label: 'Cancelamentos',
          data: items.map((i) => Number(i.totalCancelamentos ?? 0)),
          backgroundColor: '#F44336',
        },
      ],
    };
  });

  // ---- Flags utilitárias ----
  hasDistribuicaoSexo = computed(() => this.distribuicaoSexoAll().length > 0);
  hasDistribuicaoFaixaEtaria = computed(() => this.distribuicaoFaixaEtariaAll().length > 0);
  hasMaisConsultas = computed(() => this.maisConsultasAll().length > 0);
  hasCancelamentos = computed(() => this.cancelamentosAll().length > 0);

  ngOnInit(): void {
    // Default período = últimos 30 dias.
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    this.periodoForm.patchValue({ inicio, fim });

    this.loadCardsData();
    this.loadDistribuicaoSexoPage(0, this.pageSize);
    this.loadDistribuicaoFaixaEtariaPage(0, this.pageSize);
    this.loadCancelamentosPage(0, this.pageSize);
    this.aplicarPeriodo();
  }

  // ---- Carregamento dos datasets cheios (KPIs + gráficos) ----
  private loadCardsData(): void {
    this.cardsLoading.set(true);
    forkJoin({
      sexo: this.service.distribuicaoPorSexo(0, 1000),
      faixa: this.service.distribuicaoPorFaixaEtaria(0, 1000),
      cancelamentos: this.service.cancelamentos(0, 1000),
    })
      .pipe(finalize(() => this.cardsLoading.set(false)))
      .subscribe({
        next: ({ sexo, faixa, cancelamentos }) => {
          this.distribuicaoSexoAll.set(sexo.content ?? []);
          this.distribuicaoFaixaEtariaAll.set(faixa.content ?? []);
          this.cancelamentosAll.set(cancelamentos.content ?? []);
        },
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar indicadores de paciente.'),
      });
  }

  // ---- Tabelas paginadas ----
  loadDistribuicaoSexoPage(page: number, size: number): void {
    this.distribuicaoSexoLoading.set(true);
    this.service
      .distribuicaoPorSexo(page, size)
      .pipe(finalize(() => this.distribuicaoSexoLoading.set(false)))
      .subscribe({
        next: (data) => this.distribuicaoSexoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar distribuição por sexo.'),
      });
  }

  loadDistribuicaoFaixaEtariaPage(page: number, size: number): void {
    this.distribuicaoFaixaEtariaLoading.set(true);
    this.service
      .distribuicaoPorFaixaEtaria(page, size)
      .pipe(finalize(() => this.distribuicaoFaixaEtariaLoading.set(false)))
      .subscribe({
        next: (data) => this.distribuicaoFaixaEtariaPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar distribuição por faixa etária.'),
      });
  }

  loadCancelamentosPage(page: number, size: number): void {
    this.cancelamentosLoading.set(true);
    this.service
      .cancelamentos(page, size)
      .pipe(finalize(() => this.cancelamentosLoading.set(false)))
      .subscribe({
        next: (data) => this.cancelamentosPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar cancelamentos por paciente.'),
      });
  }

  loadMaisConsultas(page: number, size: number): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) return;
    const inicioIso = this.toIso(inicio);
    const fimIso = this.toIso(fim);

    this.maisConsultasLoading.set(true);
    this.service
      .maisConsultas(inicioIso, fimIso, page, size)
      .pipe(finalize(() => this.maisConsultasLoading.set(false)))
      .subscribe({
        next: (data) => this.maisConsultasPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar pacientes com mais consultas.'),
      });
  }

  private loadMaisConsultasAll(): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) return;
    const inicioIso = this.toIso(inicio);
    const fimIso = this.toIso(fim);
    this.service.maisConsultas(inicioIso, fimIso, 0, 1000).subscribe({
      next: (data) => this.maisConsultasAll.set(data.content ?? []),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar pacientes com mais consultas (gráfico).'),
    });
  }

  aplicarPeriodo(): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) {
      this.snackbar.show('Selecione a data inicial e a data final.', 'warning');
      return;
    }
    if (inicio > fim) {
      this.snackbar.show(
        'A data inicial deve ser anterior ou igual à final.',
        'warning'
      );
      return;
    }
    this.loadMaisConsultas(0, this.pageSize);
    this.loadMaisConsultasAll();
  }

  loadHistorico(page: number, size: number): void {
    const pessoa = this.pacienteSelecionado();
    if (!pessoa) return;
    this.historicoLoading.set(true);
    this.service
      .historico(pessoa.id, page, size)
      .pipe(finalize(() => this.historicoLoading.set(false)))
      .subscribe({
        next: (data) => this.historicoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar histórico do paciente.'),
      });
  }

  // ---- Eventos de paginação ----
  onDistribuicaoSexoPage(e: PageEvent): void {
    this.loadDistribuicaoSexoPage(e.pageIndex, e.pageSize);
  }
  onDistribuicaoFaixaEtariaPage(e: PageEvent): void {
    this.loadDistribuicaoFaixaEtariaPage(e.pageIndex, e.pageSize);
  }
  onCancelamentosPage(e: PageEvent): void {
    this.loadCancelamentosPage(e.pageIndex, e.pageSize);
  }
  onMaisConsultasPage(e: PageEvent): void {
    this.loadMaisConsultas(e.pageIndex, e.pageSize);
  }
  onHistoricoPage(e: PageEvent): void {
    this.loadHistorico(e.pageIndex, e.pageSize);
  }

  onPacienteSelecionado(pessoa: PessoaResumo | null): void {
    this.pacienteSelecionado.set(pessoa);
    if (pessoa) {
      this.loadHistorico(0, this.pageSize);
    } else {
      this.historicoPage.set(null);
    }
  }

  // ---- Helpers ----
  formatNumero(valor: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0));
  }

  sexoLabel(sexo: Sexo): string {
    return SEXO_LABEL[sexo] ?? sexo;
  }

  corSexo(sexo: Sexo): string {
    return COLOR_SEXO[sexo] ?? '#9E9E9E';
  }

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

  // Garante que o eixo X siga a sequência etária (ORDEM_FAIXA_ETARIA); faixas
  // desconhecidas (caso o back acrescente novos buckets) vão para o final.
  private indiceFaixaEtaria(faixa: string): number {
    const idx = ORDEM_FAIXA_ETARIA.indexOf(faixa);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  }

  private toIso(date: Date): string {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
