import { BadgeurService } from '../badgeur.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(readonly badgeurService: BadgeurService) {}

  addBadgeageLocal = (d: Date) => {
    console.info('addBadgeageLocal', d);
    this.badgeurService.addBadgeage(d);
  };

  editBadgeage = (p: number, b: Date) => this.badgeurService.editBadgeage(p, b);
}
