import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubtaskManagementComponent, Subtask } from './subtask-management.component';
import { ToastService } from '../../../../core/services/toast.service';

describe('SubtaskManagementComponent', () => {
    let component: SubtaskManagementComponent;
    let fixture: ComponentFixture<SubtaskManagementComponent>;
    let toastService: jasmine.SpyObj<ToastService>;
    let testSubtasks: Subtask[];

    beforeEach(async () => {
        const toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);

        await TestBed.configureTestingModule({
            imports: [SubtaskManagementComponent],
            providers: [
                { provide: ToastService, useValue: toastServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SubtaskManagementComponent);
        component = fixture.componentInstance;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        
        testSubtasks = [
            { id: '1', title: 'Subtask 1', completed: false },
            { id: '2', title: 'Subtask 2', completed: false },
            { id: '3', title: 'Subtask 3', completed: false }
        ];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with empty subtask input', () => {
        expect(component.subtaskInputControl().value).toBe('');
    });

    it('should initialize with closed dropdown', () => {
        expect(component.isDropdownOpen()).toBe(false);
    });

    it('should show all subtasks when count <= 2', () => {
        fixture.componentRef.setInput('subtasks', testSubtasks.slice(0, 2));
        expect(component.visibleSubtasks().length).toBe(2);
    });

    it('should show only first 2 subtasks when count > 2', () => {
        fixture.componentRef.setInput('subtasks', testSubtasks);
        expect(component.visibleSubtasks().length).toBe(2);
        expect(component.visibleSubtasks()[0].id).toBe('1');
    });

    it('should calculate remaining subtasks correctly', () => {
        fixture.componentRef.setInput('subtasks', testSubtasks);
        expect(component.remainingSubtasks().length).toBe(1);
        expect(component.remainingSubtasksCount()).toBe(1);
    });

    it('should allow adding more when under limit', () => {
        fixture.componentRef.setInput('subtasks', testSubtasks);
        expect(component.canAddMore()).toBe(true);
    });

    it('should not allow adding when at limit', () => {
        const maxSubtasks = Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            title: `Subtask ${i + 1}`,
            completed: false
        }));
        fixture.componentRef.setInput('subtasks', maxSubtasks);
        expect(component.canAddMore()).toBe(false);
    });

    it('should show appropriate placeholder for empty list', () => {
        fixture.componentRef.setInput('subtasks', []);
        expect(component.inputPlaceholder()).toBe('Add new subtask');
    });

    it('should show max limit placeholder when full', () => {
        const maxSubtasks = Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            title: `Subtask ${i + 1}`,
            completed: false
        }));
        fixture.componentRef.setInput('subtasks', maxSubtasks);
        expect(component.inputPlaceholder()).toContain('Maximum');
    });

    it('should emit addSubtask event with trimmed value', () => {
        fixture.componentRef.setInput('subtasks', []);
        
        let emittedValue = '';
        component.addSubtask.subscribe(value => emittedValue = value);

        component.subtaskInputControl().setValue('  New Subtask  ');
        component.onAddSubtask();

        expect(emittedValue).toBe('New Subtask');
    });

    it('should not emit when input is empty', () => {
        let emitted = false;
        component.addSubtask.subscribe(() => emitted = true);

        component.subtaskInputControl().setValue('');
        component.onAddSubtask();

        expect(emitted).toBe(false);
    });

    it('should not emit when input is only whitespace', () => {
        let emitted = false;
        component.addSubtask.subscribe(() => emitted = true);

        component.subtaskInputControl().setValue('   ');
        component.onAddSubtask();

        expect(emitted).toBe(false);
    });

    it('should show toast when trying to add beyond limit', () => {
        const maxSubtasks = Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            title: `Subtask ${i + 1}`,
            completed: false
        }));
        fixture.componentRef.setInput('subtasks', maxSubtasks);

        component.subtaskInputControl().setValue('New Subtask');
        component.onAddSubtask();

        expect(toastService.showToast).toHaveBeenCalledWith('Maximal 5 Subtasks erlaubt');
    });

    it('should reset input after adding subtask', () => {
        fixture.componentRef.setInput('subtasks', []);
        
        component.addSubtask.subscribe(() => {});
        component.subtaskInputControl().setValue('New Subtask');
        component.onAddSubtask();

        expect(component.subtaskInputControl().value).toBe('');
    });

    it('should add subtask on Enter key', () => {
        fixture.componentRef.setInput('subtasks', []);
        
        let emittedValue = '';
        component.addSubtask.subscribe(value => emittedValue = value);

        component.subtaskInputControl().setValue('New Subtask');
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(event, 'preventDefault');
        
        component.onAddInputKeydown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(emittedValue).toBe('New Subtask');
    });

    it('should emit editSubtask event when editing', () => {
        fixture.componentRef.setInput('subtasks', testSubtasks);
        
        let emittedSubtask: Subtask | undefined;
        component.editSubtask.subscribe(subtask => emittedSubtask = subtask);

        component.onEdit(testSubtasks[0]);

        expect(emittedSubtask).toEqual(testSubtasks[0]);
    });

    it('should emit updateSubtask event', () => {
        let emitted = false;
        component.updateSubtask.subscribe(() => emitted = true);

        component.onUpdate();

        expect(emitted).toBe(true);
    });

    it('should emit cancelEditSubtask event', () => {
        let emitted = false;
        component.cancelEditSubtask.subscribe(() => emitted = true);

        component.onCancelEdit();

        expect(emitted).toBe(true);
    });

    it('should sync edit input value with parent input', () => {
        fixture.componentRef.setInput('subtaskEditInput', 'Test Value');
        fixture.detectChanges();

        expect(component.editInputValue()).toBe('Test Value');
    });

    it('should cancel edit on input blur when clicking outside', () => {
        let emitted = false;
        component.cancelEditSubtask.subscribe(() => emitted = true);

        const event = new FocusEvent('blur', { relatedTarget: null });
        component.onInputBlur(event);

        expect(emitted).toBe(true);
    });

    it('should not cancel edit when clicking edit icons', () => {
        let emitted = false;
        component.cancelEditSubtask.subscribe(() => emitted = true);

        const mockElement = document.createElement('img');
        mockElement.classList.add('subtask-edit-icon');
        const event = new FocusEvent('blur', { relatedTarget: mockElement });
        
        component.onInputBlur(event);

        expect(emitted).toBe(false);
    });

    it('should emit deleteSubtask event with id', () => {
        let emittedId = '';
        component.deleteSubtask.subscribe(id => emittedId = id);

        component.onDelete('test-id');

        expect(emittedId).toBe('test-id');
    });

    it('should toggle dropdown state', () => {
        expect(component.isDropdownOpen()).toBe(false);

        component.toggleDropdown();
        expect(component.isDropdownOpen()).toBe(true);

        component.toggleDropdown();
        expect(component.isDropdownOpen()).toBe(false);
    });

    it('should close dropdown', () => {
        component.isDropdownOpen.set(true);

        component.closeDropdown();

        expect(component.isDropdownOpen()).toBe(false);
    });

    it('should render input field', () => {
        fixture.componentRef.setInput('subtasks', []);
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('.subtask-input');
        expect(input).toBeTruthy();
    });

    it('should render add button', () => {
        fixture.componentRef.setInput('subtasks', []);
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector('.subtask-add-button');
        expect(button).toBeTruthy();
    });

    it('should render subtasks list when not empty', () => {
        fixture.componentRef.setInput('subtasks', testSubtasks);
        fixture.detectChanges();

        const list = fixture.nativeElement.querySelector('.subtasks-list');
        expect(list).toBeTruthy();
    });

    it('should not render subtasks list when empty', () => {
        fixture.componentRef.setInput('subtasks', []);
        fixture.detectChanges();

        const list = fixture.nativeElement.querySelector('.subtasks-list');
        expect(list).toBeFalsy();
    });

    it('should disable input when at max limit', () => {
        const maxSubtasks = Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            title: `Subtask ${i + 1}`,
            completed: false
        }));
        fixture.componentRef.setInput('subtasks', maxSubtasks);
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('.subtask-input');
        expect(input.disabled).toBe(true);
    });
});
