import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-card">
      <div className="blog-card-meta">
        <span>{post.category}</span>
        <span>{post.readingTime}</span>
      </div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <Link href={`/blog/${post.slug}`} className="blog-card-link">
        Read article
      </Link>
    </article>
  );
}

