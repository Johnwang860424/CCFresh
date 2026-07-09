import { unstable_cache } from "next/cache";
import { sql } from "@/app/lib/db";
import { getPromoStrategy, type PromoConfig } from "@/app/lib/promotions";
import type { Product } from "@/types";

interface ProductRow {
  id: number;
  name: string;
  price: number;
  images: string[];
  category_id: number;
  spec: string | null;
  promo_type: string | null;
  promo_config: PromoConfig | null;
  description: string | null;
}

function toProduct(row: ProductRow): Product {
  const strategy = row.promo_type
    ? getPromoStrategy(row.promo_type)
    : undefined;
  const promoConfig = (row.promo_config as PromoConfig | null) ?? null;
  const promoSummary =
    strategy && promoConfig ? strategy.describe(promoConfig) : null;
  const images = row.images ?? [];
  return {
    id: String(row.id),
    name: row.name,
    weight: row.spec ?? "",
    price: row.price,
    images: images,
    badge: promoSummary,
    category: row.category_id ? String(row.category_id) : "",
    description: row.description ?? "",
    promo:
      strategy && promoConfig
        ? { type: row.promo_type as string, config: promoConfig }
        : null,
  };
}

export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const rows = (await sql`
      SELECT
        p.id,
        p.name,
        p.price,
        p.category_id,
        p.spec,
        p.promo_type,
        p.promo_config,
        p.description,
        COALESCE(
          (
            SELECT json_agg(pi.image_url ORDER BY pi.sort_order, pi.id)
            FROM product_images pi
            WHERE pi.product_id = p.id
          ),
          '[]'::json
        ) AS images
      FROM products p
      ORDER BY p.sort_order, p.id
    `) as ProductRow[];
    return rows.map(toProduct);
  },
  ["products"],
  { tags: ["products"] },
);
