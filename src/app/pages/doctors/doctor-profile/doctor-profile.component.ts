import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DoctorService } from '@services/apis/doctor/doctor.service';
import { DoctorProfile } from '@pages/doctors/doctor.models';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css',
})
export class DoctorProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly doctorService = inject(DoctorService);

  doctor!: DoctorProfile;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.doctorService.buscarPorId(id).subscribe({
      next: (data) => {
        this.doctor = data;
      },
      error: (err) => {
        console.error('Erro ao carregar médico:', err);
      },
    });
  }

  update(medico: DoctorProfile) {
    this.router.navigate(['/doctors', medico.id, 'edit']);
  }

  activate(): void {
    this.doctorService.ativar(this.doctor.id).subscribe(() => {
      this.doctor.ativo = true;
    });
  }

  deactivate(): void {
    this.doctorService.inativar(this.doctor.id).subscribe(() => {
      this.doctor.ativo = false;
    });
  }

  delete(): void {
    this.doctorService.excluir(this.doctor.id).subscribe(() => {
      this.router.navigate(['/doctors']);
    });
  }
}
