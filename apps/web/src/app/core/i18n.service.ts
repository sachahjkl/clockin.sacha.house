import { DOCUMENT } from "@angular/common";
import { Injectable, computed, effect, inject, signal } from "@angular/core";

export type Language = "fr" | "en";

const STORAGE_KEY = "clockin_language";

@Injectable({ providedIn: "root" })
export class I18nService {
    private readonly document = inject(DOCUMENT);
    readonly language = signal<Language>(this.readInitialLanguage());
    readonly dateLocale = computed(() => (this.language() === "fr" ? "fr-FR" : "en-US"));

    constructor() {
        effect(() => {
            const language = this.language();
            this.document.documentElement.lang = language;
            localStorage.setItem(STORAGE_KEY, language);
        });
    }

    setLanguage(language: Language): void {
        this.language.set(language);
    }

    t(key: TranslationKey): string {
        return translations[this.language()][key] ?? translations.fr[key] ?? key;
    }

    private readInitialLanguage(): Language {
        if (typeof localStorage !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "fr" || stored === "en") return stored;
        }

        if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en"))
            return "en";
        return "fr";
    }
}

const translations = {
    fr: {
        "app.home": "Accueil",
        "app.clockin": "Badgeage",
        "app.connect": "Accès",
        "app.history": "Historique",
        "app.logout": "Déconnexion",
        "app.account": "Compte",
        "app.about": "À propos",
        "app.legal": "Mentions légales",
        "app.privacy": "Confidentialité",
        "app.cookies": "Cookies",
        "app.help": "Aide",
        "app.language": "Langue",
        "app.french": "Français",
        "app.english": "English",
        "app.noData": "Aucun badgeage",
        "app.notFound": "Page introuvable",
        "app.backHome": "Retour à l'accueil",
        "errors.requestFailed": "La requête a échoué",
        "errors.unauthorized": "Non autorisé",
        "clockin.greeting": "Salut",
        "greeting.noEntry": "Au boulot",
        "greeting.firstEntryIn": "Travaille bien",
        "greeting.firstExitOut": "Bon appétit 😋",
        "greeting.secondEntryIn": "Bon aprem",
        "greeting.secondExitOut": "Fin de journée, rentre bien",
        "badge.button": "Badger",
        "copy.id": "ID",
        "copy.copied": "Copié !",
        "copy.title": "Cliquez pour copier l'identifiant",
        "table.summary": "Récapitulatif",
        "table.weekBadgeages": "Badgeages de la semaine",
        "table.day": "Jour",
        "table.firstEntry": "Entrée 1",
        "table.firstExit": "Sortie 1",
        "table.secondEntry": "Entrée 2",
        "table.secondExit": "Sortie 2",
        "table.total": "Total",
        "table.weekTotal": "Total semaine",
        "table.editTime": "Modifier l'heure",
        "table.noneThisWeek": "Aucun badgeage cette semaine",
        "history.exportTitle": "Exporter les badgeages",
        "history.exportHelp": "Choisis une période, puis exporte en CSV ou XLSX.",
        "history.period": "Période",
        "history.from": "Du",
        "history.to": "Au",
        "history.exportIso": "Dates ISO 8601",
        "history.exportCsv": "Export CSV",
        "history.exportXlsx": "Export XLSX",
        "history.exportPending": "Export en cours...",
        "history.invalidRange": "La date de début doit être antérieure ou égale à la date de fin.",
        "history.delete": "Supprimer",
        "preset.lastWeek": "7 derniers jours",
        "preset.lastMonth": "Dernier mois",
        "preset.last6Months": "6 derniers mois",
        "preset.lastYear": "Dernière année",
        "preset.all": "Tout",
        "preset.custom": "Personnalisé",
        "account.help": "Entre avec ton identifiant, ou ouvre un acces de demo en un clic.",
        "account.keepId": "Ton identifiant suffit pour revenir plus tard.",
        "account.access": "Accès",
        "account.createAccess": "Créer un nouvel accès",
        "account.creating": "Création...",
        "account.create": "Créer un compte",
        "account.tryDemo": "Essayer la démo",
        "account.recoverAccess": "Connexion à un compte existant",
        "account.pasteId": "Colle ton identifiant",
        "account.recover": "Se connecter",
        "account.recovering": "Vérification...",
        "account.pasteFromClipboard": "Coller depuis le presse-papier",
        "account.requiredId": "Colle ton identifiant pour récupérer le compte.",
        "account.unknown": "Aucun compte trouvé avec cet identifiant.",
        "account.manageHelp": "Gère ton identifiant et les données associées à ce compte.",
        "account.identifier": "Identifiant",
        "account.profileTitle": "Profil",
        "account.profileHelp":
            "Ces informations sont optionnelles. Le nom sert à personnaliser la page de badgeage.",
        "account.name": "Nom",
        "account.email": "E-mail",
        "account.namePlaceholder": "Ton nom",
        "account.emailPlaceholder": "toi@example.com",
        "account.saveProfile": "Enregistrer",
        "account.savingProfile": "Enregistrement...",
        "account.profileSaved": "Profil enregistré.",
        "account.deleteTitle": "Supprimer le compte",
        "account.deleteHelp":
            "Cette action supprime définitivement le compte et tous les badgeages associés. Elle est irréversible.",
        "account.deleteAction": "Supprimer mon compte",
        "account.deleting": "Suppression...",
        "account.deleteConfirm":
            "Supprimer définitivement ce compte et tous ses badgeages ? Cette action est irréversible.",
        "wizard.eyebrow": "Bienvenue",
        "wizard.step1Title": "Clock-in en 30 secondes",
        "wizard.step1Body":
            "L'application sert à pointer rapidement tes heures d'entrée et de sortie, puis à retrouver l'historique et les exports sans compte classique ni mot de passe.",
        "wizard.step2Title": "Ton identifiant est ta seule clé",
        "wizard.step2Body":
            "Ici, pas de mot de passe ni d'e-mail de récupération. Ton identifiant est indispensable pour revenir sur tes données depuis un autre navigateur ou après une déconnexion.",
        "wizard.idTitle": "Ton identifiant de connexion",
        "wizard.idHelp": "Sauvegarde-le maintenant. Sans lui, tu ne pourras pas te reconnecter.",
        "wizard.step3Title": "Le fonctionnement ensuite",
        "wizard.step3Body":
            "Une fois sur l'accueil, le gros bouton ajoute le prochain badgeage de la journée. Le tableau résume la semaine, et l'historique sert à vérifier puis exporter les données.",
        "wizard.tip1": "1. Badge depuis l'accueil pour enregistrer tes horaires.",
        "wizard.tip2": "2. Corrige une heure directement dans le tableau si besoin.",
        "wizard.tip3": "3. Exporte l'historique en CSV ou XLSX depuis l'écran Historique.",
        "wizard.previous": "Précédent",
        "wizard.close": "Fermer",
        "wizard.next": "Suivant",
        "wizard.start": "Commencer",
    },
    en: {
        "app.home": "Home",
        "app.clockin": "Clock in",
        "app.connect": "Access",
        "app.history": "History",
        "app.logout": "Log out",
        "app.account": "Account",
        "app.about": "About",
        "app.legal": "Legal notice",
        "app.privacy": "Privacy policy",
        "app.cookies": "Cookies",
        "app.help": "Help",
        "app.language": "Language",
        "app.french": "Français",
        "app.english": "English",
        "app.noData": "No time entries",
        "app.notFound": "Page not found",
        "app.backHome": "Back to home",
        "errors.requestFailed": "Request failed",
        "errors.unauthorized": "Unauthorized",
        "clockin.greeting": "Hi",
        "greeting.noEntry": "Let's get to work",
        "greeting.firstEntryIn": "Work well",
        "greeting.firstExitOut": "Enjoy your meal 😋",
        "greeting.secondEntryIn": "Good afternoon",
        "greeting.secondExitOut": "End of day, get home safe",
        "badge.button": "Clock in",
        "copy.id": "ID",
        "copy.copied": "Copied!",
        "copy.title": "Click to copy the identifier",
        "table.summary": "Summary",
        "table.weekBadgeages": "This week's time entries",
        "table.day": "Day",
        "table.firstEntry": "Entry 1",
        "table.firstExit": "Exit 1",
        "table.secondEntry": "Entry 2",
        "table.secondExit": "Exit 2",
        "table.total": "Total",
        "table.weekTotal": "Week total",
        "table.editTime": "Edit time",
        "table.noneThisWeek": "No time entries this week",
        "history.exportTitle": "Export time entries",
        "history.exportHelp": "Choose a period, then export as CSV or XLSX.",
        "history.period": "Period",
        "history.from": "From",
        "history.to": "To",
        "history.exportIso": "ISO 8601 dates",
        "history.exportCsv": "Export CSV",
        "history.exportXlsx": "Export XLSX",
        "history.exportPending": "Exporting...",
        "history.invalidRange": "The start date must be before or equal to the end date.",
        "history.delete": "Delete",
        "preset.lastWeek": "Last 7 days",
        "preset.lastMonth": "Last month",
        "preset.last6Months": "Last 6 months",
        "preset.lastYear": "Last year",
        "preset.all": "All",
        "preset.custom": "Custom",
        "account.help": "Sign in with your identifier, or open the demo access in one click.",
        "account.keepId": "Your identifier is enough to come back later.",
        "account.access": "Access",
        "account.createAccess": "Create a new access",
        "account.creating": "Creating...",
        "account.create": "Create account",
        "account.tryDemo": "Try the demo",
        "account.recoverAccess": "Sign in to an existing account",
        "account.pasteId": "Paste your identifier",
        "account.recover": "Sign in",
        "account.recovering": "Verifying...",
        "account.pasteFromClipboard": "Paste from clipboard",
        "account.requiredId": "Paste your identifier to recover the account.",
        "account.unknown": "No account found with this identifier.",
        "account.manageHelp": "Manage your identifier and the data associated with this account.",
        "account.identifier": "Identifier",
        "account.profileTitle": "Profile",
        "account.profileHelp":
            "These details are optional. The name is used to personalize the clock-in page.",
        "account.name": "Name",
        "account.email": "Email",
        "account.namePlaceholder": "Your name",
        "account.emailPlaceholder": "you@example.com",
        "account.saveProfile": "Save",
        "account.savingProfile": "Saving...",
        "account.profileSaved": "Profile saved.",
        "account.deleteTitle": "Delete account",
        "account.deleteHelp":
            "This permanently deletes the account and all associated time entries. This cannot be undone.",
        "account.deleteAction": "Delete my account",
        "account.deleting": "Deleting...",
        "account.deleteConfirm":
            "Permanently delete this account and all its time entries? This cannot be undone.",
        "wizard.eyebrow": "Welcome",
        "wizard.step1Title": "Clock-in in 30 seconds",
        "wizard.step1Body":
            "The app lets you quickly record entry and exit times, then find history and exports without a classic account or password.",
        "wizard.step2Title": "Your identifier is your only key",
        "wizard.step2Body":
            "There is no password or recovery email. Your identifier is required to get back to your data from another browser or after logging out.",
        "wizard.idTitle": "Your sign-in identifier",
        "wizard.idHelp": "Save it now. Without it, you will not be able to sign in again.",
        "wizard.step3Title": "How it works",
        "wizard.step3Body":
            "On the home page, the large button adds the next time entry for the day. The table summarizes the week, and history lets you review and export data.",
        "wizard.tip1": "1. Clock in from the home page to record your hours.",
        "wizard.tip2": "2. Edit a time directly in the table if needed.",
        "wizard.tip3": "3. Export history as CSV or XLSX from the History screen.",
        "wizard.previous": "Previous",
        "wizard.close": "Close",
        "wizard.next": "Next",
        "wizard.start": "Start",
    },
} as const;

export type TranslationKey = keyof typeof translations.fr;
