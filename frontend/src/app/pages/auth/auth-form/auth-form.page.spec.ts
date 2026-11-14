import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgHcaptchaModule } from 'ng-hcaptcha';
import { AuthPage } from './auth-form.page';

describe('AuthPage', () => {
  let component: AuthPage;
  let fixture: ComponentFixture<AuthPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), importProvidersFrom(NgHcaptchaModule.forRoot({ siteKey: 'test-site-key' }))],
    });
    fixture = TestBed.createComponent(AuthPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
