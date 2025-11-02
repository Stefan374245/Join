import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { 
  getUserColorByIdentifier, 
  getUserColor,
  Priority,
  PRIORITY_COLORS 
} from '../../shared/constants/colors.constants';

/**
 * Example component showing how to use the color system
 * This is for demonstration purposes only
 */
@Component({
  selector: 'app-color-example',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent],
  template: `
    <div class="color-examples">
      <h2>Color System Examples</h2>
      
      <!-- User Avatar Examples -->
      <section class="section">
        <h3>User Avatars</h3>
        <div class="avatar-row">
          <app-user-avatar name="John Doe" size="sm"></app-user-avatar>
          <app-user-avatar name="Jane Smith" size="md"></app-user-avatar>
          <app-user-avatar name="Bob Wilson" size="lg"></app-user-avatar>
        </div>
      </section>

      <!-- Priority Badges -->
      <section class="section">
        <h3>Priority Badges</h3>
        <div class="badge-row">
          <span class="priority-badge priority-low">Low Priority</span>
          <span class="priority-badge priority-medium">Medium Priority</span>
          <span class="priority-badge priority-urgent">Urgent Priority</span>
        </div>
      </section>

      <!-- User Color Classes -->
      <section class="section">
        <h3>User Color Classes</h3>
        <div class="color-grid">
          <div class="color-box userColor-FF7A00">FF7A00</div>
          <div class="color-box userColor-FF5EB3">FF5EB3</div>
          <div class="color-box userColor-6E52FF">6E52FF</div>
          <div class="color-box userColor-9327FF">9327FF</div>
          <div class="color-box userColor-00BEE8">00BEE8</div>
          <div class="color-box userColor-1FD7C1">1FD7C1</div>
          <div class="color-box userColor-FF745E">FF745E</div>
          <div class="color-box userColor-FFA35E">FFA35E</div>
        </div>
      </section>

      <!-- Dynamic Colors from TypeScript -->
      <section class="section">
        <h3>Dynamic Colors (TypeScript)</h3>
        <div class="dynamic-examples">
          <div 
            *ngFor="let user of exampleUsers" 
            class="user-card"
            [style.border-left]="'4px solid ' + getUserColorForUser(user.id)">
            <app-user-avatar 
              [name]="user.name" 
              [userId]="user.id"
              size="sm">
            </app-user-avatar>
            <span>{{ user.name }}</span>
          </div>
        </div>
      </section>

      <!-- Utility Classes -->
      <section class="section">
        <h3>Utility Classes</h3>
        <div class="utility-examples">
          <div class="card bg-primary text-white">Primary Background</div>
          <div class="card bg-secondary text-white">Secondary Background</div>
          <p class="text-link">Link styled text</p>
          <p class="text-error">Error styled text</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .color-examples {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .section {
      margin-bottom: 40px;
    }

    h2 {
      color: #2A3647;
      margin-bottom: 30px;
    }

    h3 {
      color: #2A3647;
      margin-bottom: 15px;
      font-size: 18px;
    }

    .avatar-row {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .badge-row {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }

    .color-box {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }

    .dynamic-examples {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .utility-examples {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .card {
      padding: 15px;
      border-radius: 8px;
    }

    .text-white {
      color: white;
    }
  `]
})
export class ColorExampleComponent {
  exampleUsers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
    { id: 'user3', name: 'Bob Wilson' },
    { id: 'user4', name: 'Alice Johnson' }
  ];

  getUserColorForUser(userId: string): string {
    return getUserColorByIdentifier(userId);
  }

  // Example: Using priority colors in TypeScript
  getTaskPriorityColor(priority: Priority): string {
    return PRIORITY_COLORS[priority];
  }

  // Example: Get color by index
  getColorAtIndex(index: number): string {
    return getUserColor(index);
  }
}
