import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { RelatorioOperacionalService } from '@services/apis/relatorio-operacional/relatorio-operacional.service';
import { RelatorioFinanceiroService } from '@services/apis/relatorio-financeiro/relatorio-financeiro.service';
import { PatientService } from '@services/apis/patient/patient.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AuthService } from '@services/apis/auth/auth.service';

const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private readonly relatorioOperacional = inject(RelatorioOperacionalService);
  private readonly relatorioFinanceiro = inject(RelatorioFinanceiroService);
  private readonly patientService = inject(PatientService);
  private readonly snackbar = inject(SnackbarService);
  private readonly auth = inject(AuthService);

  consultasHoje = signal<number | null>(null);
  pacientesAtivos = signal<number | null>(null);
  faturamentoMes = signal<number | null>(null);

  readonly nomeUsuario = this.resolverNomeUsuario();
  readonly dataHoje = this.formatarDataHoje();

  ngOnInit(): void {
    this.relatorioOperacional.consultasPorData(0, 1).subscribe({
      next: (page) => this.consultasHoje.set(page.totalElements),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar as consultas de hoje.'),
    });

    this.patientService.listarComFiltros(0, 1, { ativo: true }).subscribe({
      next: (page) => this.pacientesAtivos.set(page.totalElements),
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar os pacientes ativos.'),
    });

    this.relatorioFinanceiro.faturamentoMensal(0, 12).subscribe({
      next: (page) => {
        const agora = new Date();
        const mesAtual = page.content.find(
          (item) =>
            item.ano === agora.getFullYear() &&
            item.mes === agora.getMonth() + 1
        );
        this.faturamentoMes.set(mesAtual?.totalFaturado ?? null);
      },
      error: (err) =>
        this.notifyError(err, 'Erro ao carregar o faturamento do mês.'),
    });
  }

  faturamentoFormatado(): string {
    const valor = this.faturamentoMes();
    return valor === null ? '—' : MOEDA.format(valor);
  }

  private resolverNomeUsuario(): string {
    const data = this.auth.getUserData();
    return data?.nome ?? data?.name ?? data?.username ?? 'Administrador';
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
