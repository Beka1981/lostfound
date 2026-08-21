import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../core/i18n.service';
import { MatchSummary, Phase5Api } from '../core/phase5.api';
import { AuthService } from '../core/auth.service';
const publicExplanationKeys = new Set([
  'category',
  'subcategory',
  'title',
  'description',
  'brand',
  'color',
  'locationName',
  'date',
  'distance',
  'attributes',
]);
export function safeMatchExplanation(value: unknown): any[] {
  return Array.isArray(value)
    ? value.filter(
        (x) => x && typeof x === 'object' && publicExplanationKeys.has(String((x as any).key)),
      )
    : [];
}
@Component({
  standalone: true,
  selector: 'app-matches',
  imports: [CommonModule, RouterLink],
  template: `<section class="phase5">
    <header>
      <span class="eyebrow">{{ i.t('recommendations') }}</span>
      <h1>{{ i.t('myMatches') }}</h1>
      <p>{{ i.t('matchDisclaimer') }}</p>
    </header>
    <p *ngIf="loading">{{ i.t('loading') }}</p>
    <button *ngIf="error" (click)="load()">{{ i.t('retry') }}</button>
    <div class="empty" *ngIf="!loading && !items.length">{{ i.t('emptyMatches') }}</div>
    <a class="match-card" *ngFor="let m of items" [routerLink]="['/matches', m.id]"
      ><div class="confidence" [class.high]="m.matchScore >= 82">
        <b>{{ m.matchScore | number: '1.0-0' }}%</b><span>{{ confidence(m.matchScore) }}</span>
      </div>
      <div>
        <small>{{ i.t('possibleMatch') }}</small>
        <h2>{{ m.lostTitle }} ↔ {{ m.foundTitle }}</h2>
        <span>{{ i.t('recommendationOnly') }}</span>
      </div></a
    >
  </section>`,
  styleUrl: './phase5.scss',
})
export class MatchesPage implements OnInit {
  i = inject(I18nService);
  api = inject(Phase5Api);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  items: MatchSummary[] = [];
  loading = true;
  error = false;
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.api.matches(this.route.snapshot.queryParamMap.get('itemId') || undefined).subscribe({
      next: (x) => {
        this.items = x.items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
  confidence(v: number) {
    return this.i.t(v >= 82 ? 'highConfidence' : v >= 65 ? 'strongMatch' : 'possibleMatch');
  }
}
@Component({
  standalone: true,
  selector: 'app-match-detail',
  imports: [CommonModule, RouterLink],
  template: `<section class="phase5" *ngIf="match">
    <a routerLink="/matches">{{ i.t('back') }}</a>
    <header>
      <span class="eyebrow">{{ i.t('matchDetails') }}</span>
      <h1>{{ match.matchScore | number: '1.0-0' }}% {{ i.t('confidence') }}</h1>
      <p>{{ i.t('matchDisclaimer') }}</p>
    </header>
    <div class="explanations">
      <div *ngFor="let p of match.explanation">
        <b>{{ i.t(p.key) }}</b
        ><span>{{ p.score | number: '1.0-1' }} / {{ p.weight }}</span
        ><small *ngIf="p.detail">{{ p.detail }}</small>
      </div>
    </div>
    <div class="actions">
      <a [routerLink]="['/items',match.lostItemId]">{{i.t('viewLostItem')}}</a><a [routerLink]="['/items',match.foundItemId]">{{i.t('viewFoundItem')}}</a>
      <a class="primary button" [routerLink]="['/items',match.foundItemId,'claim']">{{i.t('continueClaim')}}</a>
      <button (click)="act('dismiss')">{{ i.t('dismiss') }}</button
      ><button class="primary" (click)="act('confirm')">{{ i.t('confirmInterest') }}</button>
    </div>
    <p aria-live="polite">{{ message }}</p>
  </section>`,
  styleUrl: './phase5.scss',
})
export class MatchDetailsPage implements OnInit {
  i = inject(I18nService);
  api = inject(Phase5Api);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  match: any;
  message = '';
  ngOnInit() {
    this.api.match(this.route.snapshot.paramMap.get('id')!).subscribe((x) => {
      this.match = { ...x, explanation: safeMatchExplanation(x.explanation) };
      if (x.status < 2) this.api.action(x.id, 'view').subscribe();
      this.cdr.detectChanges();
    });
  }
  act(a: 'dismiss' | 'confirm') {
    this.api.action(this.match.id, a).subscribe(() => {this.message = this.i.t('saved');this.cdr.detectChanges()});
  }
}
@Component({
  standalone: true,
  selector: 'app-moderation',
  imports: [CommonModule, FormsModule],
  template: `<section class="phase5">
    <header>
      <span class="eyebrow">{{ i.t('restrictedArea') }}</span>
      <h1>{{ i.t('moderationDashboard') }}</h1>
    </header>
    <div class="toolbar">
      <button (click)="load()">{{ i.t('retry') }}</button
      ><button (click)="showAudit()">{{ i.t('auditHistory') }}</button>
    </div>
    <p *ngIf="error" role="alert">{{ i.t('moderationDenied') }}</p>
    <div class="report-card" *ngFor="let r of reports">
      <div>
        <b>{{ r.reason }}</b
        ><span>{{ status(r.status) }} · {{ r.severity }}</span>
        <p>{{ r.details }}</p>
      </div>
      <textarea [(ngModel)]="r.note" [attr.aria-label]="i.t('internalNotes')"></textarea>
      <div class="actions">
        <button (click)="move(r, 1)">{{ i.t('startReview') }}</button
        ><button (click)="move(r, 2)">{{ i.t('resolve') }}</button
        ><button (click)="move(r, 3)">{{ i.t('dismiss') }}</button
        ><button (click)="move(r, 4)">{{ i.t('escalate') }}</button>
        <button *ngIf="r.itemId" (click)="item(r,'hide')">{{i.t('hideItem')}}</button><button *ngIf="r.itemId" (click)="item(r,'restore')">{{i.t('restoreItem')}}</button><button *ngIf="r.reportedUserId" (click)="user(r,'warn')">{{i.t('warnUser')}}</button><button *ngIf="r.reportedUserId" (click)="user(r,'suspend')">{{i.t('suspendUser')}}</button><button *ngIf="r.reportedUserId" (click)="user(r,'reactivate')">{{i.t('reactivateUser')}}</button><button *ngIf="r.reportedUserId&&auth.hasRole('Admin')" (click)="user(r,'block')">{{i.t('blockUser')}}</button>
      </div>
    </div>
    <pre *ngIf="audit.length">{{ audit | json }}</pre>
  </section>`,
  styleUrl: './phase5.scss',
})
export class ModerationDashboardPage implements OnInit {
  i = inject(I18nService);
  api = inject(Phase5Api);
  auth=inject(AuthService);
  cdr=inject(ChangeDetectorRef);
  reports: any[] = [];
  audit: any[] = [];
  error = false;
  ngOnInit() {
    this.load();
  }
  load() {
    this.api
      .reports()
      .subscribe({ next: (x) => {this.reports = x.items;this.cdr.detectChanges()}, error: () => {this.error = true;this.cdr.detectChanges()} });
  }
  move(r: any, status: number) {
    this.api.transition(r.id, status, r.note).subscribe(() => this.load());
  }
  showAudit() {
    this.api.audit().subscribe((x) => {this.audit = x;this.cdr.detectChanges()});
  }
  item(r:any,operation:'hide'|'restore'){this.api.moderateItem(r.itemId,operation,'reported',r.note).subscribe(()=>this.load())}
  user(r:any,operation:'warn'|'suspend'|'reactivate'|'block'){this.api.moderateUser(r.reportedUserId,operation,'reported',r.note,operation==='suspend'?new Date(Date.now()+7*86400000).toISOString():undefined).subscribe(()=>this.load())}
  status(v: number) {
    return this.i.t(['open', 'underReview', 'resolved', 'dismissed', 'escalated'][v] || 'open');
  }
}
