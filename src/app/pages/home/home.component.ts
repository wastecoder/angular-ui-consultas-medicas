import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, MatButtonModule, HasRoleDirective],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
