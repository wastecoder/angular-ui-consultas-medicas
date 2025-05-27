import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edita-medico',
  imports: [],
  templateUrl: './edita-medico.component.html',
  styleUrl: './edita-medico.component.css',
})
export class EditaMedicoComponent {
  medicoId!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.medicoId = this.route.snapshot.paramMap.get('id')!;
  }
}
