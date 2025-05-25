import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MedicoTabelaComponent,
  MedicoModel,
} from '../components/medico-tabela/medico-tabela.component';
import { MedicoService } from '../../services/apis/medicos/medico.service'; // ajuste o caminho se necessário

@Component({
  selector: 'app-lista-medico',
  standalone: true,
  imports: [CommonModule, MedicoTabelaComponent],
  templateUrl: './lista-medico.component.html',
})
export class ListaMedicoComponent implements OnInit {
  private readonly medicoService = inject(MedicoService);
  medicos: MedicoModel[] = [];

  ngOnInit(): void {
    this.carregarMedicos();
  }

  carregarMedicos(): void {
    this.medicoService.listar().subscribe({
      next: (dados) => {
        this.medicos = dados;
      },
      error: (erro) => {
        console.error('Erro ao carregar médicos:', erro);
      },
    });
  }

  delete(medico: MedicoModel) {
    console.log('Deletar médico:', medico);
    // Aqui você poderia chamar this.medicoService.excluir(medico.id).subscribe(...)
  }

  update(medico: MedicoModel) {
    console.log('Atualizar médico:', medico);
    // Aqui você pode redirecionar para uma rota de edição ou abrir um formulário
  }
}
