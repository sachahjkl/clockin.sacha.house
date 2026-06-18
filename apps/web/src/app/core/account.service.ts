import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";

const STORAGE_KEY = "clockin_user_id";
const WELCOME_WIZARD_STORAGE_KEY = "clockin_pending_welcome_wizard";

@Injectable({
    providedIn: "root",
})
export class AccountService {
    private readonly router = inject(Router);
    readonly userId = signal<string | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly welcomeWizardOpen = signal(false);

    constructor() {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) this.userId.set(stored);
            this.welcomeWizardOpen.set(
                localStorage.getItem(WELCOME_WIZARD_STORAGE_KEY) === "1" && !!stored,
            );
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
            this.openWelcomeWizard();
            await this.router.navigate(["/clockin"]);
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
        this.router.navigate(["/clockin"]);
    }

    clear(): void {
        this.setUserId(null);
        this.welcomeWizardOpen.set(false);
        localStorage.removeItem(WELCOME_WIZARD_STORAGE_KEY);
    }

    dismissWelcomeWizard(): void {
        this.welcomeWizardOpen.set(false);
        localStorage.removeItem(WELCOME_WIZARD_STORAGE_KEY);
    }

    private openWelcomeWizard(): void {
        this.welcomeWizardOpen.set(true);
        localStorage.setItem(WELCOME_WIZARD_STORAGE_KEY, "1");
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