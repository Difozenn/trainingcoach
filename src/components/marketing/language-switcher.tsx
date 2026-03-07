"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe } from "lucide-react";

const labels: Record<string, string> = {
  en: "EN",
  nl: "NL",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.replace(pathname, { locale: e.target.value });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={locale}
        onChange={onChange}
        className="cursor-pointer border-none bg-transparent text-sm text-muted-foreground outline-none hover:text-foreground"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="bg-background text-foreground">
            {labels[l]}
          </option>
        ))}
      </select>
    </div>
  );
}
