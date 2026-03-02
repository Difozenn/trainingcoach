import Link from "next/link";
import { Bike } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Bike className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PainCave</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            <Button variant="outline" size="sm" asChild><Link href="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link href="/register">Get Started</Link></Button>
          </nav>
          <Button size="sm" asChild className="md:hidden"><Link href="/register">Get Started</Link></Button>
        </div>
      </header>
      {children}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bike className="h-5 w-5 text-primary" />
                <span className="font-bold">PainCave</span>
              </div>
              <p className="text-sm text-muted-foreground">Science-backed endurance training for cyclists, runners, and swimmers.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Product</h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
                <Link href="/login" className="hover:text-foreground">Sign in</Link>
              </nav>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Legal</h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            Not medical or dietary advice. Consult a healthcare professional before starting any training program.
          </div>
        </div>
      </footer>
    </div>
  );
}
