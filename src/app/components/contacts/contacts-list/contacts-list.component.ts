import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContactService } from '../../../services/contact.service';
import { Contact } from '../../../models/contact.interface';
import { Observable, BehaviorSubject } from 'rxjs';

type Grouped = { letter: string; items: Contact[] }[];

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contacts-list.component.html',
  styleUrl: './contacts-list.component.scss'
})
export class ContactsListComponent implements OnInit {
  private contactService = inject(ContactService);

  contacts$ = new BehaviorSubject<Contact[]>([]);
  grouped$ = new BehaviorSubject<Grouped>([]);

  // UI state
  selected: Contact | null = null;
  showRight = true;

  ngOnInit(): void {
    this.load();
    this.checkAutoSelect();
    this.onResize();
  }

  async load() {
    this.contactService.loadAll().subscribe({
      next: (list) => {
        console.log('✅ Contacts loaded:', list.length, 'contacts', list);
        this.contacts$.next(list);
        this.group(list);
      },
      error: (err) => {
        console.error('❌ Error loading contacts:', err);
      }
    });
  }

  private group(list: Contact[]) {
    const groupedRecord: Record<string, Contact[]> = {};
    list.forEach(u => {
      const name = `${u.firstName} ${u.lastName}`.trim();
      const letter = (name[0] || '#').toUpperCase();
      (groupedRecord[letter] ||= []).push(u);
    });

    const grouped: Grouped = Object.keys(groupedRecord).sort().map(l => ({ letter: l, items: groupedRecord[l] }));
    console.log('📋 Grouped contacts:', grouped);
    this.grouped$.next(grouped);
  }

  select(contact: Contact) {
    this.selected = contact;
    localStorage.setItem('selectedContactEmail', contact.email);
    localStorage.setItem('lastEditedContact', contact.email);
    if (window.innerWidth <= 800) {
      this.showRight = true;
    }
  }

  addContact() {
    // placeholder - open add contact dialog / route
    console.log('add contact');
  }

  clearSelection() {
    this.selected = null;
    localStorage.removeItem('selectedContactEmail');
  }

  checkAutoSelect() {
    const last = localStorage.getItem('lastEditedContact') || localStorage.getItem('selectedContactEmail');
    if (!last) return;
    this.contactService.getByEmail(last).subscribe(c => {
      if (c) this.selected = c;
    });
  }

  // responsive helper
  @HostListener('window:resize') onResize() {
    this.showRight = window.innerWidth >= 800;
  }
}
