import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subtask-list.component.html',
  styleUrls: ['./subtask-list.component.scss']
})
export class SubtaskListComponent {
  @Input() subtasks: any[] = [];
  @Input() editingSubtaskId: string | null = null;
  @Input() subtaskEditInput: string = '';
  @Output() editSubtask = new EventEmitter<any>();
  @Output() deleteSubtask = new EventEmitter<string>();
  @Output() updateSubtask = new EventEmitter<void>();
  @Output() cancelEditSubtask = new EventEmitter<void>();

  onEdit(subtask: any) {
    this.editSubtask.emit(subtask);
  }
  onDelete(id: string) {
    this.deleteSubtask.emit(id);
  }
  onUpdate() {
    this.updateSubtask.emit();
  }
  onCancelEdit() {
    this.cancelEditSubtask.emit();
  }
}
