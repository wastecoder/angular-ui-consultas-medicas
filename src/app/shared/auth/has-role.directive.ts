import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '@services/apis/auth/auth.service';
import { Funcao } from './role.types';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  private allowedRoles: Funcao[] = [];
  private subscription?: Subscription;
  private viewRendered = false;

  @Input({ required: true }) set appHasRole(roles: Funcao[]) {
    this.allowedRoles = roles ?? [];
    this.updateView();
  }

  ngOnInit(): void {
    this.subscription = this.auth.currentUser$.subscribe(() => this.updateView());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    const allowed = this.auth.hasAnyRole(this.allowedRoles);
    if (allowed && !this.viewRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.viewRendered = true;
    } else if (!allowed && this.viewRendered) {
      this.viewContainer.clear();
      this.viewRendered = false;
    }
  }
}
