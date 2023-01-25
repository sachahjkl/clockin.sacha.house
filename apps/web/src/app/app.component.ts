import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavComponent } from "./components/nav.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, NavComponent],
    template: `
        <div class="min-h-screen">
            <app-nav />
            <main class="page-shell pt-6">
                <router-outlet />
            </main>
        </div>
    `,
})
export class AppComponent {}
