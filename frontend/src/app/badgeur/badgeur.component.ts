import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-badgeur',
  templateUrl: './badgeur.component.html',
  styleUrls: ['./badgeur.component.css'],
})
export class BadgeurComponent {
  @Output() newBadgeageEvent = new EventEmitter<Date>();

  @Input() canBadge: boolean | null = true;

  badger() {
    const badgeage = new Date();
    badgeage.setMilliseconds(0);
    this.newBadgeageEvent.emit(badgeage);
  }
}
