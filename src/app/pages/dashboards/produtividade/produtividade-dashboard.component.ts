import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  BarElement,
  BarController,
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
  STATUS_CONSULTA,
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { RelatorioProdutividadeService } from '@services/apis/relatorio-produtividade/relatorio-produtividade.service';
import {
  ConsultasPorMesProdutividade,
  MediaConsultas,
  TaxaComparecimento,
  TempoMedioDuracao,
  TempoMedioEspera,
} from './produtividade.models';

Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const MES_CURTO: readonly string[] = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

@Component({
  selector: 'app-produtividade-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatTooltipModule,
    BaseChartDirective,
  ],
  templateUrl: './produtividade-dashboard.component.html',
  styleUrl: './produtividade-dashboard.component.css',
})
export class ProdutividadeDashboardComponent implements OnInit {
  private readonly service = inject(RelatorioProdutividadeService);
  private readonly snackbar = inject(SnackbarService);
  private readonly fileDownload = inject(FileDownloadService);

  readonly pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];
  readonly statusOptions = STATUS_CONSULTA;

  // KPIs escalares
  mediaSig = signal<MediaConsultas | null>(null);
  duracaoSig = signal<TempoMedioDuracao | null>(null);
  esperaSig = signal<TempoMedioEspera | null>(null);
  taxaSig = signal<TaxaComparecimento | null>(null);
  kpisLoading = signal(false);

  // Consultas por mês — dataset cheio (gráfico) + página (tabela).
  consultasPorMesAll = signal<ConsultasPorMesProdutividade[]>([]);
  consultasPorMesPage =
    signal<PageResponse<ConsultasPorMesProdutividade> | null>(null);
  mesLoading = signal(false);

  statusSelecionado = signal<StatusConsulta>('REALIZADA');

  readonly consultasPorMesColumns = ['ano', 'mes', 'total'];

  // ---- Computeds ----
  hasConsultasPorMes = computed(() => this.consultasPorMesAll().length > 0);

  consultasPorMesChart = computed<ChartData<'bar', number[], string>>(() => {
    const items = [...this.consultasPorMesAll()].sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
    return {
      labels: items.map((i) => `${this.mesCurto(i.mes)}/${i.ano}`),
      datasets: [
        {
          label: 'Consultas',
          data: items.map((i) => Number(i.totalConsultas ?? 0)),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

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

  ngOnInit(): void {
    this.loadKpis();
    this.loadConsultasPorMesPage(0, this.pageSize);
    this.loadConsultasPorMesAll();
  }

  // ---- Carregamentos ----
  private loadKpis(): void {
    this.kpisLoading.set(true);
    forkJoin({
      media: this.service.mediaConsultas(),
      duracao: this.service.tempoMedioDuracao(),
      espera: this.service.tempoMedioEspera(),
      taxa: this.service.taxaComparecimento(),
    })
      .pipe(finalize(() => this.kpisLoading.set(false)))
      .subscribe({
        next: ({ media, duracao, espera, taxa }) => {
          this.mediaSig.set(media);
          this.duracaoSig.set(duracao);
          this.esperaSig.set(espera);
          this.taxaSig.set(taxa);
        },
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar indicadores de produtividade.'),
      });
  }

  loadConsultasPorMesPage(page: number, size: number): void {
    this.mesLoading.set(true);
    this.service
      .consultasPorMes(this.statusSelecionado(), page, size)
      .pipe(finalize(() => this.mesLoading.set(false)))
      .subscribe({
        next: (data) => this.consultasPorMesPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas por mês.'),
      });
  }

  private loadConsultasPorMesAll(): void {
    this.service.consultasPorMes(this.statusSelecionado(), 0, 1000).subscribe({
      next: (data) => this.consultasPorMesAll.set(data.content ?? []),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar gráfico de consultas por mês.'),
    });
  }

  onConsultasPorMesPage(e: PageEvent): void {
    this.loadConsultasPorMesPage(e.pageIndex, e.pageSize);
  }

  onStatusChange(novo: StatusConsulta): void {
    this.statusSelecionado.set(novo);
    this.loadConsultasPorMesPage(0, this.pageSize);
    this.loadConsultasPorMesAll();
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

  baixarConsultasPorMes(formato: FormatoExportacao): void {
    this.baixar('consultas-por-mes', formato, 'consultas-por-mes', {
      status: this.statusSelecionado(),
    });
  }

  // ---- Helpers ----
  statusLabel(status: StatusConsulta): string {
    return STATUS_CONSULTA_LABEL[status];
  }

  formatNumero(valor: number | null | undefined, casas = 2): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }).format(Number(valor ?? 0));
  }

  formatInteiro(valor: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0));
  }

  mesCurto(mes: number): string {
    const idx = Math.max(1, Math.min(12, Math.trunc(mes))) - 1;
    return MES_CURTO[idx];
  }

  mesLongo(mes: number): string {
    return this.mesCurto(mes);
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
