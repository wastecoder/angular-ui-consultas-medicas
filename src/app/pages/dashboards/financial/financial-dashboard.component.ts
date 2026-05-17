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
import { ESPECIALIDADES } from '@pages/doctors/doctor.constants';
import { RelatorioFinanceiroService } from '@services/apis/relatorio-financeiro/relatorio-financeiro.service';
import {
  FaturamentoMensal,
  FaturamentoPorEspecialidade,
  FaturamentoPorMedico,
  PerdaMensal,
} from './financial.models';

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

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

// Paleta determinística para o doughnut de especialidades.
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

const COLOR_FATURAMENTO = '#4CAF50';
const COLOR_PERDA = '#F44336';

interface PeriodoForm {
  inicio: FormControl<Date | null>;
  fim: FormControl<Date | null>;
}

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    BaseChartDirective,
  ],
  templateUrl: './financial-dashboard.component.html',
  styleUrl: './financial-dashboard.component.css',
})
export class FinancialDashboardComponent implements OnInit {
  private readonly service = inject(RelatorioFinanceiroService);
  private readonly snackbar = inject(SnackbarService);

  readonly pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  // Dataset cheio (até 24 itens) para alimentar KPIs do mês/ano e gráfico mensal.
  faturamentoMensalAll = signal<FaturamentoMensal[]>([]);
  perdaMensalAll = signal<PerdaMensal[]>([]);
  perdasTotal = signal<number | null>(null);
  cardsLoading = signal(false);

  // Tabelas paginadas independentes.
  faturamentoMensalPage = signal<PageResponse<FaturamentoMensal> | null>(null);
  faturamentoMensalLoading = signal(false);

  faturamentoMedicoPage = signal<PageResponse<FaturamentoPorMedico> | null>(null);
  faturamentoMedicoLoading = signal(false);

  faturamentoEspecialidadePage = signal<PageResponse<FaturamentoPorEspecialidade> | null>(null);
  faturamentoEspecialidadeLoading = signal(false);

  perdaMensalPage = signal<PageResponse<PerdaMensal> | null>(null);
  perdaMensalLoading = signal(false);

  // Top médicos (gráfico) — carrega 1ª página com size=10.
  topMedicos = signal<FaturamentoPorMedico[]>([]);

  // Especialidades (gráfico) — carrega 1ª página com size grande.
  especialidadesAll = signal<FaturamentoPorEspecialidade[]>([]);

  // Período: form + estado.
  readonly periodoForm = new FormGroup<PeriodoForm>({
    inicio: new FormControl<Date | null>(null),
    fim: new FormControl<Date | null>(null),
  });
  faturamentoPeriodo = signal<number | null>(null);
  perdaPeriodo = signal<number | null>(null);
  periodoLoading = signal(false);

  readonly faturamentoMensalColumns = ['ano', 'mes', 'totalFaturado'];
  readonly faturamentoMedicoColumns = ['nomeMedico', 'totalFaturado'];
  readonly faturamentoEspecialidadeColumns = ['especialidadeMedica', 'totalFaturado'];
  readonly perdaMensalColumns = ['ano', 'mes', 'totalPerdido'];

  // ---- KPIs computados a partir dos datasets cheios ----
  readonly hoje = new Date();
  readonly mesAtual = this.hoje.getMonth() + 1;
  readonly anoAtual = this.hoje.getFullYear();

  faturamentoMesAtual = computed(() => {
    const item = this.faturamentoMensalAll().find(
      (i) => i.ano === this.anoAtual && i.mes === this.mesAtual
    );
    return item?.totalFaturado ?? 0;
  });

  faturamentoAnoAtual = computed(() =>
    this.faturamentoMensalAll()
      .filter((i) => i.ano === this.anoAtual)
      .reduce((acc, i) => acc + Number(i.totalFaturado ?? 0), 0)
  );

  perdaMesAtual = computed(() => {
    const item = this.perdaMensalAll().find(
      (i) => i.ano === this.anoAtual && i.mes === this.mesAtual
    );
    return item?.totalPerdido ?? 0;
  });

