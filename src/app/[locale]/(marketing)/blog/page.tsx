import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog — Endurance Training Science",
  description:
    "In-depth articles on cycling training, running, swimming, nutrition, and sports science. Written for athletes who want to understand their training.",
};

const posts = [
  {
    slug: "what-is-ftp",
    title: "What is FTP? The Complete Guide for Cyclists",
    excerpt:
      "Functional Threshold Power explained — what it is, how to test it, and why it matters for your training zones, TSS, and performance tracking.",
    category: "Cycling",
    date: "2026-03-07",
    readTime: "8 min",
  },
  {
    slug: "ctl-atl-tsb-explained",
    title: "CTL, ATL & TSB: Understanding Training Load",
    excerpt:
      "The Performance Management Chart demystified. Learn how Chronic Training Load, Acute Training Load, and Training Stress Balance guide your training.",
    category: "Training Science",
    date: "2026-03-07",
    readTime: "10 min",
  },
  {
    slug: "cycling-power-zones",
    title: "Coggan Power Zones: The 7-Zone Model Explained",
    excerpt:
      "A deep dive into each of the 7 Coggan power zones — what they train, how long to ride in them, and how to structure your workouts.",
    category: "Cycling",
    date: "2026-03-07",
    readTime: "9 min",
  },
  {
    slug: "how-to-increase-ftp",
    title: "How to Increase Your FTP: A Science-Backed Plan",
    excerpt:
      "Practical strategies to raise your Functional Threshold Power. Structured intervals, periodization, and the training principles that actually work.",
    category: "Training Plans",
    date: "2026-03-07",
    readTime: "12 min",
  },
  {
    slug: "base-training-cycling",
    title: "Base Training Done Right: Build Your Aerobic Engine",
    excerpt:
      "Why zone 2 training matters, how long your base phase should be, and the common mistakes that hold cyclists back.",
    category: "Training Science",
    date: "2026-03-07",
    readTime: "7 min",
  },
];

export default function BlogPage() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Training Science Blog
          </h1>
          <p className="mt-3 text-muted-foreground">
            In-depth articles on endurance training, nutrition, and sports
            science. No fluff — just peer-reviewed research applied to your
            training.
          </p>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}` as "/blog/what-is-ftp"}
              className="group block"
            >
              <Card className="border-border/50 transition-colors group-hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    <span>{post.readTime} read</span>
                    <span>&middot;</span>
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
