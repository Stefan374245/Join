import { Component, Input, Output, EventEmitter, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Task } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  templateUrl: './board-column.component.html',
  styleUrl: './board-column.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class BoardColumnComponent implements AfterViewInit {
  @ViewChild(CdkDropList) dropList!: CdkDropList;
  
  @Input({ required: true }) columnId!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tasks: Task[] = [];
  @Input({ required: true }) contacts: Contact[] = [];
  @Input() loading: boolean = false;
  @Input() connectedDropLists: CdkDropList[] = [];
  
  @Output() taskDropped = new EventEmitter<{ event: CdkDragDrop<Task[]>, status: string }>();
  @Output() addTaskClicked = new EventEmitter<string>();
  @Output() taskClicked = new EventEmitter<Task>();
  @Output() addButtonHover = new EventEmitter<{ event: MouseEvent, isHover: boolean }>();

  ngAfterViewInit(): void {
    if (this.dropList && this.connectedDropLists.length > 0) {
      this.dropList.connectedTo = this.connectedDropLists;
    }
  }

  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    this.taskDropped.emit({ event, status: this.columnId });
  }

  onAddTaskClick(): void {
    this.addTaskClicked.emit(this.columnId);
  }

  onTaskClick(task: Task): void {
    this.taskClicked.emit(task);
  }

  onAddButtonHover(event: MouseEvent, isHover: boolean): void {
    this.addButtonHover.emit({ event, isHover });
  }
}
