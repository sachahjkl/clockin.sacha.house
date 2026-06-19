import { Injectable, signal } from "@angular/core";

type ToastKind = "success" | "error";

export interface ToastItem {
    id: number;
    message: string;
    kind: ToastKind;
}

const TOAST_DURATION_MS = 3200;

@Injectable({ providedIn: "root" })
export class ToastService {
    readonly toasts = signal<ToastItem[]>([]);
    private nextId = 0;

    success(message: string): void {
        this.show(message, "success");
    }

    error(message: string): void {
        this.show(message, "error");
    }

    dismiss(id: number): void {
        this.toasts.update((items) => items.filter((item) => item.id !== id));
    }

    private show(message: string, kind: ToastKind): void {
        const id = this.nextId++;
        this.toasts.update((items) => [...items, { id, message, kind }]);
        setTimeout(() => this.dismiss(id), TOAST_DURATION_MS);
    }
}
