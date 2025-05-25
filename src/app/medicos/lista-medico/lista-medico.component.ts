import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MedicoTabelaComponent,
  MedicoModel,
} from '../components/medico-tabela/medico-tabela.component';

@Component({
  selector: 'app-lista-medico',
  standalone: true,
  imports: [CommonModule, MedicoTabelaComponent],
  templateUrl: './lista-medico.component.html',
})
export class ListaMedicoComponent {
  medicos: MedicoModel[] = []; // Aqui você vai carregar da API no futuro

  delete(medico: MedicoModel) {
    console.log('Deletar médico:', medico);
    // Lógica futura para deletar
  }

  update(medico: MedicoModel) {
    console.log('Atualizar médico:', medico);
    // Lógica futura para atualizar
  }
}