  // ---- Chart options ----
  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#FFF' } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${this.formatBRL(Number(ctx.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#FFF' }, grid: { color: '#333' } },
      y: {
        ticks: { color: '#FFF' },
        grid: { color: '#333' },
        beginAtZero: true,
      },
    },
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#FFF' } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.label}: ${this.formatBRL(Number(ctx.parsed ?? 0))}`,
        },
      },
    },
  };

  readonly barHorizontalOptions: ChartConfiguration<'bar'>['options'] = {
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
  faturamentoVsPerdaChart = computed<ChartData<'bar', number[], string>>(() => {
    const fat = this.faturamentoMensalAll();
    const per = this.perdaMensalAll();
    const chaves = new Set<string>();
    for (const i of fat) chaves.add(`${i.ano}-${i.mes}`);
    for (const i of per) chaves.add(`${i.ano}-${i.mes}`);
    const ordenadas = Array.from(chaves)
      .map((k) => {
        const [a, m] = k.split('-').map(Number);
        return { ano: a, mes: m, key: k };
      })
      .sort((a, b) => (a.ano - b.ano) || (a.mes - b.mes))
      .slice(-12);

    const mapFat = new Map(fat.map((i) => [`${i.ano}-${i.mes}`, Number(i.totalFaturado ?? 0)]));
    const mapPer = new Map(per.map((i) => [`${i.ano}-${i.mes}`, Number(i.totalPerdido ?? 0)]));

    return {
      labels: ordenadas.map((o) => `${MESES_CURTOS[o.mes - 1]}/${String(o.ano).slice(-2)}`),
      datasets: [
        {
          label: 'Faturamento',
          data: ordenadas.map((o) => mapFat.get(o.key) ?? 0),
          backgroundColor: COLOR_FATURAMENTO,
        },
        {
          label: 'Perda',
          data: ordenadas.map((o) => mapPer.get(o.key) ?? 0),
          backgroundColor: COLOR_PERDA,
        },
      ],
    };
  });

  especialidadeChart = computed<ChartData<'doughnut', number[], string>>(() => {
    const items = this.especialidadesAll();
    return {
      labels: items.map((i) => this.formatEspecialidade(i.especialidadeMedica)),
      datasets: [
        {
          data: items.map((i) => Number(i.totalFaturado ?? 0)),
          backgroundColor: items.map(
            (i, idx) =>
              COLOR_ESPECIALIDADE[i.especialidadeMedica] ?? this.colorByIndex(idx)
          ),
          borderColor: '#202020',
        },
      ],
    };
  });

  topMedicosChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.topMedicos()]
      .sort((a, b) => Number(b.totalFaturado ?? 0) - Number(a.totalFaturado ?? 0))
      .slice(0, 10);
    return {
      labels: items.map((i) => i.nomeMedico),
      datasets: [
        {
          label: 'Faturamento',
          data: items.map((i) => Number(i.totalFaturado ?? 0)),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

  ngOnInit(): void {
    // Default período = mês corrente.
    const inicio = new Date(this.anoAtual, this.mesAtual - 1, 1);
    const fim = new Date(this.anoAtual, this.mesAtual, 0);
    this.periodoForm.patchValue({ inicio, fim });

    this.loadCardsData();
    this.loadFaturamentoMensal(0, this.pageSize);
    this.loadFaturamentoMedico(0, this.pageSize);
    this.loadFaturamentoEspecialidade(0, this.pageSize);
    this.loadPerdaMensal(0, this.pageSize);
    this.loadTopMedicos();
    this.loadEspecialidadesParaGrafico();
    this.aplicarPeriodo();
  }

  // ---- Carga dos KPIs/gráfico mensal: usa size=24 para abranger 2 anos ----
  private loadCardsData(): void {
    this.cardsLoading.set(true);
    forkJoin({
      fat: this.service.faturamentoMensal(0, 24),
      per: this.service.perdaMensalComCancelamentos(0, 24),
      perdasTotal: this.service.perdasComCancelamentos(),
    })
      .pipe(finalize(() => this.cardsLoading.set(false)))
      .subscribe({
        next: ({ fat, per, perdasTotal }) => {
          this.faturamentoMensalAll.set(fat.content ?? []);
          this.perdaMensalAll.set(per.content ?? []);
          this.perdasTotal.set(Number(perdasTotal.totalPerdido ?? 0));
        },
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar indicadores financeiros.'),
      });
  }

  private loadTopMedicos(): void {
    this.service.faturamentoPorMedico(0, 10).subscribe({
      next: (data) => this.topMedicos.set(data.content ?? []),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar ranking de médicos.'),
    });
  }

  private loadEspecialidadesParaGrafico(): void {
    this.service.faturamentoPorEspecialidade(0, 50).subscribe({
      next: (data) => this.especialidadesAll.set(data.content ?? []),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar faturamento por especialidade.'),
    });
  }

  // ---- Tabelas paginadas ----
  loadFaturamentoMensal(page: number, size: number): void {
    this.faturamentoMensalLoading.set(true);
    this.service
      .faturamentoMensal(page, size)
      .pipe(finalize(() => this.faturamentoMensalLoading.set(false)))
      .subscribe({
        next: (data) => this.faturamentoMensalPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar faturamento mensal.'),
      });
  }

  loadFaturamentoMedico(page: number, size: number): void {
    this.faturamentoMedicoLoading.set(true);
    this.service
      .faturamentoPorMedico(page, size)
      .pipe(finalize(() => this.faturamentoMedicoLoading.set(false)))
      .subscribe({
        next: (data) => this.faturamentoMedicoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar faturamento por médico.'),
      });
  }

  loadFaturamentoEspecialidade(page: number, size: number): void {
    this.faturamentoEspecialidadeLoading.set(true);
    this.service
      .faturamentoPorEspecialidade(page, size)
      .pipe(finalize(() => this.faturamentoEspecialidadeLoading.set(false)))
      .subscribe({
        next: (data) => this.faturamentoEspecialidadePage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar faturamento por especialidade.'),
      });
  }

  loadPerdaMensal(page: number, size: number): void {
    this.perdaMensalLoading.set(true);
    this.service
      .perdaMensalComCancelamentos(page, size)
      .pipe(finalize(() => this.perdaMensalLoading.set(false)))
      .subscribe({
        next: (data) => this.perdaMensalPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar perda mensal.'),
      });
  }

  // ---- Período ----
  aplicarPeriodo(): void {
    const { inicio, fim } = this.periodoForm.value;
    if (!inicio || !fim) {
      this.snackbar.show('Selecione a data inicial e a data final.', 'warning');
      return;
    }
    if (inicio > fim) {
      this.snackbar.show('A data inicial deve ser anterior ou igual à final.', 'warning');
      return;
    }
    const inicioIso = this.toIso(inicio);
    const fimIso = this.toIso(fim);

    this.periodoLoading.set(true);
    forkJoin({
      fat: this.service.faturamentoPorPeriodo(inicioIso, fimIso),
      per: this.service.perdaPorPeriodo(inicioIso, fimIso),
    })
      .pipe(finalize(() => this.periodoLoading.set(false)))
      .subscribe({
        next: ({ fat, per }) => {
          this.faturamentoPeriodo.set(Number(fat.totalFaturado ?? 0));
          this.perdaPeriodo.set(Number(per.totalPerdido ?? 0));
        },
        error: (err) =>
          this.notifyError(err, 'Erro ao consultar o período selecionado.'),
      });
  }

  // ---- Eventos de paginação ----
  onFaturamentoMensalPage(e: PageEvent): void {
    this.loadFaturamentoMensal(e.pageIndex, e.pageSize);
  }
  onFaturamentoMedicoPage(e: PageEvent): void {
    this.loadFaturamentoMedico(e.pageIndex, e.pageSize);
  }
  onFaturamentoEspecialidadePage(e: PageEvent): void {
    this.loadFaturamentoEspecialidade(e.pageIndex, e.pageSize);
  }
  onPerdaMensalPage(e: PageEvent): void {
    this.loadPerdaMensal(e.pageIndex, e.pageSize);
  }

  // ---- Helpers ----
  formatBRL(valor: number | null | undefined): string {
    const n = Number(valor ?? 0);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }

  formatMes(mes: number): string {
    return MESES_CURTOS[mes - 1] ?? String(mes);
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

  // Usados no template para evitar zero-states quebrados.
  hasFaturamentoVsPerda = computed(
    () => this.faturamentoMensalAll().length > 0 || this.perdaMensalAll().length > 0
  );
  hasEspecialidades = computed(() => this.especialidadesAll().length > 0);
  hasTopMedicos = computed(() => this.topMedicos().length > 0);
}
