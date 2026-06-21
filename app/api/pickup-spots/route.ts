import { jsonHandler } from "@/app/lib/api";
import { getPickupSpots } from "@/app/lib/pickup-spots";

export const GET = jsonHandler(getPickupSpots);
