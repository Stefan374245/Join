import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink} from '@angular/router';


@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss'
})
export class LegalNoticeComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
