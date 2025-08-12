import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DoctorTableComponent,
  MedicoModel,
} from '../components/doctor-table/doctor-table.component';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, DoctorTableComponent],
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements OnInit {
  private readonly medicoService = inject(DoctorService);
  medicos: MedicoModel[] = [];
  private readonly router = inject(Router);

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
    this.router.navigate(['/medicos/editar', medico.id]);
  }
}
