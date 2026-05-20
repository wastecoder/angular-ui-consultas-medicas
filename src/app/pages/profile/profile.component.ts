import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '@services/apis/auth/auth.service';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { PatientService } from '@services/apis/patient/patient.service';
import { FormattingService } from '@shared/services/formatting.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DoctorProfile } from '@pages/doctors/doctor.models';
import { PacienteProfile } from '@pages/patients/patient.models';
import { Funcao } from '@shared/auth/role.types';

// Rótulos pt-BR para as funções (o JWT guarda os valores em caixa alta).
const FUNCAO_LABEL: Record<Funcao, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  MEDICO: 'Médico',
  PACIENTE: 'Paciente',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly formatting = inject(FormattingService);
  private readonly snackbar = inject(SnackbarService);

  loading = signal(false);
  doctor = signal<DoctorProfile | null>(null);
  patient = signal<PacienteProfile | null>(null);

  private readonly userData = this.auth.getUserData();
  readonly roles = this.auth.getRoles();
  readonly isMedico = this.roles.includes('MEDICO');
  readonly isPaciente = this.roles.includes('PACIENTE');

  // Dados de conta extraídos do JWT (claims podem variar conforme o back).
  readonly username =
    this.userData?.username ?? this.userData?.sub ?? '—';
  readonly accountEmail = this.userData?.email ?? null;
  readonly funcoesLabel = this.roles
    .map((r) => FUNCAO_LABEL[r])
    .join(', ');

  // Nome exibido no cabeçalho: vem da entidade de domínio quando há médico/
  // paciente; senão, do que o JWT oferecer.
  nome = computed<string>(() => {
    return (
      this.doctor()?.nome ??
      this.patient()?.nome ??
      this.userData?.nome ??
      this.userData?.name ??
      this.username
    );
  });

  subtitulo = computed<string>(() => {
    const medico = this.doctor();
    if (medico) {
      const especialidade =
        medico.especialidade.charAt(0) +
        medico.especialidade.slice(1).toLowerCase();
      return `${this.formatting.formatCrm(medico)} · ${especialidade}`;
    }
    if (this.isPaciente) return 'Paciente';
    return this.funcoesLabel || 'Usuário';
  });

  iniciais = computed<string>(() => {
    const words = this.nome()
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const first = words[0]?.[0] ?? '';
    const second = words[1]?.[0] ?? '';
    return (first + second).toUpperCase() || '–';
  });

  ngOnInit(): void {
    if (this.isMedico) {
      this.carregarMedico();
    } else if (this.isPaciente) {
      this.carregarPaciente();
    }
  }

  private carregarMedico(): void {
    this.loading.set(true);
    this.doctorService
      .meuPerfil()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.doctor.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar os seus dados de médico.'),
      });
  }

  private carregarPaciente(): void {
    this.loading.set(true);
    this.patientService
      .meuPerfil()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.patient.set(data),
        error: (err) =>
          this.notifyError(err, 'Erro ao carregar os seus dados de paciente.'),
      });
  }

  formatTelephone(telefone: string): string {
    return this.formatting.formatTelephone(telefone);
  }

  formatCpf(cpf: string): string {
    return this.formatting.formatCpf(cpf);
  }

  private notifyError(err: unknown, fallback: string): void {
    console.error(fallback, err);
    const apiMsg = (err as { error?: { message?: string } } | null)?.error
      ?.message;
    this.snackbar.show(apiMsg ?? fallback, 'error');
  }
}
