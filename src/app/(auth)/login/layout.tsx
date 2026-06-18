import type { Metadata } from "next";

// The login page is a client component and can't export metadata itself; this
// segment layout carries its title + canonical.
export const metadata: Metadata = {
  title: "Connexion",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
