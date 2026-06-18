import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import type { User } from "./models";

@Injectable({ providedIn: "root" })
export class ProfileClient {
    private readonly http = inject(HttpClient);

    load(): Observable<User> {
        return this.http.get<User>("/me");
    }

    update(profile: { name: string; email: string }): Observable<User> {
        return this.http.patch<User>("/me", profile);
    }

    delete(): Observable<void> {
        return this.http.delete<void>("/me");
    }
}
