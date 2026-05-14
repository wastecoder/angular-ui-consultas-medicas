import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { HasRoleDirective } from '@shared/auth/has-role.directive';
import { AuthService } from '@services/apis/auth/auth.service';
import { Funcao } from '@shared/auth/role.types';

const ROLE_LABELS: Record<Funcao, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  MEDICO: 'Médico',
  PACIENTE: 'Paciente',
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, HasRoleDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  menuOpen = signal(false);
  openDropdown = signal<string | null>(null);
  brandLabel = signal<string>('Usuário');
  suppressHover = signal(false);

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.auth.currentUser$.subscribe(() => this.refreshBrand())
    );
    this.subscriptions.add(
      this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe(() => {
          this.closeAll();
          this.suppressHover.set(true);
        })
    );
  }

  @HostListener('mouseleave')
  onHostMouseLeave(): void {
    this.suppressHover.set(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  toggleDropdown(id: string): void {
    this.openDropdown.update((current) => (current === id ? null : id));
  }

  closeAll(): void {
    this.openDropdown.set(null);
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.host.nativeElement.contains(target)) {
      this.openDropdown.set(null);
    }
  }

  private refreshBrand(): void {
    const role = this.auth.getRoles()[0];
    this.brandLabel.set(role ? ROLE_LABELS[role] : 'Usuário');
  }
}
