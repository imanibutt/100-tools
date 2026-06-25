import type { Metadata } from "next";
import { BlogCard } from "@/components/blog-card";
import { SiteShell } from "@/components/site-shell";
import { getAllBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical notes on productivity, accountability, AI tools, creator workflow, and building 100 Tools in public.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "100 Tools Blog",
    description:
      "Practical notes on productivity, accountability, AI tools, creator workflow, and building 100 Tools in public.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <SiteShell compact>
      <section className="doc-hero doc-hero--centered">
        <span className="section-eyebrow">Blog</span>
        <h1 className="doc-hero-title">Notes from shipping tools in public</h1>
        <p className="doc-hero-lede">
          Accountability, creator workflow, AI tools, and what 100 Tools is learning as the
          product catalogue expands.
        </p>
      </section>

      <section className="blog-grid blog-grid-full">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </section>
    </SiteShell>
  );
}

