import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorFormComponent } from '../components/doctor-form/doctor-form.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { EditDoctor } from '../doctor.models';
import { SnackbarService } from '@shared/snackbar/snackbar.service';

@Component({
  selector: 'app-doctor-edit',
  standalone: true,
  imports: [DoctorFormComponent],
  templateUrl: './doctor-edit.component.html',
})
export class DoctorEditComponent implements OnInit {
  medicoId!: number;
  medico: EditDoctor = {
    nome: '',
    email: '',
    crmSigla: '',
    crmDigitos: '',
    especialidade: '',
    telefone: '',
  };

  constructor(
    private route: ActivatedRoute,
    private medicoService: DoctorService,
    private router: Router,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.medicoId = Number(idParam);

    if (!this.medicoId) {
      this.snackbar.show('ID de médico inválido.', 'error');
      return;
    }

    this.medicoService.buscarPorId(this.medicoId).subscribe({
      next: (dados: EditDoctor) => {
        this.medico = {
          nome: dados.nome,
          email: dados.email,
          crmSigla: dados.crmSigla,
          crmDigitos: dados.crmDigitos,
          especialidade: dados.especialidade,
          telefone: dados.telefone,
        };
      },
      error: (err) => {
        console.error('Erro ao carregar médico:', err);
        this.snackbar.show('Erro ao carregar dados do médico.', 'error');
      },
    });
  }

  onSalvar(medicoAtualizado: EditDoctor) {
    this.medicoService.atualizar(this.medicoId, medicoAtualizado).subscribe({
      next: () => {
        this.snackbar.show('Médico atualizado com sucesso!', 'success');
        this.router.navigate(['/medicos/lista']);
      },
      error: (err) => {
        console.error('Erro ao atualizar médico:', err);

        if (err.status === 409) {
          this.snackbar.show('Conflito: algum dado duplicado.', 'warning');
        } else {
          this.snackbar.show('Erro inesperado ao atualizar médico.', 'error');
        }
      },
    });
  }
}
