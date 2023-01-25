import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";

const STORAGE_KEY = "clockin_user_id";

@Injectable({
    providedIn: "root",
})
export class AccountService {
    readonly userId = signal<string | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    constructor(private router: Router) {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) this.userId.set(stored);
        }
    }

    async create(): Promise<boolean> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const res = await fetch("/api/auth/account", { method: "POST" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({ error: "Failed" }));
                throw new Error(body.error ?? "Failed");
            }
            const data = (await res.json()) as { userId: string };
            this.setUserId(data.userId);
            await this.router.navigate(["/"]);
            return true;
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : "Failed");
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    recover(id: string): void {
        if (!id.trim()) return;
        this.setUserId(id.trim());
        this.router.navigate(["/"]);
    }

    clear(): void {
        this.setUserId(null);
    }

    private setUserId(id: string | null): void {
        this.userId.set(id);
        if (id === null) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, id);
        }
    }
}