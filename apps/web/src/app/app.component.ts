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
            <main class="mx-auto w-full max-w-5xl px-4 py-4">
                <section class="min-h-[300px] rounded-xl bg-white p-4 shadow">
                    <router-outlet />
                </section>
            </main>
        </div>
    `,
})
export class AppComponent {}
