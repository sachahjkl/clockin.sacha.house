import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AccountService } from "../core/account.service";
import { I18nService } from "../core/i18n.service";
import { NavLinkComponent } from "./nav-link.component";
import { NavButtonComponent } from "./nav-button.component";
import { IconComponent } from "./icon.component";

@Component({
    selector: "app-nav",
    standalone: true,
    imports: [RouterLink, NavLinkComponent, NavButtonComponent, IconComponent],
    styles: [
        `
            :host {
                position: sticky;
                top: 0;
                z-index: 40;
                display: block;
            }

            @media (min-width: 640px) {
                .burger-btn {
                    display: none;
                }
            }
        `,
    ],
    template: `
        <header class="mb-4 w-full border-b border-slate-200/80 bg-white px-4 py-2 shadow-sm sm:py-4 space-y-2">
            <div
                class="flex min-h-[40px] max-w-5xl flex-wrap items-center justify-between gap-4 mx-auto"
            >
                <a routerLink="/" class="flex items-center gap-2 text-xl">
                    <picture class="shrink-0">
                        <source
                            srcset="assets/app-icon-32.png 32w, assets/app-icon-64.png 64w, assets/app-icon-128.png 128w, assets/app-icon-256.png 256w, assets/app-icon-512.png 512w, assets/app-icon.png 1024w"
                            sizes="32px"
                            type="image/png"
                        />
                        <img src="assets/app-icon-64.png" alt="" class="h-8 w-8" />
                    </picture>
                    <span
                        class="inline-block w-[9ch] bg-gradient-to-tr from-blue-400 to-blue-600 bg-clip-text font-extrabold text-transparent underline decoration-blue-200 underline-offset-4 transition hover:from-green-400 hover:to-green-500"
                        >Clock-in</span
                    >
                </a>
                <div class="flex items-center gap-2">
                    <div class="items-center gap-2 hidden sm:flex">
                        @if (account.userId()) {
                            <nav class="flex items-center gap-2">
                                <app-nav-link routerLink="/clockin"
                                    ><app-icon name="home" size="1.2em" class="mr-1" /> {{ i18n.t("app.clockin") }}</app-nav-link
                                >
                                <app-nav-link routerLink="/history"
                                    ><app-icon name="schedule" size="1.2em" class="mr-1" /> {{ i18n.t("app.history") }}</app-nav-link
                                >
                                <app-nav-link routerLink="/account"
                                    ><app-icon name="person" size="1.2em" class="mr-1" /> {{ i18n.t("app.account") }}</app-nav-link
                                >
                            </nav>
                            <app-nav-button color="red" (clicked)="logout()"
                                ><app-icon name="logout" size="1.2em" class="mr-1" /> {{ i18n.t("app.logout") }}</app-nav-button
                            >
                        }
                    </div>
                    @if (account.userId()) {
                        <button
                            type="button"
                            class="burger-btn sm:hidden flex cursor-pointer items-center justify-center rounded-lg p-1 text-2xl text-slate-700 transition hover:bg-slate-100"
                            (click)="menuOpen.set(!menuOpen())"
                        >
                            <app-icon [name]="menuOpen() ? 'menu_close' : 'menu_open'" size="1.75rem" />
                        </button>
                    }
                </div>
            </div>
            @if (menuOpen()) {
                <div class="mobile-menu bg-white shadow-sm flex flex-col gap-1 sm:hidden">
                    <app-nav-link routerLink="/clockin" (click)="menuOpen.set(false)"
                        ><app-icon name="home" size="1.2em" class="mr-1" /> {{ i18n.t("app.clockin") }}</app-nav-link
                    >
                    <app-nav-link routerLink="/history" (click)="menuOpen.set(false)"
                        ><app-icon name="schedule" size="1.2em" class="mr-1" /> {{ i18n.t("app.history") }}</app-nav-link
                    >
                    <app-nav-link routerLink="/account" (click)="menuOpen.set(false)"
                        ><app-icon name="person" size="1.2em" class="mr-1" /> {{ i18n.t("app.account") }}</app-nav-link
                    >
                    <app-nav-button color="red" (clicked)="logout()"
                        ><app-icon name="logout" size="1.2em" class="mr-1" /> {{ i18n.t("app.logout") }}</app-nav-button
                    >
                </div>
            }
        </header>
    `,
})
export class NavComponent {
    protected account = inject(AccountService);
    protected i18n = inject(I18nService);
    private router = inject(Router);
    protected menuOpen = signal(false);

    async logout(): Promise<void> {
        this.menuOpen.set(false);
        this.account.clear();
        await this.router.navigate(["/connect"]);
    }
}
