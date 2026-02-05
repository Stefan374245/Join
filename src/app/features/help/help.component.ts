import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { Location } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
  imports: [RouterLink]
})
export class HelpComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
