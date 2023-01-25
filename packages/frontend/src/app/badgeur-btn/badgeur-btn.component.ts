import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-badgeur-btn',
  templateUrl: './badgeur-btn.component.html',
  styleUrls: ['./badgeur-btn.component.css'],
})
export class BadgeurBtnComponent {
  @Output() newBadgeageEvent = new EventEmitter<Date>();

  @Input() canBadge: boolean | null = true;

  badger() {
    const badgeage = new Date();
    badgeage.setMilliseconds(0);
    this.newBadgeageEvent.emit(badgeage);
  }
}
