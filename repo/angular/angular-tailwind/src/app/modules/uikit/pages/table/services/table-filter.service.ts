import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TableFilterService {
  searchField = signal<string>('');
  statusField = signal<string>('2');
  orderField = signal<string>('');

  constructor() {}
}
