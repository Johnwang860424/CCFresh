import { unstable_cache } from "next/cache";
import { sql } from "@/app/lib/db";
import type { PickupSpot } from "@/types";

interface PickupSpotRow {
  city: string;
  township: string;
}

export const getPickupSpots = unstable_cache(
  async (): Promise<PickupSpot[]> => {
    const rows = (await sql`
      SELECT city, township
      FROM pickup_spots
      ORDER BY city, sort_order, id
    `) as PickupSpotRow[];
    return rows.map((r) => ({ city: r.city, township: r.township }));
  },
  ["pickup-spots"],
  { tags: ["pickup-spots"] },
);
