import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { FooterComponent } from '@shared/components/footer/footer.component';
import { LoadingService } from '@shared/services/loading.service';
import { AuthService } from '@services/apis/auth/auth.service';

@Component({
  selector: 'app-layout-full',
  imports: [RouterModule, NavbarComponent, FooterComponent, MatProgressBarModule],
  templateUrl: './layout-full.component.html',
  styleUrl: './layout-full.component.css',
})
export class LayoutFullComponent implements OnInit, OnDestroy {
  protected loading = inject(LoadingService);
  private readonly auth = inject(AuthService);

  // Navbar e footer só aparecem para usuários logados; o visitante vê a
  // landing pública (Home) sem chrome.
  isLoggedIn = signal(this.auth.isLoggedIn());

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe(() => {
      this.isLoggedIn.set(this.auth.isLoggedIn());
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
