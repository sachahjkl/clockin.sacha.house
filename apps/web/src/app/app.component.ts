import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "./components/footer.component";
import { NavComponent } from "./components/nav.component";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, NavComponent, FooterComponent],
    template: `
        <div class="flex min-h-screen flex-col">
            <app-nav />
            <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-4">
                <section class="min-h-[300px] rounded-xl bg-white p-4 shadow">
                    <router-outlet />
                </section>
            </main>
            <app-footer />
        </div>
    `,
})
export class AppComponent {}