import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'warning' | 'error';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, type: NotificationType = 'success', duration = 3000) {
    this.snackBar.open(message, '✖', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: [`snackbar-${type}`], // classe CSS
    });
  }
}
