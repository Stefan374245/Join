import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Contact } from '../models/contact.interface';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  constructor() { }

  loadAll(): Observable<Contact[]> {
    const usersCol = collection(this.firestore, 'users');

    const p = getDocs(usersCol)
      .then((snapshot) => {
        const result: Contact[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const email = data['email'] || '';
          
          let firstName = data['firstName'] || '';
          let lastName = data['lastName'] || '';
          
          if (!firstName && !lastName && data['displayName']) {
            const nameParts = data['displayName'].split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          const fullName = `${firstName} ${lastName}`.trim();
          
          const initials = data['initials'] || (fullName 
            ? fullName.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()
            : email.substring(0, 2).toUpperCase());

          const color = data['color'] || this.generateColorFromEmail(email);

          return {
            id: doc.id,
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: data['phone'] || '',
            color: color,
            initials: initials
          } as Contact;
        });

        result.sort((a, b) => 
          (a.firstName + ' ' + a.lastName).localeCompare(
            b.firstName + ' ' + b.lastName, 
            undefined, 
            { sensitivity: 'base' }
          )
        );

        return result;
      })
      .catch((err) => {
        return [];
      });

    return from(p);
  }

  getContacts(): Observable<Contact[]> {
    return this.loadAll();
  }

  private generateColorFromEmail(email: string): string {
    const colors = [
      '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
      '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
      '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B'
    ];
    
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  }

  getByEmail(email: string): Observable<Contact | null> {
    return this.loadAll().pipe(
      map(list => list.find(c => c.email === email) ?? null)
    );
  }

  saveUser(userId: string, userData: { displayName: string; email: string; color?: string }): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const color = userData.color || this.generateColorFromEmail(userData.email);
    
    const promise = setDoc(userDoc, {
      displayName: userData.displayName,
      email: userData.email,
      color: color,
      createdAt: new Date().toISOString()
    });

    return from(promise);
  }

  saveContact(contact: Contact): Observable<void> {
    const contactDoc = doc(this.firestore, 'users', contact.id);
    const color = contact.color || this.generateColorFromEmail(contact.email);
    
    const promise = setDoc(contactDoc, {
      firstName: contact.firstName,
      lastName: contact.lastName,
      displayName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone || '',
      color: color,
      initials: contact.initials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return from(promise);
  }

  updateUser(userId: string, data: Partial<Contact>): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    if (data.firstName || data.lastName) {
      updateData.displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    }
    
    const promise = setDoc(userDoc, updateData, { merge: true });
    return from(promise);
  }

  deleteUser(userId: string): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const promise = deleteDoc(userDoc);
    return from(promise);
  }
}
