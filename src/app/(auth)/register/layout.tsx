import type { Metadata } from "next";

// The register page is a client component and can't export metadata itself; this
// segment layout carries its title + canonical.
export const metadata: Metadata = {
  title: "Créer un compte",
  alternates: { canonical: "/register" },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
