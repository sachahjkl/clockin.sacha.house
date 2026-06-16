import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AccountService } from "./account.service";

const API_BASE = "/api";

@Injectable({
    providedIn: "root",
})
export class ApiService {
    constructor(
        private account: AccountService,
        private router: Router,
    ) {}

    private headers(): Record<string, string> {
        const userId = this.account.userId();
        const h: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (userId) {
            h["Authorization"] = `Bearer ${userId}`;
        }
        return h;
    }

    async get<T>(path: string): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
        return this.handle<T>(res);
    }

    async post<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify(body),
        });
        return this.handle<T>(res);
    }

    async patch<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: "PATCH",
            headers: this.headers(),
            body: JSON.stringify(body),
        });
        return this.handle<T>(res);
    }

    async delete(path: string): Promise<void> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: "DELETE",
            headers: this.headers(),
        });
        return this.handle<void>(res);
    }

	async getBlob(path: string): Promise<Blob> {
		const res = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
		return this.handleBlob(res);
	}

    private async handle<T>(res: Response): Promise<T> {
        if (res.status === 401) {
            this.account.clear();
            await this.router.navigate(["/account"]);
            throw new Error("Unauthorized");
        }
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Request failed" }));
            throw new Error(err.error ?? "Request failed");
        }
        if (res.status === 204) {
            return undefined as T;
        }
        return res.json() as Promise<T>;
    }

	private async handleBlob(res: Response): Promise<Blob> {
		if (res.status === 401) {
			this.account.clear();
			await this.router.navigate(["/account"]);
			throw new Error("Unauthorized");
		}
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: "Request failed" }));
			throw new Error(err.error ?? "Request failed");
		}
		return res.blob();
	}
}
