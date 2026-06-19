import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { AccountService } from "./core/account.service";
import { SeoService } from "./core/seo.service";
import { FooterComponent } from "./components/footer.component";
import { NavComponent } from "./components/nav.component";
import { ToastStackComponent } from "./components/toast-stack.component";
import { WelcomeWizardComponent } from "./components/welcome-wizard.component";

interface LayoutRouteData {
    hideNav: boolean;
    fullscreen: boolean;
}

const INITIAL_LAYOUT_DATA: LayoutRouteData = {
    hideNav: false,
    fullscreen: false,
};

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, NavComponent, FooterComponent, ToastStackComponent, WelcomeWizardComponent],
    template: `
        <div class="flex min-h-screen flex-col">
            @if (!hideNav()) {
                <app-nav />
            }
            <main [class]="mainClass()">
                <section [class]="sectionClass()">
                    <router-outlet />
                </section>
            </main>
            <app-footer />
            <app-toast-stack />
            @if (account.welcomeWizardOpen() && account.userId(); as uid) {
                <app-welcome-wizard
                    [userId]="uid"
                    (close)="account.dismissWelcomeWizard()"
                />
            }
        </div>
    `,
})
export class AppComponent {
    private readonly router = inject(Router);
    private readonly seo = inject(SeoService);
    protected readonly account = inject(AccountService);
    private readonly routeData = toSignal(
        this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            startWith(null),
            map(() => {
                const data = this.router.routerState.snapshot.root.firstChild?.data;
                return {
                    hideNav: Boolean(data?.["hideNav"]),
                    fullscreen: Boolean(data?.["fullscreen"]),
                };
            }),
        ),
        { initialValue: INITIAL_LAYOUT_DATA },
    );

    readonly hideNav = computed(() => this.routeData()?.hideNav ?? false);
    readonly fullscreen = computed(() => this.routeData()?.fullscreen ?? false);
    readonly mainClass = computed(() =>
        this.fullscreen()
            ? "w-full flex-1"
            : "mx-auto w-full max-w-5xl flex-1 px-4 py-4",
    );
    readonly sectionClass = computed(() =>
        this.fullscreen()
            ? "min-h-full"
            : "min-h-[300px] rounded-xl bg-white p-4 shadow",
    );
}
