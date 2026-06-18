import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Multi-Tenant Architecture",
    description: "Isolated stores with shared infrastructure. Each tenant gets their own storefront, domain, and admin panel — all on a single deployment.",
  },
  {
    title: "Product Management",
    description: "Full product lifecycle with variants, options, images, categories, and real-time inventory tracking across warehouses.",
  },
  {
    title: "Order Processing",
    description: "Complete order lifecycle from cart to fulfillment. Supports guest checkout, customer accounts, and order history.",
  },
  {
    title: "Subscription & Billing",
    description: "Recurring payment plans with Stripe integration. Usage-based billing, plan upgrades/downgrades, and payment history.",
  },
  {
    title: "Staff & Roles",
    description: "Granular permission system with staff accounts, roles, and API keys. Full audit logging for every action.",
  },
  {
    title: "Developer APIs",
    description: "RESTful API with rate limiting, webhooks for real-time events, and API key authentication for third-party integrations.",
  },
];

const techStack = [
  { name: "Next.js", category: "Framework" },
  { name: "React 19", category: "UI" },
  { name: "TypeScript", category: "Language" },
  { name: "Prisma", category: "ORM" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Tailwind CSS", category: "Styling" },
  { name: "Radix UI", category: "Components" },
  { name: "React Query", category: "Data Fetching" },
  { name: "Zod", category: "Validation" },
  { name: "Stripe", category: "Payments" },
  { name: "AWS S3", category: "Storage" },
];

const stats = [
  { label: "Models", value: "27" },
  { label: "API Routes", value: "40+" },
  { label: "Components", value: "100+" },
  { label: "Tenants", value: "Unlimited" },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              CC
            </div>
            <span className="text-lg font-semibold">CloudCommerce</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
        <Badge variant="info" size="lg" className="mb-6">
          Multi-Tenant E-Commerce Platform
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Ship stores at{" "}
          <span className="text-primary">cloud scale</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          CloudCommerce is an open-source, multi-tenant e-commerce platform built
          for SaaS providers, agencies, and enterprises that need to deploy and
          manage hundreds of stores from a single codebase.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg">Start Building</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">View Demo</Button>
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Everything you need to run stores</h2>
          <p className="mt-4 text-muted-foreground">
            Purpose-built features for multi-tenant commerce operations.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/40">
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Tech Stack</h2>
            <p className="mt-4 text-muted-foreground">
              Modern tools powering the platform.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {techStack.map((tech) => (
              <Badge key={tech.name} variant="secondary" size="lg" className="gap-2">
                <span className="text-xs text-muted-foreground">{tech.category}</span>
                {tech.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-foreground">Ready to deploy?</h2>
        <p className="mt-4 text-muted-foreground">
          Create an account and launch your first store in minutes.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg">Create Account</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} CloudCommerce</span>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hover:text-foreground">Sign In</Link>
            <Link href="/auth/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
