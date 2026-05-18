export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  readingTime: string;
  excerpt: string;
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "brutal-reminder-and-accountability-that-sticks",
    title: "Why Brutal Reminder Works When Motivation Fails",
    description: "A simple accountability loop beats vague intention when you need real execution.",
    publishedAt: "2026-05-18",
    category: "Accountability",
    readingTime: "4 min read",
    excerpt:
      "If you want consistency, you need a tiny action, a clear follow-up, and a reminder that does not flatter you.",
    content: [
      "Motivation is unstable. Systems are not. That is the whole case for a product like Brutal Reminder.",
      "Most people already know what they should be doing. The problem is not a shortage of advice. The problem is that the next step stays vague enough to postpone.",
      "Brutal Reminder fixes that by forcing one concrete action into the foreground. Not the full goal. Not a new life plan. One visible move.",
      "The second half of the loop matters just as much as the first. A reminder that ends without a decision teaches nothing. A reminder that asks for Done, Not yet, or Snooze creates a clean answer.",
      "That answer is useful because it removes the fiction that progress is happening somewhere in the background. Either the step got done or it did not.",
      "This kind of accountability works best when the promise is deliberately small. The smaller the action, the harder it is to hide behind mood, complexity, or narrative.",
      "If you are trying to build consistency, the system should reward honesty first and intensity second. Brutal Reminder leans into that order on purpose.",
    ],
  },
  {
    slug: "building-in-public-with-100-tools",
    title: "Building in Public With 100 Tools",
    description: "How a small product studio can use public shipping to build trust and momentum.",
    publishedAt: "2026-05-17",
    category: "Building in Public",
    readingTime: "5 min read",
    excerpt:
      "The point of building in public is not noise. It is proof of execution, weekly learning, and visible momentum.",
    content: [
      "A public roadmap only works if the products keep shipping. Otherwise it becomes another content layer sitting on top of no execution.",
      "That is why 100 Tools is being built around narrow products with obvious outcomes. A downloader should download. A reminder tool should remind and capture a real answer.",
      "Shipping in public is useful because it creates evidence. Users can see what exists, what changed, and how fast the product responds to real problems.",
      "It also changes internal discipline. When the work is visible, you stop hiding behind draft polish and start caring more about whether the thing actually works.",
      "The danger is turning the whole process into theatre. Public shipping only helps when the posts are attached to real releases, real fixes, and real lessons.",
      "For a small studio, this approach compounds. Each tool teaches something about copy, onboarding, support, and production operations that feeds into the next release.",
      "Long term, the public archive becomes part roadmap and part trust signal. It tells future users that the site is not pretending to be larger than it is.",
    ],
  },
  {
    slug: "ai-tools-that-save-time-not-just-hype",
    title: "AI Tools That Save Time, Not Just Hype",
    description: "Practical AI tools earn their place by removing friction from real workflows.",
    publishedAt: "2026-05-16",
    category: "AI Tools",
    readingTime: "4 min read",
    excerpt:
      "The best AI tools disappear into the workflow and reduce time-to-done without adding a new learning curve.",
    content: [
      "Most users do not want more AI. They want less friction. That is a completely different product brief.",
      "An AI feature earns its place when it shortens the distance between intent and output. If it adds setup, ambiguity, or rework, the novelty wears off fast.",
      "The most useful AI tools are usually narrow. They help with extraction, cleanup, summarization, classification, or drafting inside a workflow that already exists.",
      "That narrowness is a strength. It keeps the user model simple and makes quality easier to evaluate in production.",
      "Trust also matters more than cleverness. If a tool saves three minutes but introduces doubt, people will stop using it the moment pressure rises.",
      "This is why product teams should ask a stricter question than “can AI do this?” They should ask “does AI make this step meaningfully faster, clearer, or safer?”",
      "If the answer is no, the right move is restraint. Not every task needs a model in the middle of it.",
    ],
  },
  {
    slug: "creator-workflow-and-the-power-of-small-steps",
    title: "Creator Workflow and the Power of Small Steps",
    description: "Momentum comes from making the next task obvious, not from waiting for a perfect plan.",
    publishedAt: "2026-05-15",
    category: "Productivity",
    readingTime: "4 min read",
    excerpt:
      "A creator workflow becomes easier when the next step is small enough to start immediately.",
    content: [
      "Creative work stalls when the next action is too big or too vague. That is usually where “I’ll do it later” starts.",
      "A better workflow does not begin with a bigger system. It begins with a smaller instruction. Open the file. Outline the draft. Ship the screenshot. Publish the changelog.",
      "Small-step planning turns overwhelm into execution because it reduces the emotional cost of starting. You no longer need a perfect block of time to make progress.",
      "This also improves prioritization. When the step is concrete, it becomes easier to see whether it is actually important or just emotionally satisfying busywork.",
      "For creators who are building repeatedly, this matters more than bursts of intensity. A workflow that survives ordinary days will outperform a workflow that only works during high motivation.",
      "That is the same idea behind Brutal Reminder: one goal, one move, one honest answer. The product does not try to manage your entire life. It just forces clarity around the next action.",
      "If you want more output, make starting cheaper and finishing more visible. Everything else is secondary.",
    ],
  },
  {
    slug: "productivity-without-another-complex-system",
    title: "Productivity Without Another Complex System",
    description: "Simple systems outperform complicated productivity stacks when the work needs to happen every day.",
    publishedAt: "2026-05-14",
    category: "Productivity",
    readingTime: "4 min read",
    excerpt:
      "A good productivity system should reduce decisions, not create a second job made of organising work.",
    content: [
      "A lot of productivity advice quietly turns into admin. You spend more time maintaining the system than moving the project forward.",
      "That is why simple systems tend to last longer. They ask less from the user and put less weight on perfect habits.",
      "The core questions are basic: what matters, what is the next step, and what is blocking action right now?",
      "If a tool cannot help answer those questions quickly, it probably does not belong in the daily workflow.",
      "This is also why tiny routines outperform heroic planning. A visible action repeated consistently is easier to trust than a weekly reset you keep postponing.",
      "Use tools that make action easier, not tools that make planning feel impressive. That distinction protects time and attention.",
    ],
  },
  {
    slug: "a-creator-workflow-that-keeps-shipping",
    title: "A Creator Workflow That Keeps Shipping",
    description: "A lightweight weekly rhythm can keep creators publishing without burning cycles on overhead.",
    publishedAt: "2026-05-13",
    category: "Creator Workflow",
    readingTime: "5 min read",
    excerpt:
      "The best workflow is the one that keeps output moving on ordinary weeks, not just on the ideal ones.",
    content: [
      "A creator workflow does not need to be elaborate to be effective. It needs a rhythm that survives distraction, deadlines, and low-energy days.",
      "One practical approach is simple: decide the weekly output, define the smallest shipping step, and review the result before starting the next cycle.",
      "This rhythm works because it keeps decision-making close to the work. You are never too far from the next publishable action.",
      "It also creates natural checkpoints. You can see where the process slips: idea selection, execution, packaging, or distribution.",
      "Once those weak points are visible, the right tool becomes easier to design or choose. Some weeks the answer is a template. Other weeks it is a reminder, a downloader, or a better publishing checklist.",
      "The larger point is that workflow quality is measured by shipped output. If the system looks smart but the work stays stuck, it is not a good workflow.",
      "Build your stack around continuity. The work should still move when the week is messy.",
    ],
  },
];

export function getAllBlogPosts() {
  return [...blogPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug) || null;
}
