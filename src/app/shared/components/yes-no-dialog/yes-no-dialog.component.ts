import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

export type DialogType = 'activate' | 'deactivate' | 'delete';

export interface DialogData {
  title: string;
  content: string;
  type: DialogType;
}

@Component({
  selector: 'app-yes-no-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './yes-no-dialog.component.html',
  styleUrl: './yes-no-dialog.component.css',
})
export class YesNoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  get confirmLabel(): string {
    switch (this.data.type) {
      case 'activate':
        return 'Sim, ativar';
      case 'deactivate':
        return 'Sim, inativar';
      case 'delete':
        return 'Sim, excluir';
    }
  }
}
