"use client";

import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { forwardRef, useMemo, type ComponentProps } from "react";
import { useLocale } from "./language-provider";
import { defaultLocale, withLocale, stripLocale } from "@/lib/i18n/config";

export { withLocale, stripLocale };

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Drop-in replacement for `next/link` that prefixes internal hrefs with the
 * active locale, so navigation stays within `/fr/…` or `/en/…`.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, ...props },
  ref,
) {
  const locale = useLocale();
  const localizedHref =
    typeof href === "string" ? withLocale(href, locale) : href;
  return <NextLink ref={ref} href={localizedHref} {...props} />;
});

/**
 * Locale-aware wrapper around `next/navigation`'s router — `push`/`replace`
 * prefix internal paths with the active locale.
 */
export function useLocalizedRouter() {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) =>
        router.push(withLocale(href, locale), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(withLocale(href, locale), options),
    }),
    [router, locale],
  );
}

export { defaultLocale };
