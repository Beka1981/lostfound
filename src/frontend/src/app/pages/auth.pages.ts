import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, RegisterModel } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';

function problem(error: unknown) {
  const e = error as HttpErrorResponse;
  return (
    e.error?.title ||
    e.error?.detail ||
    (e.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.')
  );
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="auth-layout">
    <div class="auth-story">
      <a class="brand-mark" routerLink="/"><span>F</span>Foundly</a>
      <p class="eyebrow">LOST & FOUND COMMUNITY</p>
      <h1>{{ i.t('welcomeBack') }}</h1>
      <p>{{ i.t('loginIntro') }}</p>
    </div>
    <form class="auth-card" (ngSubmit)="submit()" #form="ngForm">
      <h2>{{ i.t('login') }}</h2>
      <p>
        {{ i.t('noAccount') }} <a routerLink="/register">{{ i.t('register') }}</a>
      </p>
      <label
        >{{ i.t('email')
        }}<input
          name="email"
          type="email"
          autocomplete="email"
          required
          email
          [(ngModel)]="email" /></label
      ><label
        >{{ i.t('password') }}
        <div class="password">
          <input
            name="password"
            [type]="show ? 'text' : 'password'"
            autocomplete="current-password"
            required
            [(ngModel)]="password"
          /><button type="button" (click)="show = !show" [attr.aria-label]="i.t('showPassword')">
            <img src="icons/eye.svg" alt="" />
          </button></div
      ></label>
      <div class="form-row">
        <label class="check"
          ><input type="checkbox" name="remember" [(ngModel)]="remember" />{{
            i.t('rememberMe')
          }}</label
        ><a routerLink="/forgot-password">{{ i.t('forgotPassword') }}</a>
      </div>
      <p class="error" role="alert" *ngIf="error">{{ error }}</p>
      <button class="submit" [disabled]="busy || form.invalid">
        {{ busy ? i.t('loading') : i.t('login') }}</button
      ><button class="google" type="button" (click)="googleMessage = true">
        G&nbsp;&nbsp;{{ i.t('continueGoogle') }}
      </button>
      <p class="notice" role="status" *ngIf="googleMessage">{{ i.t('googleUnavailable') }}</p>
    </form>
  </section>`,
  styleUrl: './auth.scss',
})
export class LoginPage {
  i = inject(I18nService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  email = '';
  password = '';
  remember = true;
  show = false;
  busy = false;
  error = '';
  googleMessage = false;
  submit() {
    this.busy = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () =>
        this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/'),
      error: (e) => {
        this.error = problem(e);
        this.busy = false;
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="auth-layout">
      <div class="auth-story">
        <a class="brand-mark" routerLink="/"><span>F</span>Foundly</a>
        <p class="eyebrow">JOIN FOUNDLY</p>
        <h1>{{ i.t('createAccount') }}</h1>
        <p>{{ i.t('registerIntro') }}</p>
      </div>
      <form class="auth-card register-card" (ngSubmit)="submit(form)" #form="ngForm" novalidate>
        <h2>{{ i.t('register') }}</h2>
        <div class="account-switch" role="radiogroup" [attr.aria-label]="i.t('accountType')">
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="model.accountType === 0"
            [class.active]="model.accountType === 0"
            (click)="setType(0)"
          >
            {{ i.t('person') }}</button
          ><button
            type="button"
            role="radio"
            [attr.aria-checked]="model.accountType === 1"
            [class.active]="model.accountType === 1"
            (click)="setType(1)"
          >
            {{ i.t('organization') }}
          </button>
        </div>
        <ng-container *ngIf="model.accountType === 0"
          ><label for="firstName">{{ i.t('firstName') }} *</label
          ><input
            id="firstName"
            required
            maxlength="80"
            name="firstName"
            [(ngModel)]="model.firstName"
            #firstName="ngModel"
            (blur)="trim('firstName')"
          /><small class="field-error" *ngIf="firstName.touched && !model.firstName?.trim()">{{
            i.t('firstNameRequired')
          }}</small
          ><label for="lastName">{{ i.t('lastName') }} *</label
          ><input
            id="lastName"
            required
            maxlength="80"
            name="lastName"
            [(ngModel)]="model.lastName"
            #lastName="ngModel"
            (blur)="trim('lastName')"
          /><small class="field-error" *ngIf="lastName.touched && !model.lastName?.trim()">{{
            i.t('lastNameRequired')
          }}</small></ng-container
        ><ng-container *ngIf="model.accountType === 1"
          ><label for="organizationName">{{ i.t('organizationName') }} *</label
          ><input
            id="organizationName"
            required
            maxlength="160"
            name="organizationName"
            [(ngModel)]="model.organizationName"
            #organizationName="ngModel"
            (blur)="trim('organizationName')"
          /><small
            class="field-error"
            *ngIf="organizationName.touched && !model.organizationName?.trim()"
            >{{ i.t('organizationNameRequired') }}</small
          ><label for="responsiblePerson">{{ i.t('responsiblePerson') }} *</label
          ><input
            id="responsiblePerson"
            required
            maxlength="160"
            name="responsiblePerson"
            [(ngModel)]="model.responsiblePerson"
            #responsiblePerson="ngModel"
            (blur)="trim('responsiblePerson')"
          /><small
            class="field-error"
            *ngIf="responsiblePerson.touched && !model.responsiblePerson?.trim()"
            >{{ i.t('responsiblePersonRequired') }}</small
          ></ng-container
        ><label for="registerEmail">{{ i.t('email') }} *</label
        ><input
          id="registerEmail"
          required
          email
          maxlength="256"
          name="email"
          type="email"
          autocomplete="email"
          [(ngModel)]="model.email"
          #email="ngModel"
          (blur)="model.email = model.email.trim()"
        /><small class="field-error" *ngIf="email.invalid && email.touched">{{
          i.t('emailError')
        }}</small
        ><small class="field-error" *ngIf="fieldErrors()['email']">{{ fieldErrors()['email'] }}</small
        ><label for="registerPhone">{{ i.t('phone') }} *</label
        ><input
          id="registerPhone"
          required
          name="phone"
          type="tel"
          autocomplete="tel"
          maxlength="64"
          [(ngModel)]="model.phoneNumber"
          #phone="ngModel"
          (blur)="model.phoneNumber = model.phoneNumber?.trim()"
        /><small class="field-error" *ngIf="phone.touched && !model.phoneNumber?.trim()">{{
          i.t('phoneRequired')
        }}</small
        ><label for="registerPassword">{{ i.t('password') }} *</label>
        <div class="password">
          <input
            id="registerPassword"
            required
            name="password"
            [type]="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            [(ngModel)]="model.password"
          /><button
            type="button"
            (click)="showPassword = !showPassword"
            [attr.aria-label]="i.t('showPassword')"
          >
            <img src="icons/eye.svg" alt="" />
          </button>
        </div>
        <ul class="password-rules" [attr.aria-label]="i.t('passwordRequirements')">
          <li [class.met]="model.password.length >= 8">{{ i.t('passwordLength') }}</li>
          <li [class.met]="hasUpper">{{ i.t('passwordUpper') }}</li>
          <li [class.met]="hasLower">{{ i.t('passwordLower') }}</li>
          <li [class.met]="hasDigit">{{ i.t('passwordDigit') }}</li>
        </ul>
        <label for="confirmPassword">{{ i.t('confirmPassword') }} *</label>
        <div class="password">
          <input
            id="confirmPassword"
            required
            name="confirm"
            [type]="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            [(ngModel)]="confirm"
            #confirmControl="ngModel"
          /><button
            type="button"
            (click)="showConfirm = !showConfirm"
            [attr.aria-label]="i.t('showConfirmPassword')"
          >
            <img src="icons/eye.svg" alt="" />
          </button>
        </div>
        <small class="field-error" *ngIf="confirmControl.touched && model.password !== confirm">{{
          i.t('passwordMismatch')
        }}</small
        ><label class="check terms"
          ><input required type="checkbox" name="terms" [(ngModel)]="terms" /><span
            >{{ i.t('termsPrefix') }}
            <button class="terms-link" type="button" (click)="termsOpen = true">
              {{ i.t('termsLink') }}
            </button></span
          ></label
        >
        <p class="error" role="alert" *ngIf="error()">{{ error() }}</p>
        <button class="submit" [disabled]="!canSubmit(form)" [attr.aria-busy]="busy()">
          <span class="spinner" *ngIf="busy()" aria-hidden="true"></span
          >{{ i.t('createAccount') }}
        </button>
        <p class="center">
          {{ i.t('haveAccount') }} <a routerLink="/login">{{ i.t('login') }}</a>
        </p>
      </form>
    </section>
    <div
      class="terms-modal"
      *ngIf="termsOpen"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="i.t('termsLink')"
    >
      <div>
        <h2>{{ i.t('termsLink') }}</h2>
        <p>{{ i.t('temporaryTerms') }}</p>
        <button type="button" class="submit" (click)="termsOpen = false">{{ i.t('close') }}</button>
      </div>
    </div>
    <div
      class="success-modal"
      *ngIf="successOpen()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-success-title"
      aria-describedby="registration-success-message"
    >
      <div class="success-dialog">
        <div class="success-icon" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24"></circle>
            <path d="M15 27l7 7 15-16"></path>
          </svg>
        </div>
        <h2 id="registration-success-title">{{ i.t('registrationSuccessTitle') }}</h2>
        <p id="registration-success-message">{{ i.t('registrationSuccessMessage') }}</p>
        <button type="button" class="submit success-ok" autofocus (click)="continueToLogin()">
          {{ i.t('ok') }}
        </button>
      </div>
    </div>
    <div
      class="success-modal"
      *ngIf="duplicateErrorKey()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-error-title"
      aria-describedby="registration-error-message"
    >
      <div class="success-dialog error-dialog">
        <div class="success-icon error-icon" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24"></circle>
            <path d="M18 18l16 16"></path>
            <path d="M34 18L18 34"></path>
          </svg>
        </div>
        <h2 id="registration-error-title">{{ i.t('duplicateRegistrationTitle') }}</h2>
        <p id="registration-error-message">{{ i.t(duplicateErrorKey()) }}</p>
        <button type="button" class="submit success-ok error-ok" autofocus (click)="closeDuplicateError()">
          {{ i.t('ok') }}
        </button>
      </div>
    </div>`,
  styleUrl: './auth.scss',
})
export class RegisterPage {
  i = inject(I18nService);
  auth = inject(AuthService);
  router = inject(Router);
  model: RegisterModel = { accountType: 0, email: '', password: '', phoneNumber: '' };
  confirm = '';
  terms = false;
  busy = signal(false);
  error = signal('');
  fieldErrors = signal<Record<string, string>>({});
  showPassword = false;
  showConfirm = false;
  termsOpen = false;
  successOpen = signal(false);
  duplicateErrorKey = signal('');
  get hasUpper() {
    return /[A-Z]/.test(this.model.password);
  }
  get hasLower() {
    return /[a-z]/.test(this.model.password);
  }
  get hasDigit() {
    return /\d/.test(this.model.password);
  }
  get strong() {
    return this.model.password.length >= 8 && this.hasUpper && this.hasLower && this.hasDigit;
  }
  get visibleRequiredPresent() {
    const shared = !!this.model.phoneNumber?.trim();
    return this.model.accountType === 0
      ? shared && !!this.model.firstName?.trim() && !!this.model.lastName?.trim()
      : shared && !!this.model.organizationName?.trim() && !!this.model.responsiblePerson?.trim();
  }
  setType(type: 0 | 1) {
    this.model.accountType = type;
    this.error.set('');
    this.fieldErrors.set({});
    if (type === 0) {
      delete this.model.organizationName;
      delete this.model.responsiblePerson;
    } else {
      delete this.model.firstName;
      delete this.model.lastName;
    }
  }
  trim(field: 'firstName' | 'lastName' | 'organizationName' | 'responsiblePerson') {
    this.model[field] = this.model[field]?.trim();
  }
  canSubmit(form: any) {
    return (
      !this.busy() &&
      !this.successOpen() &&
      !this.duplicateErrorKey() &&
      form.valid &&
      this.visibleRequiredPresent &&
      this.strong &&
      this.model.password === this.confirm &&
      this.terms
    );
  }
  submit(form: any) {
    if (!this.canSubmit(form)) return;
    this.busy.set(true);
    this.error.set('');
    this.fieldErrors.set({});
    const request = {
      ...this.model,
      email: this.model.email.trim(),
      phoneNumber: this.model.phoneNumber?.trim(),
    };
    this.auth.register(request).subscribe({
      next: () => {
        this.busy.set(false);
        this.successOpen.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        const errors = e.error?.errors as Record<string, string[]> | undefined;
        if (errors) {
          this.duplicateErrorKey.set(this.duplicateMessageKey(errors));
          const fieldErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(errors))
            fieldErrors[key.toLowerCase()] = value[0] || this.i.t('registrationFailed');
          this.fieldErrors.set(fieldErrors);
          this.error.set(this.duplicateErrorKey() ? '' : fieldErrors['account'] || '');
        } else this.error.set(this.i.t('registrationFailed'));
      },
    });
  }
  private duplicateMessageKey(errors: Record<string, string[]>) {
    const duplicate = /(already|duplicate|registered|exists)/i;
    for (const [key, messages] of Object.entries(errors)) {
      const normalizedKey = key.toLowerCase();
      const text = messages.join(' ');
      if (normalizedKey === 'email' && (text === 'Unable to register with this email.' || duplicate.test(text)))
        return 'duplicateEmailMessage';
      if (
        (normalizedKey === 'phone' || normalizedKey === 'phonenumber') &&
        (text === 'Unable to register with this phone number.' || duplicate.test(text))
      )
        return 'duplicatePhoneMessage';
      if ((normalizedKey === 'account' || normalizedKey === 'user') && duplicate.test(text))
        return 'duplicateAccountMessage';
    }
    return '';
  }
  closeDuplicateError() {
    this.duplicateErrorKey.set('');
  }
  continueToLogin() {
    this.router.navigateByUrl('/login');
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<section class="auth-layout single">
    <form class="auth-card" (ngSubmit)="sent = true">
      <a class="back" routerLink="/login">← {{ i.t('back') }}</a>
      <h1>{{ i.t('forgotPassword') }}</h1>
      <p>{{ i.t('resetSafeIntro') }}</p>
      <label
        >{{ i.t('email')
        }}<input
          required
          email
          name="email"
          type="email"
          autocomplete="email"
          [(ngModel)]="email" /></label
      ><button class="submit">{{ i.t('sendReset') }}</button>
      <p class="notice" role="status" *ngIf="sent">{{ i.t('emailUnavailableSafe') }}</p>
    </form>
  </section>`,
  styleUrl: './auth.scss',
})
export class ForgotPasswordPage {
  i = inject(I18nService);
  email = '';
  sent = false;
}

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<section class="auth-layout single">
    <div class="auth-card">
      <h1>{{ i.t('resetPassword') }}</h1>
      <p class="notice">{{ i.t('emailUnavailableSafe') }}</p>
      <a class="submit button" routerLink="/login">{{ i.t('returnLogin') }}</a>
    </div>
  </section>`,
  styleUrl: './auth.scss',
})
export class ResetPasswordPage {
  i = inject(I18nService);
}

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<section class="not-found">
    <span>404</span>
    <h1>{{ i.t('notFound') }}</h1>
    <p>{{ i.t('notFoundHelp') }}</p>
    <a class="primary" routerLink="/">{{ i.t('home') }}</a>
  </section>`,
  styleUrl: './auth.scss',
})
export class NotFoundPage {
  i = inject(I18nService);
}
