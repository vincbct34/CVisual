import type { Metadata } from "next";

// The login page is a client component and can't export metadata itself; this
// segment layout carries its title + canonical.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "en" ? "Log in" : "Connexion",
    alternates: { canonical: `/${lang}/login` },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
