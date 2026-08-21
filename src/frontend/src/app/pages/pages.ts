import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { I18nService } from '../core/i18n.service';
import { Item, ItemsApi } from '../core/items.api';
import { AuthService } from '../core/auth.service';
import { CommunicationApi } from '../core/communication.api';
@Component({
  standalone: true,
  selector: 'item-grid',
  imports: [CommonModule, RouterLink],
  inputs: ['items'],
  template: `<div class="items">
    <article *ngFor="let item of items" class="item-card">
      <a [routerLink]="['/items', item.id]"
        ><div
          class="photo"
          [style.backgroundImage]="item.photos[0] ? 'url(' + item.photos[0].url + ')' : ''"
        >
          <span>{{ item.viewCount }} {{ i.t('views') }}</span>
        </div>
        <div class="item-copy">
          <small>{{ item.type === 1 ? i.t('found') : i.t('lost') }}</small
          ><b>{{ item.title }}</b
          ><span>{{ item.location }}</span>
        </div></a
      ><button
        class="card-favorite"
        (click)="toggle(item)"
        [attr.aria-label]="i.t('favorites')"
        [class.on]="item.isFavorite"
      >
        <img src="icons/heart.svg" alt="" />
      </button>
    </article>
  </div>`,
  styleUrl: './pages.scss',
})
export class ItemGrid {
  items: Item[] = [];
  i = inject(I18nService);
  api = inject(ItemsApi);
  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  toggle(item: Item) {
    if (!this.auth.authenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/items/${item.id}` } });
      return;
    }
    const action = item.isFavorite ? this.api.unfavorite(item.id) : this.api.favorite(item.id);
    action.subscribe({ next: () => {item.isFavorite = !item.isFavorite;this.cdr.detectChanges()} });
  }
}
@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterLink, ItemGrid],
  template: `<section class="hero">
      <div>
        <span class="eyebrow">FOUNDLY</span>
        <h1>{{ i.t('greeting') }}</h1>
        <p>{{ i.t('subtitle') }}</p>
        <div class="search">
          <img src="icons/search.svg" /><input
            [(ngModel)]="query"
            [placeholder]="i.t('search')"
          /><a [routerLink]="'/explore'" [queryParams]="{ q: query }"
            ><img src="icons/sliders-horizontal.svg"
          /></a>
        </div>
      </div>
      <div class="hero-art">
        <div class="bag">?</div>
        <span>Foundly</span>
      </div>
    </section>
    <section class="stats" aria-label="Item statistics">
      <div>
        <b>{{ statistics.lost }}</b
        ><span>{{ i.t('lost') }}</span>
      </div>
      <div>
        <b>{{ statistics.found }}</b
        ><span>{{ i.t('found') }}</span>
      </div>
      <div>
        <b>{{ statistics.returned }}</b
        ><span>{{ i.t('returned') }}</span>
      </div>
    </section>
    <section class="actions">
      <a routerLink="/create" [queryParams]="{ type: 'lost' }" class="action lost"
        ><div>
          <b>{{ i.t('lost') }}</b
          ><span>{{ i.t('lostHelp') }}</span>
        </div>
        <img src="icons/arrow-right.svg" /></a
      ><a routerLink="/create" [queryParams]="{ type: 'found' }" class="action found"
        ><div>
          <b>{{ i.t('found') }}</b
          ><span>{{ i.t('foundHelp') }}</span>
        </div>
        <img src="icons/arrow-right.svg"
      /></a>
    </section>
    <section>
      <div class="section-title">
        <h2>{{ i.t('categories') }}</h2>
        <a routerLink="/explore">{{ i.t('seeAll') }}</a>
      </div>
      <div class="categories">
        <a routerLink="/explore"
          ><img src="icons/grid-2x2.svg" alt="" /><span>{{ i.t('allItems') }}</span></a
        ><a *ngFor="let c of categories" routerLink="/explore" [queryParams]="{ categoryId: c.id }"
          ><img [src]="'icons/' + icon(c.slug) + '.svg'" alt="" /><span>{{
            i.t(c.nameKey)
          }}</span></a
        >
      </div>
    </section>
    <section>
      <div class="section-title">
        <h2>{{ i.t('nearby') }}</h2>
        <a routerLink="/explore">{{ i.t('seeAll') }}</a>
      </div>
      <div class="loading-grid" *ngIf="loading" aria-live="polite">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div class="error-state" *ngIf="error" role="alert">
        <h3>{{ i.t('loadFailed') }}</h3>
        <button (click)="load()">{{ i.t('retry') }}</button>
      </div>
      <div class="empty-state" *ngIf="!loading && !error && !items.length">
        <img src="icons/search.svg" alt="" />
        <h3>{{ i.t('emptyHome') }}</h3>
        <p>{{ i.t('emptyHomeHelp') }}</p>
        <a class="primary" routerLink="/create">{{ i.t('post') }}</a>
      </div>
      <item-grid *ngIf="!loading && !error && items.length" [items]="items" />
    </section>`,
  styleUrl: './pages.scss',
})
export class HomePage implements OnInit {
  i = inject(I18nService);
  api = inject(ItemsApi);
  cdr = inject(ChangeDetectorRef);
  query = '';
  items: Item[] = [];
  categories: any[] = [];
  statistics = { lost: 0, found: 0, returned: 0 };
  loading = true;
  error = false;
  ngOnInit() {
    this.api.categories().subscribe({ next: (x) => {this.categories = x;this.cdr.detectChanges()}, error: () => {} });
    this.api.statistics().subscribe({ next: (x) => {this.statistics = x;this.cdr.detectChanges()}, error: () => {} });
    this.load();
  }
  load() {
    this.loading = true;
    this.error = false;
    this.api.search({ pageSize: '6' }).subscribe({
      next: (x) => {
        this.items = x.items;
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
  icon(slug: string) {
    return (
      (
        {
          electronics: 'smartphone',
          bags: 'briefcase-business',
          keys: 'key',
          documents: 'file-text',
          animals: 'heart',
          people: 'user',
          wallets: 'briefcase-business',
        } as Record<string, string>
      )[slug] || 'grid-2x2'
    );
  }
}
@Component({
  standalone: true,
  selector: 'app-search',
  imports: [CommonModule, FormsModule, ItemGrid],
  template: `<section class="page-head">
      <span class="eyebrow">{{ i.t('discover') }}</span>
      <h1>{{ i.t('explore') }}</h1>
      <div class="search">
        <img src="icons/search.svg" /><input [(ngModel)]="q" [placeholder]="i.t('search')" /><button
          (click)="apply()"
        >
          <img src="icons/sliders-horizontal.svg" />
        </button>
      </div>
    </section>
    <div class="toolbar">
      <div class="pills">
        <button [class.active]="!type" (click)="type = ''; apply()">{{ i.t('all') }}</button
        ><button [class.active]="type === 'Lost'" (click)="type = 'Lost'; apply()">
          {{ i.t('lost') }}</button
        ><button [class.active]="type === 'Found'" (click)="type = 'Found'; apply()">
          {{ i.t('found') }}
        </button>
      </div>
      <select [(ngModel)]="sort" (change)="apply()">
        <option value="newest">{{ i.t('newest') }}</option>
        <option value="oldest">{{ i.t('oldest') }}</option>
        <option value="title">A–Z</option>
      </select>
    </div>
    <div class="results">
      <aside>
        <h3>{{ i.t('filters') }}</h3>
        <label
          >{{ i.t('category')
          }}<select [(ngModel)]="categoryId" (change)="subcategoryId = ''">
            <option value="">{{ i.t('all') }}</option>
            <option *ngFor="let c of categories" [value]="c.id">{{ i.t(c.nameKey) }}</option>
          </select></label
        ><label
          >{{ i.t('subcategory')
          }}<select [(ngModel)]="subcategoryId">
            <option value="">{{ i.t('all') }}</option>
            <option *ngFor="let s of subcategories" [value]="s.id">{{ i.t(s.nameKey) }}</option>
          </select></label
        ><label>{{ i.t('location') }}<input [(ngModel)]="location" /></label
        ><label
          >{{ i.t('radius')
          }}<input type="number" min="1" max="500" [(ngModel)]="radiusKm" /></label
        ><button class="clear" type="button" (click)="useCurrentLocation()">{{ i.t('useCurrentLocation') }}</button
        ><label>{{ i.t('from') }}<input type="date" [(ngModel)]="from" /></label
        ><label>{{ i.t('to') }}<input type="date" [(ngModel)]="to" /></label
        ><label>{{ i.t('color') }}<input [(ngModel)]="color" /></label
        ><label>{{ i.t('brand') }}<input [(ngModel)]="brand" /></label
        ><label class="check-filter"
          ><input type="checkbox" [(ngModel)]="hasReward" />{{ i.t('hasReward') }}</label
        ><button class="primary" (click)="apply()">{{ i.t('apply') }}</button
        ><button class="clear" (click)="clear()">{{ i.t('clearFilters') }}</button>
      </aside>
      <div>
        <div class="view-switch">
          <button [class.active]="view === 'grid'" (click)="view = 'grid'" aria-label="Grid">
            <img src="icons/grid-2x2.svg" alt="" /></button
          ><button [class.active]="view === 'list'" (click)="view = 'list'" aria-label="List">
            <img src="icons/list.svg" alt="" />
          </button>
        </div>
        <p *ngIf="loading">{{ i.t('loading') }}</p>
        <div class="error-state" *ngIf="error">
          <p>{{ i.t('loadFailed') }}</p>
          <button (click)="load()">{{ i.t('retry') }}</button>
        </div>
        <div class="empty-state" *ngIf="!loading && !error && !items.length">
          <h3>{{ i.t('noResults') }}</h3>
          <button (click)="clear()">{{ i.t('clearFilters') }}</button>
        </div>
        <div [class.list-view]="view === 'list'">
          <item-grid *ngIf="!loading && !error" [items]="items" />
        </div>
        <div class="pagination" *ngIf="total > pageSize">
          <button [disabled]="page === 1" (click)="go(page - 1)">←</button
          ><span>{{ page }} / {{ pages }}</span
          ><button [disabled]="page === pages" (click)="go(page + 1)">→</button>
        </div>
      </div>
    </div>`,
  styleUrl: './pages.scss',
})
export class SearchPage implements OnInit {
  i = inject(I18nService);
  api = inject(ItemsApi);
  route = inject(ActivatedRoute);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  items: Item[] = [];
  q = '';
  type = '';
  sort = 'newest';
  location = '';
  color = '';
  brand = '';
  categoryId = '';
  subcategoryId = '';
  radiusKm: any = '';
  latitude = '';
  longitude = '';
  from = '';
  to = '';
  hasReward = false;
  categories: any[] = [];
  page = 1;
  pageSize = 12;
  total = 0;
  loading = true;
  error = false;
  view: 'grid' | 'list' = 'grid';
  get subcategories() {
    return this.categories.find((x) => x.id === this.categoryId)?.subcategories || [];
  }
  get pages() {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }
  ngOnInit() {
    const p = this.route.snapshot.queryParamMap;
    for (const key of [
      'q',
      'type',
      'sort',
      'location',
      'color',
      'brand',
      'categoryId',
      'subcategoryId',
      'latitude',
      'longitude',
      'from',
      'to',
    ] as const)
      (this as any)[key] = p.get(key) || (this as any)[key];
    this.radiusKm = p.get('radiusKm') || '';
    this.hasReward = p.get('hasReward') === 'true';
    this.page = Number(p.get('page') || 1);
    this.api.categories().subscribe((x) => {this.categories = x;this.cdr.detectChanges()});
    this.load();
  }
  params() {
    return {
      q: this.q,
      type: this.type,
      sort: this.sort,
      location: this.location,
      color: this.color,
      brand: this.brand,
      categoryId: this.categoryId,
      subcategoryId: this.subcategoryId,
      radiusKm: String(this.radiusKm || ''),
      latitude: this.latitude,
      longitude: this.longitude,
      from: this.from,
      to: this.to,
      hasReward: this.hasReward ? 'true' : '',
      page: String(this.page),
      pageSize: String(this.pageSize),
    };
  }
  apply() {
    this.page = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.params(),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.load();
  }
  clear() {
    this.q =
      this.type =
      this.location =
      this.color =
      this.brand =
      this.categoryId =
      this.subcategoryId =
      this.from =
      this.to =
        '';
    this.radiusKm = '';
    this.latitude = this.longitude = '';
    this.hasReward = false;
    this.sort = 'newest';
    this.apply();
  }
  go(page: number) {
    this.page = page;
    this.applyPage();
  }
  applyPage() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.params(),
      replaceUrl: true,
    });
    this.load();
  }
  useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({coords}) => {
      this.latitude = String(coords.latitude);
      this.longitude = String(coords.longitude);
      if (!this.radiusKm) this.radiusKm = 10;
      this.apply();
    });
  }
  load() {
    this.loading = true;
    this.error = false;
    this.api.search(this.params()).subscribe({
      next: (x) => {
        this.items = x.items;
        this.total = x.totalCount;
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
  selector: 'app-details',
  imports: [CommonModule, RouterLink, ItemGrid],
  template: `<a class="back" routerLink="/explore"
      ><img src="icons/chevron-left.svg" />{{ i.t('back') }}</a
    >
    <article *ngIf="item" class="detail">
      <div class="gallery">
        <div
          class="main-photo"
          [style.backgroundImage]="
            item.photos[selected] ? 'url(' + item.photos[selected].url + ')' : ''
          "
        ></div>
        <div class="thumbs">
          <button
            *ngFor="let photo of item.photos; index as n"
            (click)="selected = n"
            [class.active]="selected === n"
          >
            <img [src]="photo.url" [alt]="item.title" />
          </button>
        </div>
      </div>
      <div class="detail-copy">
        <div class="meta">
          <span class="badge">{{ item.type === 1 ? i.t('found') : i.t('lost') }}</span
          ><span><img src="icons/eye.svg" />{{ item.viewCount }}</span>
        </div>
        <h1>{{ item.title }}</h1>
        <p class="place"><img src="icons/map-pin.svg" />{{ item.location }}</p>
        <p>{{ item.description }}</p>
        <p>
          <b>{{ i.t('date') }}:</b> {{ item.occurredAtUtc | date: 'medium' }}
        </p>
        <div class="facts">
          <div>
            <small>{{ i.t('brand') }}</small
            ><b>{{ item.brand || '—' }}</b>
          </div>
          <div>
            <small>{{ i.t('color') }}</small
            ><b>{{ item.color || '—' }}</b>
          </div>
        </div>
        <div class="facts" *ngIf="item.attributes">
          <div *ngFor="let fact of item.attributes | keyvalue">
            <small>{{ i.t(fact.key) }}</small
            ><b>{{ fact.value }}</b>
          </div>
        </div>
        <a
          class="map-link"
          *ngIf="item.latitude && item.longitude"
          target="_blank"
          rel="noopener"
          [href]="
            'https://www.openstreetmap.org/?mlat=' + item.latitude + '&mlon=' + item.longitude
          "
          >{{ i.t('viewMap') }}</a
        >
        <div *ngIf="item.rewardAmount" class="reward">
          <span>{{ i.t('reward') }}</span
          ><b>{{ item.rewardAmount }} ₾</b>
        </div>
        <section class="poster" *ngIf="poster">
          <img *ngIf="poster.photoUrl" [src]="poster.photoUrl" [alt]="poster.displayName" />
          <div><b>{{poster.displayName}}</b><p>{{poster.rating||0}} ★ ({{poster.ratingCount}}) · {{poster.successfulReturns}} {{i.t('successfulReturns')}}</p>
          <small>{{i.t(poster.contactSharingEnabled?'contactEnabled':'contactPrivate')}}</small></div>
        </section>
        <div class="detail-actions">
          <button (click)="message()">
            <img src="icons/message-circle.svg" />{{ i.t('message') }}</button
          ><a class="primary button" [routerLink]="['/items', item.id, 'claim']"
            ><img src="icons/shield-check.svg" />{{ i.t('claim') }}</a
          >
        </div>
        <div class="secondary-actions">
          <button (click)="favorite()">
            <img src="icons/heart.svg" alt="" />{{
              i.t(item.isFavorite ? 'unfavorite' : 'favorites')
            }}</button
          ><button (click)="share()">
            <img src="icons/share-2.svg" alt="" />{{ i.t('share') }}</button
          ><a target="_blank" rel="noopener" [href]="facebookUrl()">Facebook</a
          ><a [routerLink]="'/report'" [queryParams]="{ itemId: item.id }">{{ i.t('report') }}</a
          ><a *ngIf="owner" [routerLink]="['/items', item.id, 'edit']">{{ i.t('edit') }}</a
          ><button *ngIf="owner" (click)="remove()">{{ i.t('delete') }}</button>
        </div>
      </div>
    </article>
    <section class="similar" *ngIf="similar.length"><div class="section-title"><h2>{{i.t('similarItems')}}</h2><a routerLink="/explore">{{i.t('seeAll')}}</a></div><item-grid [items]="similar" /></section>`,
  styleUrl: './pages.scss',
})
export class DetailsPage implements OnInit {
  i = inject(I18nService);
  api = inject(ItemsApi);
  route = inject(ActivatedRoute);
  router = inject(Router);
  auth = inject(AuthService);
  communication = inject(CommunicationApi);
  cdr = inject(ChangeDetectorRef);
  item?: Item;
  poster?:any;
  similar:Item[]=[];
  selected = 0;
  get owner() {
    return !!this.item?.canManage;
  }
  ngOnInit() {
    const id=this.route.snapshot.paramMap.get('id')!;
    this.api.get(id).subscribe((x) => {this.item = x;this.api.search({categoryId:x.categoryId,pageSize:'5'}).subscribe(p=>{this.similar=p.items.filter(i=>i.id!==id).slice(0,4);this.cdr.detectChanges()});this.cdr.detectChanges()});
    this.api.poster(id).subscribe((x)=>{this.poster=x;this.cdr.detectChanges()});
  }
  favorite() {
    if (!this.item) return;
    if (!this.auth.authenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const request = this.item.isFavorite
      ? this.api.unfavorite(this.item.id)
      : this.api.favorite(this.item.id);
    request.subscribe(() => {this.item!.isFavorite = !this.item!.isFavorite;this.cdr.detectChanges()});
  }
  message() {
    if (!this.item) return;
    if (!this.auth.authenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.communication
      .createConversation(this.item.id)
      .subscribe({ next: (x) => this.router.navigate(['/messages', x.id]) });
  }
  share() {
    if (!this.item) return;
    const data = { title: this.item.title, text: this.item.description, url: location.href };
    if (navigator.share) navigator.share(data);
    else navigator.clipboard.writeText(location.href);
  }
  facebookUrl(){return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`;}
  remove() {
    if (this.item && confirm(this.i.t('deleteConfirm')))
      this.api.remove(this.item.id).subscribe(() => this.router.navigateByUrl('/my-listings'));
  }
}
@Component({
  standalone: true,
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  template: `<section class="form-page">
    <div class="form-intro">
      <span class="eyebrow">FOUNDLY</span>
      <h1>{{ i.t('create') }}</h1>
      <p>{{ i.t('formHelp') }}</p>
    </div>
    <form (ngSubmit)="submit()">
      <div class="segmented">
        <button type="button" [class.active]="model.type === 1" (click)="model.type = 1">
          {{ i.t('found') }}</button
        ><button type="button" [class.active]="model.type === 0" (click)="model.type = 0">
          {{ i.t('lost') }}
        </button>
      </div>
      <label
        >{{ i.t('photos') }}<small>{{ i.t('upTo8') }}</small>
        <input
          class="file-input"
          id="item-photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          capture="environment"
          (change)="choose($event)"
        /><label class="uploader" for="item-photos">
          <img src="icons/upload.svg" /><span>{{ i.t('upload') }}</span>
        </label>
        <div class="photo-previews">
          <div *ngFor="let photo of existingPhotos">
            <img [src]="photo.url" [alt]="model.title" /><button type="button" (click)="removeExistingPhoto(photo)" [attr.aria-label]="i.t('remove')">×</button>
          </div>
          <div *ngFor="let preview of previews; index as n">
            <img [src]="preview" alt="" /><button
              type="button"
              (click)="removePhoto(n)"
              [attr.aria-label]="i.t('remove')"
            >
              ×
            </button>
          </div>
        </div></label
      >
      <div class="two">
        <label
          >{{ i.t('category')
          }}<select [(ngModel)]="model.categoryId" name="category" required (change)="categoryChanged()">
            <option *ngFor="let category of categories" [value]="category.id">
              {{ i.t(category.nameKey) }}
            </option>
          </select></label
        ><label>{{ i.t('title') }}<input [(ngModel)]="model.title" name="title" required /></label>
      </div>
      <div class="two">
        <label
          >{{ i.t('subcategory')
          }}<select [(ngModel)]="model.subcategoryId" name="subcategory">
            <option [ngValue]="null">{{ i.t('all') }}</option>
            <option *ngFor="let sub of selectedSubcategories" [value]="sub.id">
              {{ i.t(sub.nameKey) }}
            </option>
          </select></label
        ><label
          >{{ i.t('date')
          }}<input type="datetime-local" [(ngModel)]="model.occurredAtUtc" name="occurred" required
        /></label>
      </div>
      <label
        >{{ i.t('description')
        }}<textarea [(ngModel)]="model.description" name="description" rows="5"></textarea>
      </label>
      <div class="two">
        <label>{{ i.t('color') }}<input [(ngModel)]="model.color" name="color" /></label
        ><label>{{ i.t('brand') }}<input [(ngModel)]="model.brand" name="brand" /></label>
      </div>
      <div class="two" *ngIf="attributeFields.length">
        <label *ngFor="let field of attributeFields">{{ i.t(field.label) }}
          <input [(ngModel)]="model.attributes[field.key]" [name]="'attribute-'+field.key" />
        </label>
      </div>
      <label>{{ i.t('location') }}<input [(ngModel)]="model.location" name="location" required /></label>
      <button class="clear" type="button" (click)="setCurrentLocation()">{{ i.t('useCurrentLocation') }}</button
      ><label
        >{{ i.t('reward')
        }}<input [(ngModel)]="model.rewardAmount" name="reward" type="number" min="0"
      /></label>
      <fieldset class="questions">
        <legend>{{ i.t('verificationQuestions') }}</legend>
        <p>{{ i.t('questionPrivacy') }}</p>
        <label *ngFor="let question of model.verificationQuestions; index as n"
          >{{ i.t('question') }} {{ n + 1 }}
          <div>
            <input
              [(ngModel)]="model.verificationQuestions[n]"
              [name]="'question' + n"
              maxlength="300"
            /><button type="button" (click)="removeQuestion(n)">×</button>
          </div></label
        ><button
          type="button"
          (click)="addQuestion()"
          [disabled]="model.verificationQuestions.length >= 5"
        >
          + {{ i.t('addQuestion') }}
        </button>
      </fieldset>
      <p class="error" *ngIf="error" role="alert">{{ error }}</p>
      <button class="publish" type="submit" [disabled]="busy">
        <img src="icons/upload.svg" />{{ busy ? i.t('loading') : i.t('publish') }}
      </button>
      <p *ngIf="saved">{{ i.t('saved') }}</p>
    </form>
  </section>`,
  styleUrl: './pages.scss',
})
export class EditorPage implements OnInit {
  i = inject(I18nService);
  api = inject(ItemsApi);
  route = inject(ActivatedRoute);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  saved = false;
  busy = false;
  error = '';
  categories: any[] = [];
  files: File[] = [];
  previews: string[] = [];
  existingPhotos:{id:string;url:string;sortOrder:number}[]=[];
  editId = '';
  model: any = {
    type: 1,
    title: '',
    description: '',
    categoryId: '33333333-3333-3333-3333-333333333333',
    location: '',
    occurredAtUtc: new Date().toISOString(),
    attributes: {},
    verificationQuestions: [''],
  };
  get selectedSubcategories() {
    return this.categories.find((c) => c.id === this.model.categoryId)?.subcategories || [];
  }
  attributeFields:{key:string,label:string}[]=[];
  categoryChanged() {
    const slug=this.categories.find(c=>c.id===this.model.categoryId)?.slug;
    const fields:Record<string,{key:string,label:string}[]>={
      electronics:[{key:'model',label:'model'}],bags:[{key:'material',label:'material'}],
      keys:[{key:'keyType',label:'keyType'}],documents:[{key:'documentType',label:'documentType'}],
      animals:[{key:'breed',label:'breed'}],people:[{key:'identifyingFeature',label:'identifyingFeature'}],
      wallets:[{key:'material',label:'material'}],other:[{key:'distinctiveFeature',label:'distinctiveFeature'}]
    };
    this.attributeFields=fields[slug]||[];
  }
  addQuestion() {
    this.model.verificationQuestions.push('');
  }
  removeQuestion(n: number) {
    this.model.verificationQuestions.splice(n, 1);
  }
  ngOnInit() {
    this.editId = this.route.snapshot.paramMap.get('id') || '';
    this.model.type = this.route.snapshot.queryParamMap.get('type') === 'lost' ? 0 : 1;
    this.api.categories().subscribe((x) => {
      this.categories = x;
      if (x.length && !this.categories.some((c) => c.id === this.model.categoryId))
        this.model.categoryId = x[0].id;
      this.categoryChanged();
      this.cdr.detectChanges();
    });
    if (this.editId)
      this.api
        .get(this.editId)
        .subscribe(
          (x) => {
            this.model = {
              ...x,
              status: x.status,
              verificationQuestions: [],
              attributes: x.attributes,
            };
            this.existingPhotos=x.photos;
            this.categoryChanged();
            this.cdr.detectChanges();
          },
        );
  }
  choose(event: Event) {
    const selected = Array.from((event.target as HTMLInputElement).files || []).slice(
      0,
      8 - this.files.length - this.existingPhotos.length,
    );
    this.files.push(...selected);
    this.previews.push(...selected.map((f) => URL.createObjectURL(f)));
  }
  removePhoto(n: number) {
    URL.revokeObjectURL(this.previews[n]);
    this.previews.splice(n, 1);
    this.files.splice(n, 1);
  }
  removeExistingPhoto(photo:{id:string}) {
    if(!this.editId)return;
    this.api.removePhoto(this.editId,photo.id).subscribe({next:()=>{this.existingPhotos=this.existingPhotos.filter(x=>x.id!==photo.id);this.cdr.detectChanges()},error:()=>{this.error=this.i.t('photoUploadFailed');this.cdr.detectChanges()}});
  }
  setCurrentLocation() {
    navigator.geolocation?.getCurrentPosition(({coords})=>{
      this.model.latitude=coords.latitude;
      this.model.longitude=coords.longitude;
      this.cdr.detectChanges();
    });
  }
  submit() {
    if (this.busy) return;
    const payload = {
      ...this.model,
      occurredAtUtc: new Date(this.model.occurredAtUtc).toISOString(),
      verificationQuestions: (this.model.verificationQuestions || []).filter((x: string) => x.trim()),
    };
    this.busy = true;
    this.error = '';
    const request = this.editId
      ? this.api.update(this.editId, payload)
      : this.api.create(payload);
    request.subscribe({
      next: (item) => {
        if (!this.files.length) {
          this.router.navigate(['/items', item.id]);
          return;
        }
        let remaining = this.files.length;
        this.files.forEach((file) =>
          this.api.upload(item.id, file).subscribe({
            next: () => {
              remaining--;
              if (!remaining) this.router.navigate(['/items', item.id]);
            },
            error: () => {
              this.error = this.i.t('photoUploadFailed');
              this.busy = false;
              this.cdr.detectChanges();
            },
          }),
        );
      },
      error: () => {
        this.error = this.i.t('publishFailed');
        this.busy = false;
        this.cdr.detectChanges();
      },
    });
  }
}
