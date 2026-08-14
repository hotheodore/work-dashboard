import type { MetadataRoute } from "next";

/** Makes "Add to Home Screen" produce a standalone app window with the right
 *  name and icon on Android; iOS reads the name and display mode from here too,
 *  but takes its icon from app/apple-icon.png. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workbench",
    short_name: "Workbench",
    description: "Coursework and internship command center",
    start_url: "/",
    display: "standalone",
    background_color: "#1f1e1d",
    theme_color: "#1f1e1d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
