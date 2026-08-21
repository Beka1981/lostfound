import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommunicationApi, Conversation, Message, Profile } from '../core/communication.api';
import { I18nService } from '../core/i18n.service';
import { AuthService } from '../core/auth.service';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="panel">
    <h1>{{ i.t('profile') }}</h1>
    <p *ngIf="loading">{{ i.t('loading') }}</p>
    <p class="error" *ngIf="error">{{ i.t('retry') }}</p>
    <form *ngIf="profile" (ngSubmit)="save()">
      <div class="profile-photo">
        <img
          *ngIf="profile.profilePhotoUrl"
          [src]="profile.profilePhotoUrl"
          [alt]="i.t('profilePhoto')"
        />
        <div *ngIf="!profile.profilePhotoUrl" class="avatar">
          {{ (profile.firstName || profile.organizationName || 'U')[0] }}
        </div>
        <label class="file-button"
          >{{ i.t('changePhoto')
          }}<input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="photo($event)" /></label
        ><button *ngIf="profile.profilePhotoUrl" type="button" (click)="removePhoto()">
          {{ i.t('removePhoto') }}
        </button>
      </div>
      <div class="two" *ngIf="profile.accountType === 0">
        <label>{{ i.t('firstName') }}<input [(ngModel)]="profile.firstName" name="first" /></label
        ><label>{{ i.t('lastName') }}<input [(ngModel)]="profile.lastName" name="last" /></label>
      </div>
      <label *ngIf="profile.accountType === 1"
        >{{ i.t('organization') }}<input [(ngModel)]="profile.organizationName" name="org" /></label
      ><label *ngIf="profile.accountType === 1"
        >{{ i.t('responsible')
        }}<input [(ngModel)]="profile.responsiblePerson" name="responsible" /></label
      ><label>{{ i.t('email') }}<input [value]="profile.email" disabled /></label
      ><label>{{ i.t('phone') }}<input [(ngModel)]="profile.phoneNumber" name="phone" /></label
      ><button class="primary">{{ i.t('save') }}</button><a class="public-preview" [routerLink]="['/users',profile.id]">{{i.t('publicPreview')}}</a>
    </form>
  </section>`,
  styleUrl: './communication.scss',
})
export class ProfilePage implements OnInit {
  i = inject(I18nService);
  api = inject(CommunicationApi);
  cdr = inject(ChangeDetectorRef);
  profile?: Profile;
  loading = true;
  error = false;
  ngOnInit() {
    this.api.me().subscribe({
      next: (x) => {
        this.profile = x;
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
  save() {
    if (this.profile) this.api.updateProfile(this.profile).subscribe((x) => {this.profile = x;this.cdr.detectChanges()});
  }
  photo(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.profile)
      this.api.uploadPhoto(file).subscribe((x) => {this.profile!.profilePhotoUrl = x.url;this.cdr.detectChanges()});
  }
  removePhoto() {
    this.api.removePhoto().subscribe(() => {
      if (this.profile) this.profile.profilePhotoUrl = undefined;
      this.cdr.detectChanges();
    });
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<section class="panel">
    <h1>{{ i.t('settings') }}</h1>
    <form *ngIf="profile" (ngSubmit)="save()">
      <label
        >{{ i.t('language')
        }}<select [(ngModel)]="profile.language" name="language">
          <option value="ka">ქართული</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
        </select></label
      ><label
        >{{ i.t('theme')
        }}<select [(ngModel)]="profile.theme" name="theme">
          <option value="light">{{ i.t('light') }}</option>
          <option value="dark">{{ i.t('dark') }}</option>
        </select></label
      ><label class="check"
        ><input type="checkbox" [(ngModel)]="profile.notificationsEnabled" name="notifications" />{{
          i.t('notificationsEnabled')
        }}</label
      ><label class="check"
        ><input type="checkbox" [(ngModel)]="profile.inAppNotificationsEnabled" name="inapp" />{{
          i.t('inAppNotifications')
        }}</label
      ><label class="check"
        ><input type="checkbox" [(ngModel)]="profile.emailNotificationsEnabled" name="email" />{{
          i.t('emailNotifications')
        }}</label
      ><label class="check"
        ><input type="checkbox" [(ngModel)]="profile.allowContactSharing" name="contact" />{{
          i.t('contactSharing')
        }}</label
      ><button class="primary">{{ i.t('save') }}</button>
    </form>
    <hr />
    <form (ngSubmit)="password()">
      <h2>{{ i.t('changePassword') }}</h2>
      <label
        >{{ i.t('currentPassword')
        }}<input
          type="password"
          autocomplete="current-password"
          [(ngModel)]="currentPassword"
          name="currentPassword"
          required /></label
      ><label
        >{{ i.t('newPassword')
        }}<input
          type="password"
          autocomplete="new-password"
          minlength="10"
          [(ngModel)]="newPassword"
          name="newPassword"
          required /></label
      ><button class="primary">{{ i.t('changePassword') }}</button>
      <p *ngIf="passwordSaved">{{ i.t('passwordChanged') }}</p>
      <p class="error" *ngIf="passwordError">{{ i.t('passwordFailed') }}</p>
    </form>
    <button type="button" class="text-button" (click)="auth.logout()">{{i.t('logout')}}</button>
    <hr><section class="unavailable"><h2>{{i.t('passkeys')}}</h2><p>{{i.t('passkeysUnavailable')}}</p></section><section class="unavailable"><h2>{{i.t('partnerIntegrations')}}</h2><p>{{i.t('partnersUnavailable')}}</p></section>
  </section>`,
  styleUrl: './communication.scss',
})
export class SettingsPage extends ProfilePage {
  auth=inject(AuthService);
  currentPassword = '';
  newPassword = '';
  passwordSaved = false;
  passwordError = false;
  override save() {
    if (this.profile)
      this.api.updateProfile(this.profile).subscribe((x) => {
        this.profile = x;
        this.i.set(x.language as any);
        document.documentElement.dataset['theme'] = x.theme;
        localStorage.setItem('theme', x.theme);
        this.cdr.detectChanges();
      });
  }
  password() {
    this.passwordSaved = false;
    this.passwordError = false;
    this.api.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.passwordSaved = true;
        this.cdr.detectChanges();
      },
      error: () => {this.passwordError = true;this.cdr.detectChanges()},
    });
  }
}
@Component({standalone:true,imports:[CommonModule,RouterLink],template:`<section class="panel public-profile"><p *ngIf="loading">{{i.t('loading')}}</p><div *ngIf="profile"><img *ngIf="profile.photoUrl" [src]="profile.photoUrl" [alt]="profile.displayName"><div class="avatar" *ngIf="!profile.photoUrl">{{profile.displayName[0]}}</div><h1>{{profile.displayName}}</h1><p>{{profile.rating||0}} ★ ({{profile.ratingCount}})</p><p>{{profile.successfulReturns}} {{i.t('successfulReturns')}}</p></div><p *ngIf="error">{{i.t('notFound')}}</p><a routerLink="/explore">{{i.t('explore')}}</a></section>`,styleUrl:'./communication.scss'})
export class PublicProfilePage implements OnInit{i=inject(I18nService);api=inject(CommunicationApi);route=inject(ActivatedRoute);cdr=inject(ChangeDetectorRef);profile:any;loading=true;error=false;ngOnInit(){this.api.publicProfile(this.route.snapshot.paramMap.get('id')!).subscribe({next:x=>{this.profile=x;this.loading=false;this.cdr.detectChanges()},error:()=>{this.error=true;this.loading=false;this.cdr.detectChanges()}})}}
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<section class="panel wide">
    <h1>{{ i.t('messages') }}</h1>
    <p *ngIf="!rows.length">{{ i.t('emptyMessages') }}</p>
    <a class="conversation" *ngFor="let c of rows" [routerLink]="['/messages', c.id]"
      ><div class="avatar">{{ c.participants[0]?.displayName?.[0] }}</div>
      <div>
        <b>{{ c.itemTitle || i.t('conversation') }}</b
        ><span>{{ c.lastMessage || i.t('noMessages') }}</span>
      </div>
      <strong *ngIf="c.unreadCount">{{ c.unreadCount }}</strong></a
    >
  </section>`,
  styleUrl: './communication.scss',
})
export class ConversationsPage implements OnInit {
  i = inject(I18nService);
  api = inject(CommunicationApi);
  cdr=inject(ChangeDetectorRef);
  rows: Conversation[] = [];
  ngOnInit() {
    this.api.conversations().subscribe((x) => {this.rows = x;this.cdr.detectChanges()});
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="chat">
    <header>
      <a routerLink="/messages">‹</a>
      <h2>{{ i.t('conversation') }}</h2>
      <small>{{i.t(connectionState)}}</small>
    </header>
    <div class="messages">
      <p *ngIf="!rows.length">{{ i.t('noMessages') }}</p>
      <article *ngFor="let m of rows">
        <b>{{ m.senderDisplayName }}</b
        ><span>{{ m.body }}</span
        ><small>{{ m.createdAtUtc | date: 'shortTime' }}</small>
      </article>
    </div>
    <form (ngSubmit)="send()">
      <label class="sr-only">{{ i.t('message') }}</label
      ><input
        [(ngModel)]="body"
        name="body"
        maxlength="4000"
        [placeholder]="i.t('writeMessage')"
      /><button class="primary">{{ i.t('send') }}</button>
    </form>
  </section>`,
  styleUrl: './communication.scss',
})
export class ChatPage implements OnInit {
  i = inject(I18nService);
  api = inject(CommunicationApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  rows: Message[] = [];
  body = '';
  id = '';
  connectionState='connecting';
  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.api.messages(this.id).subscribe((x) => {this.rows = x.items.reverse();this.api.readConversation(this.id).subscribe();this.cdr.detectChanges()});
    this.join();
  }
  async join() {
    const connection = await this.api.connect((m) => {
      if (m.conversationId === this.id && !this.rows.some((x) => x.id === m.id)){this.rows.push(m);this.api.readConversation(this.id).subscribe();this.cdr.detectChanges()}
    });
    this.connectionState='connected';this.cdr.detectChanges();
    connection.onreconnecting(()=>{this.connectionState='reconnecting';this.cdr.detectChanges()});
    connection.onreconnected(()=>{this.connectionState='connected';this.cdr.detectChanges();connection.invoke('JoinConversation',this.id)});
    connection.onclose(()=>{this.connectionState='disconnected';this.cdr.detectChanges()});
    await connection.invoke('JoinConversation', this.id);
  }
  send() {
    if (this.body.trim())
      this.api.send(this.id, this.body).subscribe((m) => {
        if (!this.rows.some((x) => x.id === m.id)) this.rows.push(m);
        this.body = '';
        this.cdr.detectChanges();
      });
  }
}
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `<section class="panel wide">
    <div class="title">
      <h1>{{ i.t('notifications') }}</h1>
      <button (click)="all()">{{ i.t('markAllRead') }}</button>
    </div>
    <p *ngIf="!rows.length">{{ i.t('emptyNotifications') }}</p>
    <article class="notice" *ngFor="let n of rows" [class.unread]="!n.readAtUtc" tabindex="0" (click)="open(n)" (keydown.enter)="open(n)">
      <img src="icons/bell.svg" />
      <div>
        <b>{{ n.type }}</b
        ><small>{{ n.createdAtUtc | date: 'medium' }}</small>
      </div>
    </article>
  </section>`,
  styleUrl: './communication.scss',
})
export class NotificationsPage implements OnInit {
  i = inject(I18nService);
  api = inject(CommunicationApi);
  router=inject(Router);
  cdr=inject(ChangeDetectorRef);
  rows: any[] = [];
  ngOnInit() {
    this.api.notifications().subscribe((x) => {this.rows = x.items;this.cdr.detectChanges()});
  }
  all() {
    this.api.readAll().subscribe(() => {this.rows.forEach((x) => (x.readAtUtc = new Date()));this.cdr.detectChanges()});
  }
  open(n:any){let payload:any={};try{payload=JSON.parse(n.payloadJson||'{}')}catch{};const target=payload.conversationId?`/messages/${payload.conversationId}`:payload.claimId?`/claims/${payload.claimId}`:payload.matchId?`/matches/${payload.matchId}`:payload.itemId?`/items/${payload.itemId}`:'/notifications';this.api.readNotification(n.id).subscribe(()=>{n.readAtUtc=new Date();this.router.navigateByUrl(target)})}
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<section class="panel">
    <h1>{{ i.t('report') }}</h1>
    <form (ngSubmit)="submit()">
      <label
        >{{ i.t('reason')
        }}<select [(ngModel)]="reason" name="reason">
          <option>spam</option>
          <option>scam</option>
          <option>inappropriate</option>
          <option>other</option>
        </select></label
      ><label>{{ i.t('details') }}<textarea [(ngModel)]="details" name="details"></textarea></label
      ><button class="primary">{{ i.t('submit') }}</button>
      <p class="success" *ngIf="saved">{{i.t('reportSubmitted')}}</p><p class="error" *ngIf="error">{{error}}</p>
    </form>
  </section>`,
  styleUrl: './communication.scss',
})
export class ReportPage {
  i = inject(I18nService);
  api = inject(CommunicationApi);
  route = inject(ActivatedRoute);
  cdr=inject(ChangeDetectorRef);
  reason = 'spam';
  details = '';
  saved=false;error='';
  submit() {
    const itemId = this.route.snapshot.queryParamMap.get('itemId');
    const reportedUserId=this.route.snapshot.queryParamMap.get('userId');const messageId=this.route.snapshot.queryParamMap.get('messageId');
    this.api.report({ itemId,reportedUserId,messageId, reason: this.reason, details: this.details }).subscribe({next:()=>{this.saved=true;this.details='';this.cdr.detectChanges()},error:(e:any)=>{this.error=e.error?.title||this.i.t('retry');this.cdr.detectChanges()}});
  }
}
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="panel">
    <h1>{{ i.t('ratings') }}</h1>
    <p>{{ i.t('ratingDependency') }}</p>
    <form *ngIf="exchangeId && !saved" (ngSubmit)="submit()"><fieldset><legend>{{i.t('score')}}</legend><label *ngFor="let value of [1,2,3,4,5]"><input type="radio" name="score" [value]="value" [(ngModel)]="score">{{value}} ★</label></fieldset><label>{{i.t('comment')}}<textarea maxlength="1000" name="review" [(ngModel)]="review"></textarea></label><button class="primary">{{i.t('submit')}}</button></form><p class="success" *ngIf="saved">{{i.t('ratingSaved')}}</p><p class="error" *ngIf="error">{{error}}</p><a routerLink="/exchanges" *ngIf="!exchangeId">{{i.t('exchanges')}}</a>
  </section>`,
  styleUrl: './communication.scss',
})
export class RatingsPage {
  i = inject(I18nService);
  api=inject(CommunicationApi);route=inject(ActivatedRoute);cdr=inject(ChangeDetectorRef);exchangeId=this.route.snapshot.queryParamMap.get('exchangeId')||'';score=5;review='';saved=false;error='';submit(){this.api.rate(this.exchangeId,this.score,this.review).subscribe({next:()=>{this.saved=true;this.cdr.detectChanges()},error:(e:any)=>{this.error=e.error?.title||this.i.t('retry');this.cdr.detectChanges()}})}
}
