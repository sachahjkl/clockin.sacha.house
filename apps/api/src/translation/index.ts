import en from "./en.json" with { type: "json" };
import fr from "./fr.json" with { type: "json" };
import type { FastifyRequest } from "fastify";

export type Language = "fr" | "en";

interface TranslationTree {
    [key: string]: string | TranslationTree;
}

const translations: Record<Language, TranslationTree> = { en, fr };

export function localeFor(language: Language): string {
    return language === "fr" ? "fr-FR" : "en-US";
}

export function translate(language: Language, key: string): string {
    return resolve(translations[language], key) ?? resolve(translations.fr, key) ?? key;
}

export function languageFromRequest(request: FastifyRequest): Language {
    const header = request.headers["accept-language"];
    const value = Array.isArray(header) ? header[0] : header;
    return value?.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function translateRequest(request: FastifyRequest, key: string): string {
    return translate(languageFromRequest(request), key);
}

function resolve(tree: TranslationTree, key: string): string | undefined {
    let value: string | TranslationTree | undefined = tree;

    for (const segment of key.split(".")) {
        if (!value || typeof value === "string") return undefined;
        value = value[segment];
    }

    return typeof value === "string" ? value : undefined;
}