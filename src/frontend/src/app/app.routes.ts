import { Routes } from '@angular/router';
import { DetailsPage, EditorPage, HomePage, SearchPage } from './pages/pages';
import {
  ChatPage,
  ConversationsPage,
  NotificationsPage,
  ProfilePage,
  PublicProfilePage,
  RatingsPage,
  ReportPage,
  SettingsPage,
} from './pages/communication.pages';
import { authGuard, moderatorGuard } from './core/auth.guard';
import { MatchDetailsPage, MatchesPage, ModerationDashboardPage } from './pages/phase5.pages';
import {
  ClaimDetailsPage,
  ClaimsPage,
  ExchangesPage,
  PublicQrPage,
  QrTagsPage,
  SubmitClaimPage,
} from './pages/ownership.pages';
import { ForgotPasswordPage, LoginPage, NotFoundPage, RegisterPage, ResetPasswordPage } from './pages/auth.pages';
import { FavoritesPage, MyListingsPage } from './pages/listing.pages';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  { path: 'explore', component: SearchPage },
  { path: 'items/:id', component: DetailsPage },
  { path: 'items/:id/claim', component: SubmitClaimPage, canActivate: [authGuard] },
  { path: 'create', component: EditorPage, canActivate: [authGuard] },
  { path: 'favorites', component: FavoritesPage, canActivate: [authGuard] },
  { path: 'my-listings', component: MyListingsPage, canActivate: [authGuard] },
  { path: 'items/:id/edit', component: EditorPage, canActivate: [authGuard] },
  { path: 'claims', component: ClaimsPage, canActivate: [authGuard] },
  {
    path: 'claims/received',
    component: ClaimsPage,
    data: { received: true },
    canActivate: [authGuard],
  },
  { path: 'claims/:id', component: ClaimDetailsPage, canActivate: [authGuard] },
  { path: 'exchanges', component: ExchangesPage, canActivate: [authGuard] },
  { path: 'exchanges/:id', component: ExchangesPage, canActivate: [authGuard] },
  { path: 'qr-tags', component: QrTagsPage, canActivate: [authGuard] },
  { path: 'qr/:token', component: PublicQrPage },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: 'users/:id', component: PublicProfilePage },
  { path: 'settings', component: SettingsPage, canActivate: [authGuard] },
  { path: 'messages', component: ConversationsPage, canActivate: [authGuard] },
  { path: 'messages/:id', component: ChatPage, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsPage, canActivate: [authGuard] },
  { path: 'ratings', component: RatingsPage, canActivate: [authGuard] },
  { path: 'matches', component: MatchesPage, canActivate: [authGuard] },
  { path: 'matches/:id', component: MatchDetailsPage, canActivate: [authGuard] },
  { path: 'moderation', component: ModerationDashboardPage, canActivate: [moderatorGuard] },
  { path: 'report', component: ReportPage, canActivate: [authGuard] },
  { path: 'not-found', component: NotFoundPage },
  { path: '**', component: NotFoundPage },
];
