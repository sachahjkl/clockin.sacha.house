import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { I18nService } from "./i18n.service";

const STORAGE_KEY = "clockin_user_id";
const WELCOME_WIZARD_STORAGE_KEY = "clockin_pending_welcome_wizard";

@Injectable({
    providedIn: "root",
})
export class AccountService {
    private readonly router = inject(Router);
    private readonly i18n = inject(I18nService);
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
            this.router.navigate(["/clockin"]);
            return true;
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : "Failed");
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    async recover(id: string): Promise<void> {
        if (!id.trim()) return;
        this.loading.set(true);
        this.error.set(null);
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id.trim() }),
            });
            if (res.status === 404) {
                this.error.set(this.i18n.t("account.unknown"));
                return;
            }
            if (!res.ok) {
                this.error.set(this.i18n.t("errors.requestFailed"));
                return;
            }
            this.setUserId(id.trim());
            this.router.navigate(["/clockin"]);
        } catch {
            this.error.set(this.i18n.t("errors.requestFailed"));
        } finally {
            this.loading.set(false);
        }
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