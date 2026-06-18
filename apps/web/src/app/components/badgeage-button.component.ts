import { Component, inject, output, signal } from "@angular/core";
import { I18nService } from "../core/i18n.service";

interface Sparkle {
    id: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
}

@Component({
    selector: "app-badgeage-button",
    standalone: true,
    styles: [
        `
            :host {
                flex-grow: 1;
                flex-shrink: 1;
                max-width: 420px;
            }

            .hand-bounce {
                animation: bounce 1s infinite;
            }

            .badge-btn {
                font-size: clamp(1rem, 5vw + 1rem, 3.75rem);
            }

            .badge-btn:hover .hand-bounce {
                animation-play-state: paused;
            }
            @keyframes sparkle-fly {
                0% {
                    opacity: 1;
                    transform: translate(0, 0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--tx), var(--ty)) scale(0);
                }
            }
            .sparkle {
                position: absolute;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: white;
                box-shadow: 0 0 5px 2px rgba(245, 158, 11, 0.6);
                pointer-events: none;
                z-index: 10;
                animation: sparkle-fly 0.6s ease-out forwards;
            }
        `,
    ],
    template: `
        <div class="relative inline-block w-full">
            <button
                type="button"
                class="badge-btn cursor-pointer w-full whitespace-nowrap rounded-3xl bg-gradient-to-r from-yellow-200 to-yellow-300 grow py-10 font-bold text-slate-900 shadow transition disabled:grayscale disabled:active:translate-y-0 text-6xl [&:not(:disabled)]:hover:shadow-lg [&:not(:disabled)]:active:translate-y-2 [&:not(:disabled)]:active:shadow-xl"
                (click)="badge.emit()"
                (mousemove)="onMouseMove($event)"
                (mouseleave)="sparkles.set([])"
            >
                <span class="mr-3 inline-block hand-bounce">👆</span>
                <span>{{ i18n.t("badge.button") }}</span>
            </button>
            @for (s of sparkles(); track s.id) {
                <div
                    class="sparkle"
                    [style.left.px]="s.x"
                    [style.top.px]="s.y"
                    [style.--tx.px]="s.tx"
                    [style.--ty.px]="s.ty"
                ></div>
            }
        </div>
    `,
})
export class BadgeageButtonComponent {
    protected readonly i18n = inject(I18nService);
    badge = output<void>();
    readonly sparkles = signal<Sparkle[]>([]);
    private sparkleId = 0;
    private lastSparkleTime = 0;

    onMouseMove(event: MouseEvent) {
        const button = event.currentTarget as HTMLButtonElement;
        if (button.disabled) return;
        const now = performance.now();
        if (now - this.lastSparkleTime < 60) return;
        this.lastSparkleTime = now;

        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 30;
        const id = this.sparkleId++;

        this.sparkles.update((s) => [
            ...s.slice(-15),
            { id, x, y, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist },
        ]);

        setTimeout(() => {
            this.sparkles.update((s) => s.filter((p) => p.id !== id));
        }, 600);
    }
}