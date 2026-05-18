import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog-card";
import { SiteShell } from "@/components/site-shell";
import { getAllBlogPosts, getBlogPost } from "@/lib/blog";

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const currentPost = post;
  const relatedPosts = getAllBlogPosts()
    .filter((item) => item.slug !== post.slug)
    .slice(0, 2);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    articleSection: currentPost.category,
    author: {
      "@type": "Organization",
      name: "100 Tools",
    },
  };

  return (
    <SiteShell compact>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <article className="article-page">
        <Link href="/blog" className="article-back">
          Back to blog
        </Link>
        <p className="site-kicker">{currentPost.category}</p>
        <h1>{currentPost.title}</h1>
        <p className="article-meta">
          {currentPost.publishedAt} · {currentPost.readingTime}
        </p>
        <p className="article-intro">{currentPost.description}</p>

        <div className="article-body">
          {currentPost.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <section className="site-section site-section-tight">
        <div className="section-copy">
          <p className="site-kicker">Related reading</p>
          <h2>More notes from the 100 Tools roadmap</h2>
        </div>
        <div className="blog-grid">
          {relatedPosts.map((relatedPost) => (
            <BlogCard key={relatedPost.slug} post={relatedPost} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
