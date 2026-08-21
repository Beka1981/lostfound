import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../core/i18n.service';
import { ClaimDetail, ClaimSummary, Exchange, OwnershipApi, QrTag } from '../core/ownership.api';
const states = ['pending', 'underReview', 'accepted', 'rejected', 'cancelled', 'completed'];
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="ownership">
    <a class="back" [routerLink]="['/items', itemId]"
      ><img src="icons/chevron-left.svg" />{{ i.t('back') }}</a
    >
    <div class="panel">
      <span class="eyebrow">{{ i.t('ownershipCheck') }}</span>
      <h1>{{ i.t('submitClaim') }}</h1>
      <p>{{ i.t('claimPrivacy') }}</p>
      <form (ngSubmit)="submit()">
        <label *ngFor="let q of questions; let n = index"
          ><b>{{ n + 1 }}. {{ q.prompt }}</b
          ><textarea
            required
            maxlength="1000"
            [(ngModel)]="answers[q.id]"
            [name]="q.id"
            rows="3"
          ></textarea></label
        ><button class="primary" [disabled]="busy">
          {{ busy ? i.t('loading') : i.t('submitClaim') }}
        </button>
        <p class="success" *ngIf="done">{{ i.t('claimSubmitted') }}</p>
        <p class="error" *ngIf="error">{{ i.t('retry') }}</p>
      </form>
    </div>
  </section>`,
  styleUrl: './ownership.scss',
})
export class SubmitClaimPage implements OnInit {
  i = inject(I18nService);
  api = inject(OwnershipApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  itemId = this.route.snapshot.paramMap.get('id')!;
  questions: any[] = [];
  answers: Record<string, string> = {};
  busy = false;
  done = false;
  error = false;
  ngOnInit() {
    this.api
      .questions(this.itemId)
      .subscribe({ next: (x) => {this.questions = x;this.cdr.detectChanges()}, error: () => {this.error = true;this.cdr.detectChanges()} });
  }
  submit() {
    this.busy = true;
    this.api
      .createClaim(
        this.itemId,
        this.questions.map((q) => ({ questionId: q.id, answer: this.answers[q.id] })),
      )
      .subscribe({
        next: () => {
          this.done = true;
          this.busy = false;
          this.answers = {};
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = true;
          this.busy = false;
          this.cdr.detectChanges();
        },
      });
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<section class="ownership">
    <div class="page-head">
      <span class="eyebrow">FOUNDLY</span>
      <h1>{{ i.t(received ? 'claimsReceived' : 'myClaims') }}</h1>
      <div class="pills">
        <a routerLink="/claims">{{ i.t('myClaims') }}</a
        ><a routerLink="/claims/received">{{ i.t('claimsReceived') }}</a>
      </div>
    </div>
    <div *ngIf="loading" class="panel">{{ i.t('loading') }}</div>
    <div *ngIf="!loading && !claims.length" class="panel empty">
      <img src="icons/shield-check.svg" />
      <h2>{{ i.t('emptyClaims') }}</h2>
    </div>
    <a class="claim-row" *ngFor="let c of claims" [routerLink]="['/claims', c.id]"
      ><div>
        <b>{{ c.itemTitle }}</b
        ><span>{{ c.createdAtUtc | date: 'medium' }}</span>
      </div>
      <span class="status s{{ c.status }}">{{ i.t(states[c.status]) }}</span></a
    >
  </section>`,
  styleUrl: './ownership.scss',
})
export class ClaimsPage implements OnInit {
  i = inject(I18nService);
  api = inject(OwnershipApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  claims: ClaimSummary[] = [];
  loading = true;
  states = states;
  received = this.route.snapshot.data['received'] === true;
  ngOnInit() {
    this.api.claims(this.received).subscribe({
      next: (x) => {
        this.claims = x.items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {this.loading = false;this.cdr.detectChanges()},
    });
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<section class="ownership" *ngIf="claim">
    <a class="back" routerLink="/claims">{{ i.t('back') }}</a>
    <div class="panel">
      <div class="timeline">
        <span *ngFor="let s of states; let n = index" [class.on]="n <= claim.status">{{
          i.t(s)
        }}</span>
      </div>
      <h1>{{ claim.itemTitle }}</h1>
      <div class="answer" *ngFor="let a of claim.answers">
        <b>{{ a.question }}</b>
        <p>{{ a.answer }}</p>
      </div>
      <div class="actions" *ngIf="claim.status < 2">
        <button (click)="review(false)">{{ i.t('reject') }}</button
        ><button class="primary" (click)="review(true)">{{ i.t('accept') }}</button
        ><button (click)="cancel()">{{ i.t('cancel') }}</button>
      </div>
      <a
        class="primary button"
        *ngIf="claim.exchangeId"
        [routerLink]="['/exchanges', claim.exchangeId]"
        >{{ i.t('continueHandover') }}</a
      >
    </div>
  </section>`,
  styleUrl: './ownership.scss',
})
export class ClaimDetailsPage implements OnInit {
  i = inject(I18nService);
  api = inject(OwnershipApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  claim?: ClaimDetail;
  states = states;
  ngOnInit() {
    this.load();
  }
  load() {
    this.api.claim(this.route.snapshot.paramMap.get('id')!).subscribe((x) => {this.claim = x;this.cdr.detectChanges()});
  }
  review(accept: boolean) {
    this.api.review(this.claim!.id, accept).subscribe(() => this.load());
  }
  cancel() {
    this.api.cancel(this.claim!.id).subscribe(() => this.load());
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="ownership">
    <div class="page-head">
      <span class="eyebrow">{{ i.t('secureReturn') }}</span>
      <h1>{{ i.t('exchanges') }}</h1>
    </div>
    <a *ngFor="let x of exchanges" class="claim-row" [routerLink]="['/exchanges', x.id]"
      ><b>{{ i.t('exchange') }}</b
      ><span class="status">{{ i.t(exchangeStates[x.status]) }}</span></a
    >
    <div class="panel" *ngIf="exchange">
      <div class="code-box" *ngIf="shownCode">
        <small>{{ i.t('oneTimeCode') }}</small
        ><strong>{{ shownCode }}</strong>
        <p>{{ i.t('codeWarning') }}</p>
      </div>
      <button class="primary" *ngIf="exchange.canGenerateCode" (click)="generate()">
        {{ i.t('generateCode') }}
      </button>
      <form *ngIf="exchange.canEnterCode" (ngSubmit)="verify()">
        <label
          >{{ i.t('enterCode')
          }}<input
            name="code"
            inputmode="numeric"
            pattern="[0-9]{6}"
            maxlength="6"
            autocomplete="one-time-code"
            [(ngModel)]="code"
        /></label>
        <p *ngIf="exchange.expiresAtUtc">
          {{ i.t('expires') }}: {{ exchange.expiresAtUtc | date: 'mediumTime' }}
        </p>
        <button class="primary">{{ i.t('confirmReturn') }}</button>
      </form>
      <div class="success" *ngIf="exchange.status === 2">
        <img src="icons/shield-check.svg" />
        <h2>{{ i.t('returnCompleted') }}</h2>
        <p>{{ i.t('ratingReady') }}</p>
        <a
          class="primary button"
          *ngIf="exchange.canRate"
          [routerLink]="['/ratings']"
          [queryParams]="{ exchangeId: exchange.id }"
          >{{ i.t('ratings') }}</a
        >
      </div>
      <p class="error" *ngIf="error">{{error}}</p>
    </div>
  </section>`,
  styleUrl: './ownership.scss',
})
export class ExchangesPage implements OnInit {
  i = inject(I18nService);
  api = inject(OwnershipApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  exchanges: Exchange[] = [];
  exchange?: Exchange;
  shownCode = '';
  code = '';
  error='';
  exchangeStates = ['exchangePending', 'ready', 'completed', 'expired', 'cancelled'];
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.api.exchange(id).subscribe((x) => {this.exchange = x;this.cdr.detectChanges()});
    else this.api.exchanges().subscribe((x) => {this.exchanges = x;this.cdr.detectChanges()});
  }
  generate() {
    this.api.code(this.exchange!.id).subscribe((x) => {
      this.shownCode = x.code;
      this.exchange!.expiresAtUtc = x.expiresAtUtc;
      this.error='';this.cdr.detectChanges();
    },e=>{this.error=e.error?.title||this.i.t('retry');this.cdr.detectChanges()});
  }
  verify() {
    this.api.verify(this.exchange!.id, this.code).subscribe((x) => {
      this.exchange = x;
      this.code = '';
      this.error='';this.cdr.detectChanges();
    },e=>{this.error=e.error?.title||this.i.t('retry');this.cdr.detectChanges()});
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<section class="ownership">
    <div class="page-head">
      <span class="eyebrow">{{ i.t('protectedPossessions') }}</span>
      <h1>{{ i.t('qrTags') }}</h1>
    </div>
    <div class="split">
      <form class="panel" (ngSubmit)="create()">
        <h2>{{ i.t('createQr') }}</h2>
        <label
          >{{ i.t('safeLabel')
          }}<input required maxlength="120" name="label" [(ngModel)]="label" /></label
        ><label
          >{{ i.t('description')
          }}<textarea
            maxlength="500"
            name="description"
            [(ngModel)]="description"
          ></textarea></label
        ><button class="primary">{{ i.t('createQr') }}</button>
        <div class="code-box" *ngIf="token">
          <small>{{ i.t('saveQrNow') }}</small>
          <img *ngIf="qrImageUrl" class="rendered-qr" [src]="qrImageUrl" [alt]="i.t('qrTags')" />
          <p class="qr-url">{{ publicUrl }}</p>
          <div class="actions">
            <button type="button" (click)="download('svg')">SVG</button>
            <button type="button" (click)="download('png')">PNG</button>
            <button type="button" (click)="print()">{{ i.t('print') }}</button>
          </div>
        </div>
      </form>
      <div>
        <article class="claim-row" *ngFor="let q of tags">
          <div>
            <b>{{ q.label }}</b
            ><span>{{ q.scanCount }} {{ i.t('scans') }}</span>
          </div>
          <div class="actions">
            <button (click)="state(q)">{{ i.t(q.isActive ? 'deactivate' : 'activate') }}</button
            ><button (click)="rotate(q)">{{ i.t('rotate') }}</button
            ><button (click)="revoke(q)">{{ i.t('revoke') }}</button>
            <button (click)="showScans(q)">{{ i.t('scanHistory') }}</button>
          </div>
        </article>
        <div class="panel" *ngIf="history">
          <h2>{{ i.t('scanHistory') }}</h2>
          <p *ngIf="!history.length">{{ i.t('noScans') }}</p>
          <div class="claim-row" *ngFor="let scan of history">
            <span>{{ scan.createdAtUtc | date: 'medium' }}</span
            ><span>{{ scan.coarseLocation || '—' }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>`,
  styleUrl: './ownership.scss',
})
export class QrTagsPage implements OnInit {
  i = inject(I18nService);
  api = inject(OwnershipApi);
  cdr=inject(ChangeDetectorRef);
  tags: QrTag[] = [];
  label = '';
  description = '';
  token = '';
  publicUrl = '';
  currentId = '';
  qrImageUrl = '';
  history: any[] | null = null;
  ngOnInit() {
    this.load();
  }
  load() {
    this.api.qrTags().subscribe((x) => {this.tags = x;this.cdr.detectChanges()});
  }
  create() {
    this.api.createQr({ label: this.label, description: this.description }).subscribe((x) => {
      this.token = x.token;
      this.publicUrl = x.publicUrl;
      this.currentId = x.id;
      this.preview();
      this.label = '';
      this.description = '';
      this.load();
    });
  }
  state(q: QrTag) {
    this.api.qrState(q.id, !q.isActive).subscribe(() => this.load());
  }
  rotate(q: QrTag) {
    this.api.rotate(q.id).subscribe((x) => {
      this.token = x.token;
      this.publicUrl = x.publicUrl;
      this.currentId = q.id;
      this.preview();
      this.load();
    });
  }
  revoke(q: QrTag) {
    this.api.revoke(q.id).subscribe(() => this.load());
  }
  showScans(q: QrTag) {
    this.api.scans(q.id).subscribe((x) => {this.history = x;this.cdr.detectChanges()});
  }
  preview() {
    this.api.renderQr(this.currentId, this.token, 'svg').subscribe((blob) => {
      if (this.qrImageUrl) URL.revokeObjectURL(this.qrImageUrl);
      this.qrImageUrl = URL.createObjectURL(blob);
      this.cdr.detectChanges();
    });
  }
  download(format: 'svg' | 'png') {
    this.api.renderQr(this.currentId, this.token, format).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `foundly-qr.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }
  print() {
    window.print();
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<section class="ownership public-scan">
    <div class="panel" *ngIf="tag">
      <img class="qr-mark" src="icons/qr-code.svg" /><span class="eyebrow">FOUNDLY</span>
      <h1>{{ tag.label }}</h1>
      <p>{{ tag.description }}</p>
      <form (ngSubmit)="send()">
        <label
          >{{ i.t('finderMessage')
          }}<textarea
            required
            maxlength="1000"
            name="message"
            [(ngModel)]="message"
          ></textarea></label
        ><label
          >{{ i.t('coarseLocation')
          }}<input maxlength="120" name="location" [(ngModel)]="location" /></label
        ><button class="primary">{{ i.t('contactOwner') }}</button>
        <p class="success" *ngIf="sent">{{ i.t('contactSent') }}</p>
      </form>
    </div>
    <div class="panel" *ngIf="unavailable">
      <h1>{{ i.t('qrUnavailable') }}</h1>
    </div>
  </section>`,
  styleUrl: './ownership.scss',
})
export class PublicQrPage implements OnInit {
  i = inject(I18nService);
  api = inject(OwnershipApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  tag?: any;
  message = '';
  location = '';
  sent = false;
  unavailable = false;
  token = this.route.snapshot.paramMap.get('token')!;
  ngOnInit() {
    this.api
      .publicQr(this.token)
      .subscribe({ next: (x) => {this.tag = x;this.cdr.detectChanges()}, error: () => {this.unavailable = true;this.cdr.detectChanges()} });
  }
  send() {
    this.api.contact(this.token, this.message, this.location).subscribe(() => {
      this.sent = true;
      this.message = '';
      this.location = '';
      this.cdr.detectChanges();
    });
  }
}
