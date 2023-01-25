import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AccountService } from "../../core/account.service";

@Component({
    selector: "app-account",
    standalone: true,
    imports: [FormsModule],
    template: `
        <div class="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h1 class="text-2xl font-bold">Compte</h1>
            <p class="text-gray-600">
                Pas de mot de passe. Ton identifiant est stocké dans ce navigateur. Garde-le
                précieusement, il est la seule clé de tes données.
            </p>

            @if (account.error()) {
                <div class="rounded bg-red-100 px-4 py-2 text-red-800">{{ account.error() }}</div>
            }

            <div class="flex flex-col gap-3 sm:flex-row">
                <button class="btn" [disabled]="account.loading()" (click)="account.create()">
                    @if (account.loading()) {
                        Création…
                    } @else {
                        Créer un compte
                    }
                </button>
            </div>

            <hr class="border-gray-200" />

            <div>
                <label class="block text-sm font-medium text-gray-700"
                    >Récupérer un compte existant</label
                >
                <div class="mt-1 flex gap-2">
                    <input
                        type="text"
                        class="input"
                        [(ngModel)]="recoverId"
                        placeholder="Colle ton identifiant"
                    />
                    <button class="btn" (click)="recover()">Récupérer</button>
                </div>
            </div>
        </div>
    `,
})
export class AccountComponent {
    recoverId = "";

    constructor(protected account: AccountService) {}

    recover(): void {
        this.account.recover(this.recoverId);
    }
}