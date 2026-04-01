export default function manifest() {
  return {
    name: "AHMAD Enterprises",
    short_name: "AHMAD",
    description: "Money remittance order management for AHMAD Enterprises",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c10",
    theme_color: "#0a0c10",
    orientation: "portrait",
    icons: [
      {
        src: "/Ahmad_logo.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/Ahmad_logo.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/Ahmad_logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
