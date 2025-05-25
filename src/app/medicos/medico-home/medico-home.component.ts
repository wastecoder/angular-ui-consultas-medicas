import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-medico-home',
  standalone: true,
  imports: [RouterModule, MatButtonModule],
  templateUrl: './medico-home.component.html',
})
export class MedicoHomeComponent {}
