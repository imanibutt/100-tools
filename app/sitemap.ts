import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  const routes = [
    "/",
    "/about",
    "/blog",
    "/contact",
    "/bedownloader",
    "/behance-downloader",
    "/brutal-reminder",
    "/brutal-reminder/privacy",
    "/ats-cv-maker",
    "/humanpass",
    "/invoice-maker",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
  ];

  const routeEntries: MetadataRoute.Sitemap = routes.map((route, index) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority:
      index === 0
        ? 1
        : route.includes("brutal-reminder") ||
          route === "/bedownloader" ||
          route === "/ats-cv-maker" ||
          route === "/humanpass" ||
          route === "/invoice-maker"
        ? 0.9
        : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = getAllBlogPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...routeEntries, ...blogEntries];
}
