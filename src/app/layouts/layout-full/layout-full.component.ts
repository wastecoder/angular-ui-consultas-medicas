import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { LoadingService } from '@shared/services/loading.service';

@Component({
  selector: 'app-layout-full',
  imports: [RouterModule, NavbarComponent, FooterComponent, MatProgressBarModule],
  templateUrl: './layout-full.component.html',
  styleUrl: './layout-full.component.css',
})
export class LayoutFullComponent {
  protected loading = inject(LoadingService);
}
