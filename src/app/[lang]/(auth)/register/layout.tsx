import type { Metadata } from "next";

// The register page is a client component and can't export metadata itself; this
// segment layout carries its title + canonical.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "en" ? "Sign up" : "Créer un compte",
    alternates: { canonical: `/${lang}/register` },
  };
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
