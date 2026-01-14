import { Component, input, output, ViewEncapsulation, viewChild, AfterViewInit } from '@angular/core';
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
  dropList = viewChild.required<CdkDropList>(CdkDropList);
  
  columnId = input.required<string>();
  title = input.required<string>();
  tasks = input.required<Task[]>();
  contacts = input.required<Contact[]>();
  loading = input<boolean>(false);
  connectedDropLists = input<CdkDropList[]>([]);
  
  taskDropped = output<{ event: CdkDragDrop<Task[]>, status: string }>();
  addTaskClicked = output<string>();
  taskClicked = output<Task>();
  addButtonHover = output<{ event: MouseEvent, isHover: boolean }>();

  ngAfterViewInit(): void {
    if (this.dropList() && this.connectedDropLists().length > 0) {
      this.dropList()!.connectedTo = this.connectedDropLists();
    }
  }

  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    this.taskDropped.emit({ event, status: this.columnId() });
  }

  onAddTaskClick(): void {
    this.addTaskClicked.emit(this.columnId());
  }

  onTaskClick(task: Task): void {
    this.taskClicked.emit(task);
  }

  onAddButtonHover(event: MouseEvent, isHover: boolean): void {
    this.addButtonHover.emit({ event, isHover });
  }
}
