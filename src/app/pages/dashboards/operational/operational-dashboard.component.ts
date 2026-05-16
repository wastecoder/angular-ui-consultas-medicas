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
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  STATUS_CONSULTA_LABEL,
  StatusConsulta,
} from '@pages/appointments/appointment.constants';
import { RelatorioOperacionalService } from '@services/apis/relatorio-operacional/relatorio-operacional.service';
import {
  ConsultasPendentes,
  ConsultasPorData,
  ConsultasProximosDias,
  MedicoSemAgendamento,
} from './operational.models';

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

@Component({
  selector: 'app-operational-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatIconModule,
    BaseChartDirective,
  ],
  templateUrl: './operational-dashboard.component.html',
  styleUrl: './operational-dashboard.component.css',
})
export class OperationalDashboardComponent implements OnInit {
  private readonly service = inject(RelatorioOperacionalService);
  private readonly snackbar = inject(SnackbarService);

  readonly pageSize = 5;
  readonly pageSizeOptions = [5, 10, 20];

  hojePage = signal<PageResponse<ConsultasPorData> | null>(null);
  hojeLoading = signal(false);

  proximos7Page = signal<PageResponse<ConsultasProximosDias> | null>(null);
  proximos7Loading = signal(false);

  pendentesPage = signal<PageResponse<ConsultasPendentes> | null>(null);
  pendentesLoading = signal(false);

  semAgendamentoPage = signal<PageResponse<MedicoSemAgendamento> | null>(null);
  semAgendamentoLoading = signal(false);

  readonly hojeColumns = ['horario', 'medico', 'paciente', 'status'];
  readonly proximos7Columns = ['data', 'medico', 'paciente', 'status'];
  readonly pendentesColumns = ['data', 'medico', 'paciente'];
  readonly semAgendamentoColumns = ['nome', 'especialidade'];

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

  hojeChart = computed<ChartData<'doughnut', number[], string>>(() => {
    const items = this.hojePage()?.content ?? [];
    const data = ORDER_STATUS.map(
      (status) => items.filter((i) => i.statusConsulta === status).length
    );
    return {
      labels: ORDER_STATUS.map((status) => STATUS_CONSULTA_LABEL[status]),
      datasets: [
        {
          data,
          backgroundColor: ORDER_STATUS.map((status) => COLOR_STATUS[status]),
          borderColor: '#202020',
        },
      ],
    };
  });

  proximos7Chart = computed<ChartData<'bar', number[], string>>(() => {
    const items = this.proximos7Page()?.content ?? [];
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.dataConsulta, (counts.get(item.dataConsulta) ?? 0) + 1);
    }
    const labels = Array.from(counts.keys()).sort();
    return {
      labels: labels.map((iso) => this.formatDataCurta(iso)),
      datasets: [
        {
          label: 'Consultas',
          data: labels.map((iso) => counts.get(iso) ?? 0),
          backgroundColor: '#1976D2',
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadHoje(0, this.pageSize);
    this.loadProximos7(0, this.pageSize);
    this.loadPendentes(0, this.pageSize);
    this.loadSemAgendamento(0, this.pageSize);
  }

  loadHoje(page: number, size: number): void {
    this.hojeLoading.set(true);
    this.service
      .consultasPorData(page, size)
      .pipe(finalize(() => this.hojeLoading.set(false)))
      .subscribe({
        next: (data) => this.hojePage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas de hoje.'),
      });
  }

  loadProximos7(page: number, size: number): void {
    this.proximos7Loading.set(true);
    this.service
      .consultasProximos7Dias(page, size)
      .pipe(finalize(() => this.proximos7Loading.set(false)))
      .subscribe({
        next: (data) => this.proximos7Page.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas dos próximos 7 dias.'),
      });
  }

  loadPendentes(page: number, size: number): void {
    this.pendentesLoading.set(true);
    this.service
      .consultasPendentes(page, size)
      .pipe(finalize(() => this.pendentesLoading.set(false)))
      .subscribe({
        next: (data) => this.pendentesPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar consultas pendentes.'),
      });
  }

  loadSemAgendamento(page: number, size: number): void {
    this.semAgendamentoLoading.set(true);
    this.service
      .medicosSemAgendamento(page, size)
      .pipe(finalize(() => this.semAgendamentoLoading.set(false)))
      .subscribe({
        next: (data) => this.semAgendamentoPage.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar médicos sem agendamento.'),
      });
  }

  onHojePage(event: PageEvent): void {
    this.loadHoje(event.pageIndex, event.pageSize);
  }

  onProximos7Page(event: PageEvent): void {
    this.loadProximos7(event.pageIndex, event.pageSize);
  }

  onPendentesPage(event: PageEvent): void {
    this.loadPendentes(event.pageIndex, event.pageSize);
  }

  onSemAgendamentoPage(event: PageEvent): void {
    this.loadSemAgendamento(event.pageIndex, event.pageSize);
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

  private formatDataCurta(iso: string): string {
    if (!iso) return '';
    const [, mes, dia] = iso.split('-');
    return `${dia}/${mes}`;
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
