import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { I18nService } from '../core/i18n.service';
import { Item, ItemsApi } from '../core/items.api';
import { ItemGrid } from './pages';
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ItemGrid],
  template: `<section class="library">
    <header>
      <span class="eyebrow">FOUNDLY</span>
      <h1>{{ i.t('favorites') }}</h1>
    </header>
    <p *ngIf="loading">{{ i.t('loading') }}</p>
    <button *ngIf="error" (click)="load()">{{ i.t('retry') }}</button>
    <div class="empty-state" *ngIf="!loading && !error && !items.length">
      <img src="icons/heart.svg" alt="" />
      <h2>{{ i.t('emptyFavorites') }}</h2>
      <a class="primary" routerLink="/explore">{{ i.t('explore') }}</a>
    </div>
    <item-grid [items]="items"></item-grid>
  </section>`,
  styles: [
    `
      :host {
        display: block;
        padding: 2rem 0 7rem;
      }
      .library header h1 {
        font-size: clamp(2rem, 5vw, 4rem);
      }
      .eyebrow {
        color: var(--color-primary);
        font-weight: 800;
        letter-spacing: 0.15em;
      }
    `,
  ],
})
export class FavoritesPage implements OnInit {
  i = inject(I18nService);
  api = inject(ItemsApi);
  cdr = inject(ChangeDetectorRef);
  items: Item[] = [];
  loading = true;
  error = false;
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.error = false;
    this.api
      .favorites()
      .pipe(switchMap((ids) => (ids.length ? forkJoin(ids.map((id) => this.api.get(id))) : of([]))))
      .subscribe({
        next: (x) => {
          this.items = x;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.error = true;
          this.cdr.detectChanges();
        },
      });
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="library">
    <header>
      <span class="eyebrow">FOUNDLY</span>
      <h1>{{ i.t('myListings') }}</h1>
      <a class="primary" routerLink="/create">{{ i.t('post') }}</a>
    </header>
    <div class="filters">
      <select [(ngModel)]="type" (change)="load()">
        <option value="">{{ i.t('all') }}</option>
        <option value="Lost">{{ i.t('lost') }}</option>
        <option value="Found">{{ i.t('found') }}</option></select
      ><select [(ngModel)]="status" (change)="load()">
        <option value="">{{ i.t('allStatuses') }}</option>
        <option value="0">{{ i.t('active') }}</option>
        <option value="1">{{ i.t('matched') }}</option>
        <option value="2">{{ i.t('returned') }}</option>
        <option value="3">{{ i.t('closed') }}</option>
      </select>
    </div>
    <p *ngIf="loading">{{ i.t('loading') }}</p>
    <div class="empty-state" *ngIf="!loading && !items.length">
      <h2>{{ i.t('emptyListings') }}</h2>
      <a class="primary" routerLink="/create">{{ i.t('post') }}</a>
    </div>
    <article *ngFor="let item of items" class="owned">
      <a [routerLink]="['/items', item.id]"
        ><b>{{ item.title }}</b
        ><span>{{ item.location }}</span></a
      >
      <div>
        <a [routerLink]="['/items', item.id, 'edit']">{{ i.t('edit') }}</a
        ><button (click)="remove(item)">{{ i.t('delete') }}</button>
      </div>
    </article>
    <p class="error" *ngIf="error">{{ error }}</p>
  </section>`,
  styles: [
    `
      :host {
        display: block;
        padding: 2rem 0 7rem;
      }
      .library header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .library header h1 {
        font-size: clamp(2rem, 5vw, 4rem);
        margin-right: auto;
      }
      .eyebrow {
        display: none;
      }
      .filters {
        display: flex;
        gap: 0.7rem;
        margin: 1rem 0;
      }
      .filters select {
        padding: 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        background: var(--color-surface);
        color: inherit;
      }
      .owned {
        display: flex;
        align-items: center;
        padding: 1rem;
        margin: 0.7rem 0;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        background: var(--color-surface);
      }
      .owned > a {
        display: grid;
        gap: 0.3rem;
        margin-right: auto;
      }
      .owned span {
        color: var(--color-muted);
      }
      .owned div {
        display: flex;
        gap: 0.5rem;
      }
      .owned button,
      .owned div a {
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--color-border);
        border-radius: 10px;
        background: transparent;
        color: inherit;
        font: inherit;
      }
      .error {
        color: #b32b2b;
      }
    `,
  ],
})
export class MyListingsPage implements OnInit {
  i = inject(I18nService);
  api = inject(ItemsApi);
  cdr = inject(ChangeDetectorRef);
  items: Item[] = [];
  type = '';
  status = '';
  loading = true;
  error = '';
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.api.mine({ type: this.type, status: this.status }).subscribe({
      next: (x) => {
        this.items = x.items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = this.i.t('loadFailed');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
  remove(item: Item) {
    if (!confirm(this.i.t('deleteConfirm'))) return;
    this.api
      .remove(item.id)
      .subscribe({ next: () => this.load(), error: () => (this.error = this.i.t('deleteFailed')) });
  }
}
