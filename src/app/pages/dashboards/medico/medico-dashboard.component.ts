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
import { MatSelectModule } from '@angular/material/select';
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
import { FormatoExportacao } from '@shared/models/formato-exportacao';
import { SnackbarService } from '@shared/services/snackbar.service';
import { FileDownloadService } from '@shared/services/file-download.service';
import { RelatorioMedicoService } from '@services/apis/relatorio-medico/relatorio-medico.service';
import {
  ConsultasRealizadasPorMedico,
  FaturamentoPorMedicoRelMedico,
  MedicosComMaisConsultasNoMes,
  MedicosPorEspecialidade,
  TaxaCancelamentoPorMedico,
} from './medico.models';

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

const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Paleta determinística por especialidade (mesma usada em financial / appointments).
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

interface MesAnoForm {
  mes: FormControl<number | null>;
  ano: FormControl<number | null>;
}

@Component({
  selector: 'app-medico-dashboard',
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
    MatSelectModule,
    BaseChartDirective,
  ],
  templateUrl: './medico-dashboard.component.html',
  styleUrl: './medico-dashboard.component.css',
})
export class MedicoDashboardComponent implements OnInit {
  private readonly service = inject(RelatorioMedicoService);
  private readonly snackbar = inject(SnackbarService);
  private readonly fileDownload = inject(FileDownloadService);

  readonly pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  // Datasets cheios (1ª chamada com size grande) para alimentar KPIs / gráficos.
  consultasRealizadasAll = signal<ConsultasRealizadasPorMedico[]>([]);
  especialidadesAll = signal<MedicosPorEspecialidade[]>([]);
  faturamentoAll = signal<FaturamentoPorMedicoRelMedico[]>([]);
  cardsLoading = signal(false);

  // Tabelas paginadas independentes.
  consultasRealizadasPage = signal<PageResponse<ConsultasRealizadasPorMedico> | null>(null);
  consultasRealizadasLoading = signal(false);

  especialidadesPage = signal<PageResponse<MedicosPorEspecialidade> | null>(null);
  especialidadesLoading = signal(false);

  faturamentoPage = signal<PageResponse<FaturamentoPorMedicoRelMedico> | null>(null);
  faturamentoLoading = signal(false);

  taxaCancelamentoPage = signal<PageResponse<TaxaCancelamentoPorMedico> | null>(null);
  taxaCancelamentoLoading = signal(false);

  // Ranking do mês — controle de filtro + tabela.
  rankingMesPage = signal<PageResponse<MedicosComMaisConsultasNoMes> | null>(null);
  rankingMesAll = signal<MedicosComMaisConsultasNoMes[]>([]);
  rankingMesLoading = signal(false);

  readonly hoje = new Date();
  readonly mesAtual = this.hoje.getMonth() + 1;
  readonly anoAtual = this.hoje.getFullYear();

  readonly mesesOptions = Array.from({ length: 12 }, (_, i) => ({
    valor: i + 1,
    label: MESES_LONGOS[i],
  }));

  readonly anosOptions = Array.from({ length: 5 }, (_, i) => this.anoAtual - i);

  readonly mesAnoForm = new FormGroup<MesAnoForm>({
    mes: new FormControl<number | null>(this.mesAtual),
    ano: new FormControl<number | null>(this.anoAtual),
  });

  // Colunas das tabelas.
  readonly consultasRealizadasColumns = ['nome', 'total'];
  readonly especialidadesColumns = ['especialidade', 'total'];
  readonly rankingMesColumns = ['nome', 'total'];
  readonly faturamentoColumns = ['nome', 'total'];
  readonly taxaCancelamentoColumns = ['nome', 'taxa'];

  // ---- KPIs computados ----
  kpiTotalConsultasRealizadas = computed(() =>
    this.consultasRealizadasAll().reduce(
      (acc, item) => acc + Number(item.total ?? 0),
      0
    )
  );

  kpiTotalMedicos = computed(() =>
    this.especialidadesAll().reduce(
      (acc, item) => acc + Number(item.total ?? 0),
      0
    )
  );

