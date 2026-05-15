import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ToastSnackbarComponent } from '../components/toast-snackbar/toast-snackbar.component';

export type NotificationType = 'success' | 'warning' | 'error';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string, type: NotificationType = 'success', duration = 3000) {
    this.snackBar.openFromComponent(ToastSnackbarComponent, {
      data: { message, type, duration },
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['toast-panel', `toast-${type}`],
    });
  }
}
