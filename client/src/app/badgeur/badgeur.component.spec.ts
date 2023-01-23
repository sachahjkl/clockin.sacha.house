import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeurComponent } from './badgeur.component';

describe('BadgeurComponent', () => {
  let component: BadgeurComponent;
  let fixture: ComponentFixture<BadgeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgeurComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
