import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationMailPage } from './confirmation-mail.page';

describe('ConfirmationMailPage', () => {
  let component: ConfirmationMailPage;
  let fixture: ComponentFixture<ConfirmationMailPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ConfirmationMailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
