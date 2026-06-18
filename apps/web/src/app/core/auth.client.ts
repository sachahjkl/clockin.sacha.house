import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthClient {
    private readonly http = inject(HttpClient);

    createAccount(): Observable<{ userId: string }> {
        return this.http.post<{ userId: string }>("/auth/account", {});
    }

    verifyAccount(userId: string): Observable<void> {
        return this.http.post<void>("/auth/verify", { userId });
    }
}
