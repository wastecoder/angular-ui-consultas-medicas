import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HasRoleDirective } from '@shared/auth/has-role.directive';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, HasRoleDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {}
