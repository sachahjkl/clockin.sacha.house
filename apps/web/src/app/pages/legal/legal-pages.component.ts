import { Component, inject } from "@angular/core";
import { I18nService } from "../../core/i18n.service";

const CONTACT_EMAIL = "sacha@sacha.house";

@Component({
    selector: "app-legal-page",
    standalone: true,
    template: `
        <article
            class="max-w-none space-y-4 text-slate-700 [&_a]:text-sky-700 [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:pt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900"
        >
            <h1>{{ i18n.t("app.legal") }}</h1>
            @if (i18n.language() === "fr") {
                <p>
                    Ce site est une application personnelle de suivi de pointages appelée Clock-in.
                </p>
                <h2>Contact</h2>
                <p>
                    Pour toute demande, écrivez à <a [href]="mailto">{{ contactEmail }}</a
                    >.
                </p>
                <h2>Hébergement</h2>
                <p>
                    Les informations d'hébergement peuvent varier selon l'environnement de
                    déploiement. Contactez l'adresse ci-dessus pour toute demande relative au
                    service.
                </p>
                <h2>Responsabilité</h2>
                <p>
                    L'application est fournie pour faciliter le suivi des heures. L'utilisateur
                    reste responsable de vérifier l'exactitude de ses exports et de ses données.
                </p>
            } @else {
                <p>This website is a personal time tracking application called Clock-in.</p>
                <h2>Contact</h2>
                <p>
                    For any request, email <a [href]="mailto">{{ contactEmail }}</a
                    >.
                </p>
                <h2>Hosting</h2>
                <p>
                    Hosting information may vary depending on the deployment environment. Contact
                    the address above for any service-related request.
                </p>
                <h2>Liability</h2>
                <p>
                    The application is provided to help track working time. Users remain responsible
                    for checking the accuracy of their exports and data.
                </p>
            }
        </article>
    `,
})
export class LegalPageComponent {
    protected readonly i18n = inject(I18nService);
    protected readonly contactEmail = CONTACT_EMAIL;
    protected readonly mailto = `mailto:${CONTACT_EMAIL}`;
}

@Component({
    selector: "app-privacy-page",
    standalone: true,
    template: `
        <article
            class="max-w-none space-y-4 text-slate-700 [&_a]:text-sky-700 [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:pt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900"
        >
            <h1>{{ i18n.t("app.privacy") }}</h1>
            @if (i18n.language() === "fr") {
                <p>
                    Clock-in traite uniquement les données nécessaires au fonctionnement du service.
                </p>
                <h2>Données traitées</h2>
                <p>
                    L'application peut conserver un identifiant de compte, les dates de pointage,
                    les heures d'entrée/sortie et les données techniques nécessaires aux requêtes.
                </p>
                <h2>Finalité</h2>
                <p>
                    Ces données servent à afficher l'historique, calculer les totaux et générer les
                    exports CSV/XLSX.
                </p>
                <h2>Conservation</h2>
                <p>
                    Les données restent associées à l'identifiant utilisateur jusqu'à suppression
                    technique ou demande de suppression.
                </p>
                <h2>Vos droits</h2>
                <p>
                    Pour toute demande d'accès, rectification ou suppression, contactez
                    <a [href]="mailto">{{ contactEmail }}</a
                    >.
                </p>
            } @else {
                <p>Clock-in processes only the data required to operate the service.</p>
                <h2>Processed data</h2>
                <p>
                    The application may store an account identifier, clock-in dates, entry/exit
                    times and technical data required for requests.
                </p>
                <h2>Purpose</h2>
                <p>
                    This data is used to display history, compute totals and generate CSV/XLSX
                    exports.
                </p>
                <h2>Retention</h2>
                <p>
                    Data remains linked to the user identifier until technical deletion or a
                    deletion request.
                </p>
                <h2>Your rights</h2>
                <p>
                    For any access, correction or deletion request, contact
                    <a [href]="mailto">{{ contactEmail }}</a
                    >.
                </p>
            }
        </article>
    `,
})
export class PrivacyPageComponent {
    protected readonly i18n = inject(I18nService);
    protected readonly contactEmail = CONTACT_EMAIL;
    protected readonly mailto = `mailto:${CONTACT_EMAIL}`;
}

@Component({
    selector: "app-cookies-page",
    standalone: true,
    template: `
        <article
            class="max-w-none space-y-4 text-slate-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:pt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900"
        >
            <h1>{{ i18n.t("app.cookies") }}</h1>
            @if (i18n.language() === "fr") {
                <p>Clock-in n'utilise pas de cookies publicitaires ou de suivi tiers.</p>
                <h2>Stockage local</h2>
                <p>
                    L'application utilise le stockage local du navigateur pour conserver
                    l'identifiant de compte et la langue choisie.
                </p>
                <h2>Suppression</h2>
                <p>
                    Vous pouvez effacer ces informations depuis les paramètres de votre navigateur
                    ou en vous déconnectant pour l'identifiant.
                </p>
            } @else {
                <p>Clock-in does not use advertising cookies or third-party tracking cookies.</p>
                <h2>Local storage</h2>
                <p>
                    The application uses browser local storage to keep the account identifier and
                    selected language.
                </p>
                <h2>Deletion</h2>
                <p>
                    You can clear this information from your browser settings, or log out to remove
                    the identifier.
                </p>
            }
        </article>
    `,
})
export class CookiesPageComponent {
    protected readonly i18n = inject(I18nService);
}

@Component({
    selector: "app-about-page",
    standalone: true,
    template: `
        <article
            class="max-w-none space-y-4 text-slate-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900"
        >
            <h1>{{ i18n.t("app.about") }}</h1>
            @if (i18n.language() === "fr") {
                <p>
                    Clock-in est une petite application de pointage pensée pour enregistrer
                    rapidement les entrées et sorties, corriger les horaires et exporter un
                    historique.
                </p>
                <p>
                    Le fonctionnement repose sur un identifiant unique plutôt qu'un mot de passe. Il
                    doit donc être sauvegardé avec soin.
                </p>
            } @else {
                <p>
                    Clock-in is a small time tracking app designed to quickly record entries and
                    exits, edit times and export history.
                </p>
                <p>
                    It uses a unique identifier instead of a password, so it must be saved
                    carefully.
                </p>
            }
        </article>
    `,
})
export class AboutPageComponent {
    protected readonly i18n = inject(I18nService);
}
