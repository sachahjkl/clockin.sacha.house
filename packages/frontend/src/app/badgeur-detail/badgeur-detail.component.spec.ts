import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeurDetailComponent } from './badgeur-detail.component';

describe('BadgeurDetailComponent', () => {
  let component: BadgeurDetailComponent;
  let fixture: ComponentFixture<BadgeurDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgeurDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeurDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
