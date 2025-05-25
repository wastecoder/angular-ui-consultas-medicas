import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CustomPaginator } from './custom-paginator';
import { MedicoTable } from '../../medico.models';

export type MedicoModel = MedicoTable;

@Component({
  selector: 'app-medico-tabela',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './medico-tabela.component.html',
  providers: [{ provide: MatPaginatorIntl, useClass: CustomPaginator }],
})
export class MedicoTabelaComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() medicos: MedicoModel[] = [];

  @Output() onConfirmDelete = new EventEmitter<MedicoModel>();
  @Output() onRequestUpdate = new EventEmitter<MedicoModel>();

  dataSource!: MatTableDataSource<MedicoModel>;

  displayedColumns: string[] = ['nome', 'crm', 'especialidade', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private subs?: Subscription;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['medicos'] && this.medicos) {
      this.dataSource = new MatTableDataSource(this.medicos);
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }

  delete(medico: MedicoModel) {
    this.onConfirmDelete.emit(medico);
  }

  update(medico: MedicoModel) {
    this.onRequestUpdate.emit(medico);
  }
}
