import { Component, inject } from "@angular/core";
import { ToastService } from "../core/toast.service";

@Component({
    selector: "app-toast-stack",
    standalone: true,
    styles: [
        `
            .toast-shell-enter {
                animation: toast-shell-enter 220ms ease-out;
                transform-origin: bottom center;
            }

            .toast-shell-leave {
                animation: toast-shell-leave 180ms ease-in forwards;
                transform-origin: bottom center;
            }

            .toast-card {
                will-change: transform, opacity;
            }

            .toast-enter {
                animation: toast-enter 220ms ease-out;
            }

            .toast-leave {
                animation: toast-leave 160ms ease-in forwards;
            }

            @keyframes toast-shell-enter {
                from {
                    opacity: 0;
                    margin-top: -0.5rem;
                }
                to {
                    opacity: 1;
                    margin-top: 0;
                }
            }

            @keyframes toast-shell-leave {
                from {
                    opacity: 1;
                    margin-top: 0;
                }
                to {
                    opacity: 0;
                    margin-top: -0.5rem;
                }
            }

            @keyframes toast-enter {
                from {
                    opacity: 0;
                    transform: translateY(16px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes toast-leave {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(10px);
                }
            }
        `,
    ],
    template: `
        <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
            <div class="flex w-full max-w-xl flex-col gap-2">
                @for (toast of toastService.toasts(); track toast.id) {
                    <div
                        animate.enter="toast-shell-enter"
                        animate.leave="toast-shell-leave"
                        class="pointer-events-none"
                    >
                        <div
                            animate.enter="toast-enter"
                            animate.leave="toast-leave"
                            class="toast-card pointer-events-auto rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ring-1"
                            [class.bg-emerald-600/95]="toast.kind === 'success'"
                            [class.ring-emerald-400/40]="toast.kind === 'success'"
                            [class.bg-rose-600/95]="toast.kind === 'error'"
                            [class.ring-rose-300/40]="toast.kind === 'error'"
                        >
                            <div class="flex items-start gap-3">
                                <p class="min-w-0 flex-1">{{ toast.message }}</p>
                                <button
                                    type="button"
                                    class="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold opacity-80 transition hover:bg-white/10 hover:opacity-100"
                                    (click)="toastService.dismiss(toast.id)"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    `,
})
export class ToastStackComponent {
    protected readonly toastService = inject(ToastService);
}
