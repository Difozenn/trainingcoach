import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tHeader = await getTranslations("Header");
  const tFooter = await getTranslations("Footer");

  return (
    <div className="dark min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="shrink-0">
              <defs>
                <linearGradient id="caveBgHeader" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="oklch(0.62 0.21 259)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.25 280)" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="7" fill="url(#caveBgHeader)" />
              <path d="M6 24L13 8l4 8 3-5 6 13H6z" fill="white" opacity="0.95" />
              <path d="M12 24c0-3 2-5.5 4.5-5.5S21 21 21 24H12z" fill="url(#caveBgHeader)" />
            </svg>
            <span className="text-xl font-bold">Paincave</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/tools"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Tools
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Blog
            </Link>
            <LanguageSwitcher />
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">{tHeader("signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{tHeader("getStarted")}</Link>
            </Button>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{tHeader("signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{tHeader("getStarted")}</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="shrink-0">
                  <defs>
                    <linearGradient id="caveBgFooter" x1="0" y1="0" x2="32" y2="32">
                      <stop offset="0%" stopColor="oklch(0.62 0.21 259)" />
                      <stop offset="100%" stopColor="oklch(0.55 0.25 280)" />
                    </linearGradient>
                  </defs>
                  <rect width="32" height="32" rx="7" fill="url(#caveBgFooter)" />
                  <path d="M6 24L13 8l4 8 3-5 6 13H6z" fill="white" opacity="0.95" />
                  <path d="M12 24c0-3 2-5.5 4.5-5.5S21 21 21 24H12z" fill="url(#caveBgFooter)" />
                </svg>
                <span className="font-bold">Paincave</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {tFooter("tagline")}
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">
                {tFooter("product")}
              </h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/tools" className="hover:text-foreground">
                  Tools
                </Link>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
                <Link href="/login" className="hover:text-foreground">
                  {tHeader("signIn")}
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">
                {tFooter("legal")}
              </h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-foreground">
                  {tFooter("privacyPolicy")}
                </Link>
                <Link href="/terms" className="hover:text-foreground">
                  {tFooter("termsOfService")}
                </Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            {tFooter("disclaimer")}
          </div>
        </div>
      </footer>
    </div>
  );
}
