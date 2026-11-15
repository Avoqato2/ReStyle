import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PasswordChangedPage } from './password-changed.page';

describe('PasswordChangedPage', () => {
  let component: PasswordChangedPage;
  let fixture: ComponentFixture<PasswordChangedPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PasswordChangedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
