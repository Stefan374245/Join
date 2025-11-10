import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer-auth',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer-auth.component.html',
  styleUrl: './footer-auth.component.scss'
})
export class FooterAuthComponent {}
