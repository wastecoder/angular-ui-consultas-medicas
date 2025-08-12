import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-layout-full',
  imports: [RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './layout-full.component.html',
  styleUrl: './layout-full.component.css',
})
export class LayoutFullComponent {}
