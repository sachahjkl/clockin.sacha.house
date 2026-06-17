import { Component, input } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
    selector: "app-nav-link",
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    styles: [
        `
            :host {
                display: block;
            }
            .nav-btn-base {
                display: block;
                border-radius: 0.5rem;
                text-align: center;
                font-weight: 600;
                color: white;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            .nav-btn-base:hover {
                outline: 2px solid rgba(0, 0, 0, 0.2);
            }
            .nav-btn-blue {
                background-image: linear-gradient(to right, #60a5fa, #3b82f6);
            }
            .nav-btn-blue:hover {
                background-image: linear-gradient(to right, #3b82f6, #2563eb);
            }
            .nav-btn-blue:active {
                transform: scale(0.98);
            }
            .nav-btn-blue-active {
                background-image: linear-gradient(to right, #3b82f6, #2563eb);
            }
            .nav-btn-blue-active:active {
                transform: scale(0.98);
            }
            .nav-btn-red {
                background-image: linear-gradient(to right, #f87171, #ef4444);
            }
            .nav-btn-red:hover {
                background-image: linear-gradient(to right, #ef4444, #dc2626);
            }
            .nav-btn-red:active {
                transform: scale(0.95);
            }
            .nav-btn-default-size {
                padding: 0.5rem 1rem;
            }
            .nav-btn-compact-size {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
            }
        `,
    ],
    template: `
        <a
            [routerLink]="routerLink()"
            routerLinkActive
            #rla="routerLinkActive"
            [routerLinkActiveOptions]="routerLinkActiveOptions()"
            class="nav-btn-base"
            [class.nav-btn-blue]="color() === 'blue' && !rla.isActive"
            [class.nav-btn-blue-active]="color() === 'blue' && rla.isActive"
            [class.nav-btn-red]="color() === 'red'"
            [class.nav-btn-default-size]="size() === 'default'"
            [class.nav-btn-compact-size]="size() === 'compact'"
        ><ng-content/></a>
    `,
})
export class NavLinkComponent {
    routerLink = input.required<string | any[]>();
    routerLinkActiveOptions = input<{ exact: boolean }>({ exact: false });
    color = input<"blue" | "red">("blue");
    size = input<"default" | "compact">("default");
}
