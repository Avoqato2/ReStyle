import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppButtonComponent } from './app-button.component';

describe('AppButtonComponent', () => {
  let component: AppButtonComponent;
  let fixture: ComponentFixture<AppButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppButtonComponent],
    });
    fixture = TestBed.createComponent(AppButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses primary as the default variant', () => {
    const button = fixture.nativeElement.querySelector('ion-button');

    expect(component.variant()).toBe('primary');
    expect(button.getAttribute('fill')).toBe('solid');
    expect(button.getAttribute('shape')).toBe('round');
  });

  it('renders start and end icons from string names', () => {
    fixture.componentRef.setInput('iconStart', 'mail-outline');
    fixture.componentRef.setInput('iconEnd', 'arrow-forward-outline');
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('ion-icon');
    expect(icons).toHaveLength(2);
    expect(icons[0].getAttribute('slot')).toBe('start');
    expect(icons[1].getAttribute('slot')).toBe('end');
  });
});
