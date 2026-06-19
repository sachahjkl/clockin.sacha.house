import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "dist/web/browser");
const siteUrl = "https://clockin.sacha.house";
const lastmod = new Date().toISOString();

const routes = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/connect", changefreq: "weekly", priority: "0.9" },
    { path: "/legal", changefreq: "yearly", priority: "0.3" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/cookies", changefreq: "yearly", priority: "0.3" },
    { path: "/about", changefreq: "monthly", priority: "0.5" },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
    .map(
        (route) => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join("\n")}
</urlset>
`;

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "sitemap.xml"), xml, "utf8");
