import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CC 生鮮",
    short_name: "CC 生鮮",
    description: "產地直達，鮮味直送。急凍真鮮冷鏈宅配。",
    start_url: "/",
    display: "standalone",
    // 色票須與 app/globals.css @theme 的 --color-brand-surface /
    // --color-brand-primary 同步（manifest 無法讀 CSS 變數）
    background_color: "#f9f9ff",
    theme_color: "#00102d",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        // maskable 版有 ~20% 安全區補邊，避免 Android 遮罩裁到 logo 邊緣
        src: "/pwa/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
