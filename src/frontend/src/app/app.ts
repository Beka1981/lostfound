import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService, Language } from './core/i18n.service';
import { AuthService } from './core/auth.service';
import { CommunicationApi } from './core/communication.api';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  i = inject(I18nService);
  auth = inject(AuthService);
  communication = inject(CommunicationApi);
  unread = signal(0);
  dark = signal(localStorage.getItem('theme') === 'dark');
  menu = signal(false);
  private unreadTimer?:number;
  constructor() {
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
    effect(() => {
      if (this.auth.authenticated()) {
        this.communication
          .unreadCount()
          .subscribe({ next: (x) => this.unread.set(x), error: () => this.unread.set(0) });
        if(!this.unreadTimer)this.unreadTimer=window.setInterval(()=>this.communication.unreadCount().subscribe({next:x=>this.unread.set(x)}),30_000);
      } else {this.unread.set(0);if(this.unreadTimer){clearInterval(this.unreadTimer);this.unreadTimer=undefined}}
    });
  }
  setLanguage(v: string) {
    this.i.set(v as Language);
  }
  toggleTheme() {
    this.dark.update((v) => !v);
    document.documentElement.dataset['theme'] = this.dark() ? 'dark' : 'light';
    localStorage.setItem('theme', this.dark() ? 'dark' : 'light');
  }
}
