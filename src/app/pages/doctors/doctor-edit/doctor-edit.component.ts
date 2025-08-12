import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorFormComponent } from '../components/doctor-form/doctor-form.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { EditDoctor } from '../doctor.models';

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
  mensagemErro: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private medicoService: DoctorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.medicoId = Number(idParam);

    if (!this.medicoId) {
      this.mensagemErro = 'ID de médico inválido.';
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
        this.mensagemErro = 'Erro ao carregar dados do médico.';
      },
    });
  }

  onSalvar(medicoAtualizado: EditDoctor) {
    this.mensagemErro = null;

    this.medicoService.atualizar(this.medicoId, medicoAtualizado).subscribe({
      next: () => {
        alert('Médico atualizado com sucesso!');
        this.router.navigate(['/medicos/lista']);
      },
      error: (err) => {
        console.error('Erro ao atualizar médico:', err);
        if (err.status === 409) {
          this.mensagemErro =
            err.error?.message || 'Conflito ao atualizar médico.';
        } else {
          this.mensagemErro = 'Erro inesperado ao atualizar médico.';
        }
      },
    });
  }
}
