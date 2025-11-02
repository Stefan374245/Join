import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getUserColorByIdentifier, getUserInitials, getUserColorClass } from '../../constants/colors.constants';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent implements OnInit {
  @Input() name: string = '';
  @Input() userId?: string;
  @Input() imageUrl?: string;
  @Input() size: AvatarSize = 'md';
  @Input() color?: string;

  initials: string = '';
  colorClass: string = '';

  ngOnInit(): void {
    this.initials = getUserInitials(this.name);
    
    if (this.color) {
      this.colorClass = getUserColorClass(this.color);
    } else {
      const identifier = this.userId || this.name;
      const userColor = getUserColorByIdentifier(identifier);
      this.colorClass = getUserColorClass(userColor);
    }
  }
}
