import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicoFormComponent } from '../components/medico-form/medico-form.component';
import { MedicoService } from '../../services/apis/medicos/medico.service';
import { MedicoEdit } from '../medico.models';

@Component({
  selector: 'app-edita-medico',
  standalone: true,
  imports: [MedicoFormComponent],
  templateUrl: './edita-medico.component.html',
})
export class EditaMedicoComponent implements OnInit {
  medicoId!: number;
  medico: MedicoEdit = {
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
    private medicoService: MedicoService,
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
      next: (dados: MedicoEdit) => {
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

  onSalvar(medicoAtualizado: MedicoEdit) {
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
