import { Component, HostBinding, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { NotificationType } from '../../services/snackbar.service';

export interface ToastSnackbarData {
  message: string;
  type: NotificationType;
  duration: number;
}

const ICONS: Record<NotificationType, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
};

@Component({
  selector: 'app-toast-snackbar',
  standalone: true,
  templateUrl: './toast-snackbar.component.html',
  styleUrl: './toast-snackbar.component.css',
})
export class ToastSnackbarComponent {
  readonly data = inject<ToastSnackbarData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject<MatSnackBarRef<ToastSnackbarComponent>>(MatSnackBarRef);

  readonly icon = ICONS[this.data.type];

  @HostBinding('class') get hostClass(): string {
    return `toast-snackbar toast-${this.data.type}`;
  }

  @HostBinding('style.--snackbar-duration.ms') get durationMs(): number {
    return this.data.duration;
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