  kpiFaturamentoTotal = computed(() =>
    this.faturamentoAll().reduce(
      (acc, item) => acc + Number(item.total ?? 0),
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

  readonly barHorizontalBRLOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => this.formatBRL(Number(ctx.parsed.x ?? 0)),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#FFF' },
        grid: { color: '#333' },
        beginAtZero: true,
      },
      y: { ticks: { color: '#FFF' }, grid: { color: '#333' } },
    },
  };

  // ---- Chart data ----
  especialidadeChart = computed<ChartData<'doughnut', number[], string>>(() => {
    const items = this.especialidadesAll();
    return {
      labels: items.map((i) => this.formatEspecialidade(i.especialidade)),
      datasets: [
        {
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: items.map(
            (i, idx) =>
              COLOR_ESPECIALIDADE[i.especialidade] ?? this.colorByIndex(idx)
          ),
          borderColor: '#202020',
        },
      ],
    };
  });

  topConsultasRealizadasChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.consultasRealizadasAll()]
      .sort((a, b) => Number(b.total ?? 0) - Number(a.total ?? 0))
      .slice(0, 10);
    return {
      labels: items.map((i) => i.nome),
      datasets: [
        {
          label: 'Consultas realizadas',
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

  rankingMesChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.rankingMesAll()]
      .sort((a, b) => Number(b.total ?? 0) - Number(a.total ?? 0))
      .slice(0, 10);
    return {
      labels: items.map((i) => i.nome),
      datasets: [
        {
          label: 'Consultas no mês',
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: '#43A047',
        },
      ],
    };
  });

  topFaturamentoChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.faturamentoAll()]
      .sort((a, b) => Number(b.total ?? 0) - Number(a.total ?? 0))
      .slice(0, 10);
    return {
      labels: items.map((i) => i.nome),
      datasets: [
        {
          label: 'Faturamento',
          data: items.map((i) => Number(i.total ?? 0)),
          backgroundColor: '#8E24AA',
        },
      ],
    };
  });

  // ---- Flags utilitárias ----
  hasEspecialidades = computed(() => this.especialidadesAll().length > 0);
  hasConsultasRealizadas = computed(() => this.consultasRealizadasAll().length > 0);
  hasRankingMes = computed(() => this.rankingMesAll().length > 0);
  hasFaturamento = computed(() => this.faturamentoAll().length > 0);

  ngOnInit(): void {
    this.loadCardsData();
    this.loadConsultasRealizadasPage(0, this.pageSize);
    this.loadEspecialidadesPage(0, this.pageSize);
    this.loadFaturamentoPage(0, this.pageSize);
    this.loadTaxaCancelamentoPage(0, this.pageSize);
    this.aplicarMesAno();
  }

  // ---- Carregamento dos datasets cheios (KPIs + gráficos) ----
  private loadCardsData(): void {
    this.cardsLoading.set(true);
    forkJoin({
      realizadas: this.service.consultasRealizadas(0, 1000),
      especialidades: this.service.medicosPorEspecialidade(0, 1000),
      faturamento: this.service.faturamento(0, 1000),
    })
      .pipe(finalize(() => this.cardsLoading.set(false)))
      .subscribe({
        next: ({ realizadas, especialidades, faturamento }) => {
          this.consultasRealizadasAll.set(realizadas.content ?? []);
          this.especialidadesAll.set(especialidades.content ?? []);
          this.faturamentoAll.set(faturamento.content ?? []);
        },
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar indicadores do médico.'),
      });
  }

  // ---- Tabelas paginadas ----
  loadConsultasRealizadasPage(page: number, size: number): void {
    this.consultasRealizadasLoading.set(true);
    this.service
      .consultasRealizadas(page, size)
      .pipe(finalize(() => this.consultasRealizadasLoading.set(false)))
      .subscribe({
        next: (data) => this.consultasRealizadasPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas realizadas por médico.'),
      });
  }

  loadEspecialidadesPage(page: number, size: number): void {
    this.especialidadesLoading.set(true);
    this.service
      .medicosPorEspecialidade(page, size)
      .pipe(finalize(() => this.especialidadesLoading.set(false)))
      .subscribe({
        next: (data) => this.especialidadesPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar médicos por especialidade.'),
      });
  }

  loadFaturamentoPage(page: number, size: number): void {
    this.faturamentoLoading.set(true);
    this.service
      .faturamento(page, size)
      .pipe(finalize(() => this.faturamentoLoading.set(false)))
      .subscribe({
        next: (data) => this.faturamentoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar faturamento por médico.'),
      });
  }

  loadTaxaCancelamentoPage(page: number, size: number): void {
    this.taxaCancelamentoLoading.set(true);
    this.service
      .taxaCancelamento(page, size)
      .pipe(finalize(() => this.taxaCancelamentoLoading.set(false)))
      .subscribe({
        next: (data) => this.taxaCancelamentoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar taxa de cancelamento.'),
      });
  }

  // ---- Ranking do mês ----
  loadRankingMes(page: number, size: number): void {
    const { mes, ano } = this.mesAnoForm.value;
    if (!mes || !ano) return;
    this.rankingMesLoading.set(true);
    this.service
      .maisConsultasNoMes(mes, ano, page, size)
      .pipe(finalize(() => this.rankingMesLoading.set(false)))
      .subscribe({
        next: (data) => this.rankingMesPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar ranking do mês.'),
      });
  }

  private loadRankingMesAll(): void {
    const { mes, ano } = this.mesAnoForm.value;
    if (!mes || !ano) return;
    this.service.maisConsultasNoMes(mes, ano, 0, 1000).subscribe({
      next: (data) => this.rankingMesAll.set(data.content ?? []),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar ranking do mês para o gráfico.'),
    });
  }

  aplicarMesAno(): void {
    const { mes, ano } = this.mesAnoForm.value;
    if (!mes || !ano) {
      this.snackbar.show('Selecione o mês e o ano.', 'warning');
      return;
    }
    this.loadRankingMes(0, this.pageSize);
    this.loadRankingMesAll();
  }

  // ---- Eventos de paginação ----
  onConsultasRealizadasPage(e: PageEvent): void {
    this.loadConsultasRealizadasPage(e.pageIndex, e.pageSize);
  }
  onEspecialidadesPage(e: PageEvent): void {
    this.loadEspecialidadesPage(e.pageIndex, e.pageSize);
  }
  onFaturamentoPage(e: PageEvent): void {
    this.loadFaturamentoPage(e.pageIndex, e.pageSize);
  }
  onTaxaCancelamentoPage(e: PageEvent): void {
    this.loadTaxaCancelamentoPage(e.pageIndex, e.pageSize);
  }
  onRankingMesPage(e: PageEvent): void {
    this.loadRankingMes(e.pageIndex, e.pageSize);
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

  baixarPorEspecialidade(formato: FormatoExportacao): void {
    this.baixar('por-especialidade', formato, 'medicos-por-especialidade');
  }

  baixarConsultasRealizadas(formato: FormatoExportacao): void {
    this.baixar('consultas-realizadas', formato, 'consultas-realizadas-por-medico');
  }

  baixarMaisConsultasNoMes(formato: FormatoExportacao): void {
    const { mes, ano } = this.mesAnoForm.value;
    if (!mes || !ano) {
      this.snackbar.show('Selecione o mês e o ano para baixar.', 'warning');
      return;
    }
    this.baixar('mais-consultas-no-mes', formato, 'mais-consultas-no-mes', {
      mes,
      ano,
    });
  }

  baixarFaturamento(formato: FormatoExportacao): void {
    this.baixar('faturamento', formato, 'faturamento-por-medico');
  }

  baixarTaxaCancelamento(formato: FormatoExportacao): void {
    this.baixar('taxa-cancelamento', formato, 'taxa-cancelamento-por-medico');
  }

  // ---- Helpers ----
  formatBRL(valor: number | null | undefined): string {
    const n = Number(valor ?? 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }

  formatNumero(valor: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0));
  }

  formatEspecialidade(valor: string): string {
    if (!valor) return '';
    return valor.charAt(0) + valor.slice(1).toLowerCase();
  }

  corEspecialidade(especialidade: string, idx: number): string {
    return COLOR_ESPECIALIDADE[especialidade] ?? this.colorByIndex(idx);
  }

  indexEspecialidade(especialidade: string): number {
    return this.especialidadesAll().findIndex(
      (e) => e.especialidade === especialidade
    );
  }

  private colorByIndex(idx: number): string {
    const fallback = ['#90A4AE', '#A1887F', '#9575CD', '#4DB6AC', '#FF8A65'];
    return fallback[idx % fallback.length];
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
