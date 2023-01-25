import { BrowserModule, Title } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BadgeurBtnComponent } from './badgeur-btn/badgeur-btn.component';
import { BadgeurDetailComponent } from './badgeur-detail/badgeur-detail.component';
import { HistoryComponent } from './history/history.component';
import { HomeComponent } from './home/home.component';
import { NavComponent } from './nav/nav.component';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    HomeComponent,
    HistoryComponent,
    BadgeurBtnComponent,
    BadgeurDetailComponent,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [Title],
  bootstrap: [AppComponent],
})
export class AppModule {}
