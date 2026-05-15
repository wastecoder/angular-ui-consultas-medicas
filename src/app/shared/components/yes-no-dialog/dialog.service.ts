import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogData,
  YesNoDialogComponent,
} from '@shared/components/yes-no-dialog/yes-no-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: DialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(YesNoDialogComponent, {
      data,
    });

    return firstValueFrom(dialogRef.afterClosed());
  }
}
