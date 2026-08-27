import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';
import { RegisterPage } from './auth.pages';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let page: RegisterPage;
  let response: Subject<unknown>;
  let calls: number;

  beforeEach(async () => {
    response = new Subject();
    calls = 0;
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        I18nService,
        {
          provide: AuthService,
          useValue: {
            register: () => {
              calls++;
              return response;
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterPage);
    page = fixture.componentInstance;
    page.i.set('ka');
    fixture.detectChanges();
  });

  const person = () => {
    page.model = {
      accountType: 0,
      firstName: 'A',
      lastName: 'B',
      email: 'name@example.com',
      phoneNumber: 'x',
      password: 'Aa123456',
    };
    page.confirm = 'Aa123456';
    page.terms = true;
    fixture.detectChanges();
  };
  const organization = () => {
    page.setType(1);
    page.model = {
      accountType: 1,
      organizationName: 'O',
      responsiblePerson: 'R',
      email: 'office@example.com',
      phoneNumber: 'any phone',
      password: 'Aa123456',
    };
    page.confirm = 'Aa123456';
    page.terms = true;
    fixture.detectChanges();
  };

  it('shows Georgian Person required messages for trimmed-empty values', async () => {
    for (const [selector, message] of [
      ['#firstName', 'სახელი სავალდებულოა.'],
      ['#lastName', 'გვარი სავალდებულოა.'],
      ['#registerPhone', 'ტელეფონის ნომერი სავალდებულოა.'],
    ]) {
      const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
      input.value = '   ';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(message);
    }
  });

  it('shows Georgian Organization required messages', async () => {
    page.setType(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    for (const [selector, message] of [
      ['#organizationName', 'ორგანიზაციის სახელწოდება სავალდებულოა.'],
      ['#responsiblePerson', 'პასუხისმგებელი პირი სავალდებულოა.'],
    ]) {
      const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
      input.value = ' ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(message);
    }
  });

  it('accepts one-character names and an unrestricted non-empty phone', () => {
    person();
    expect(page.visibleRequiredPresent).toBe(true);
    expect(page.canSubmit({ valid: true })).toBe(true);
  });

  it('rejects whitespace-only visible fields', () => {
    person();
    page.model.firstName = ' ';
    expect(page.canSubmit({ valid: true })).toBe(false);
    person();
    page.model.phoneNumber = '\t';
    expect(page.canSubmit({ valid: true })).toBe(false);
  });

  it('keeps invalid Email, weak Password, mismatch and unchecked Terms disabled', () => {
    person();
    expect(page.canSubmit({ valid: false })).toBe(false);
    person();
    page.model.password = 'weak';
    expect(page.canSubmit({ valid: true })).toBe(false);
    person();
    page.confirm = 'different';
    expect(page.canSubmit({ valid: true })).toBe(false);
    person();
    page.terms = false;
    expect(page.canSubmit({ valid: true })).toBe(false);
  });

  it('activates completed Person and Organization forms', () => {
    person();
    expect(page.canSubmit({ valid: true })).toBe(true);
    organization();
    expect(page.canSubmit({ valid: true })).toBe(true);
  });

  it('removes hidden controls and validators when switching account type', async () => {
    person();
    page.setType(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#firstName')).toBeFalsy();
    expect(page.model.firstName).toBeUndefined();
    organization();
    await fixture.whenStable();
    fixture.detectChanges();
    page.setType(0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#organizationName')).toBeFalsy();
    expect(page.model.organizationName).toBeUndefined();
  });

  it('shows loading and prevents duplicate requests', async () => {
    person();
    page.submit({ valid: true });
    page.submit({ valid: true });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.busy).toBe(true);
    expect(calls).toBe(1);
    expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
  });

  it('shows the success dialog and waits for OK before navigating to login', async () => {
    person();
    const navigate = vi.spyOn(page.router, 'navigateByUrl');
    page.submit({ valid: true });
    response.next({});
    response.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.success-modal');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();

    fixture.nativeElement.querySelector('.success-ok').click();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('does not show the success dialog when registration fails', () => {
    person();
    page.submit({ valid: true });
    response.error({ error: {} });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.success-modal')).toBeFalsy();
    expect(page.error).toBe(page.i.t('registrationFailed'));
  });

  it('contains correct KA, EN and RU required labels', () => {
    expect(page.i.t('firstNameRequired')).toBe('სახელი სავალდებულოა.');
    page.i.set('en');
    expect(page.i.t('phoneRequired')).toBe('Phone number is required.');
    page.i.set('ru');
    expect(page.i.t('responsiblePersonRequired')).toBe('Ответственное лицо обязательно.');
  });

  it('localizes registration success text in KA, EN and RU', () => {
    expect(page.i.t('registrationSuccessTitle')).toBe('რეგისტრაცია წარმატებით დასრულდა');
    page.i.set('en');
    expect(page.i.t('registrationSuccessTitle')).toBe('Registration successful');
    page.i.set('ru');
    expect(page.i.t('registrationSuccessTitle')).toBe('Регистрация прошла успешно');
  });
});
