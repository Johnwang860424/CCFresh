import { unstable_cache } from "next/cache";
import { sql } from "@/app/lib/db";
import type { Category } from "@/types";

interface CategoryRow {
  id: number;
  name: string;
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const rows = (await sql`
      SELECT c.id, c.name
      FROM categories c
      ORDER BY c.id
    `) as CategoryRow[];
    return rows.map((c) => ({ key: String(c.id), name: c.name }));
  },
  ["categories"],
  { tags: ["categories"] },
);
