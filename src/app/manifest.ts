import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CVisual",
    short_name: "CVisual",
    description:
      "Créez des CV professionnels, ATS-friendly et personnalisables",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#f7f4ee",
    orientation: "portrait-primary",
    categories: ["productivity", "utilities"],
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
