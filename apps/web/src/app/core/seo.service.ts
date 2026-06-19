import { DOCUMENT } from "@angular/common";
import { Injectable, effect, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Meta, Title } from "@angular/platform-browser";
import { NavigationEnd, Router } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { I18nService, type Language, type TranslationKey } from "./i18n.service";

export interface SeoRouteData {
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    robots?: "index,follow" | "noindex,nofollow";
}

interface SeoState {
    path: string;
    seo: SeoRouteData | null;
}

const DEFAULT_ROBOTS = "index,follow";
const SITE_NAME = "Clock-in";
const DEFAULT_IMAGE_PATH = "/assets/hourglass.png";

@Injectable({ providedIn: "root" })
export class SeoService {
    private readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);
    private readonly i18n = inject(I18nService);
    private readonly state = toSignal(
        this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            startWith(null),
            map(() => this.readSeoState()),
        ),
        { initialValue: this.readSeoState() },
    );

    constructor() {
        effect(() => {
            const language = this.i18n.language();
            const state = this.state();
            this.applySeo(state, language);
        });
    }

    private applySeo(state: SeoState, language: Language): void {
        const seo = state.seo;
        if (!seo) return;

        const pageTitle = this.i18n.t(seo.titleKey);
        const description = this.i18n.t(seo.descriptionKey);
        const canonicalUrl = new URL(state.path, this.document.location.origin).toString();
        const imageUrl = new URL(DEFAULT_IMAGE_PATH, this.document.location.origin).toString();
        const locale = language === "fr" ? "fr_FR" : "en_US";
        const robots = seo.robots ?? DEFAULT_ROBOTS;
        const fullTitle = `${pageTitle} | ${SITE_NAME}`;

        this.title.setTitle(fullTitle);
        this.updateMeta("name", "description", description);
        this.updateMeta("name", "robots", robots);
        this.updateMeta("name", "application-name", SITE_NAME);
        this.updateMeta("name", "apple-mobile-web-app-title", SITE_NAME);
        this.updateMeta("property", "og:title", fullTitle);
        this.updateMeta("property", "og:description", description);
        this.updateMeta("property", "og:type", "website");
        this.updateMeta("property", "og:url", canonicalUrl);
        this.updateMeta("property", "og:site_name", SITE_NAME);
        this.updateMeta("property", "og:locale", locale);
        this.updateMeta("property", "og:image", imageUrl);
        this.updateMeta("name", "twitter:card", "summary_large_image");
        this.updateMeta("name", "twitter:title", fullTitle);
        this.updateMeta("name", "twitter:description", description);
        this.updateMeta("name", "twitter:image", imageUrl);
        this.updateCanonical(canonicalUrl);
    }

    private updateMeta(attribute: "name" | "property", key: string, content: string): void {
        this.meta.updateTag({ [attribute]: key, content });
    }

    private updateCanonical(url: string): void {
        let link = this.document.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
        if (!link) {
            link = this.document.createElement("link");
            link.rel = "canonical";
            this.document.head.appendChild(link);
        }
        link.href = url;
    }

    private readSeoState(): SeoState {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) {
            route = route.firstChild;
        }

        return {
            path: this.router.url.split("?")[0] ?? "/",
            seo: (route.data["seo"] as SeoRouteData | undefined) ?? null,
        };
    }
}
