import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '@shared/services/loading.service';

@Component({
  selector: 'app-layout-blank',
  imports: [RouterModule, MatProgressBarModule],
  templateUrl: './layout-blank.component.html',
  styleUrl: './layout-blank.component.css',
})
export class LayoutBlankComponent {
  protected loading = inject(LoadingService);
}
