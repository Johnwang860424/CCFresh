import { jsonHandler } from "@/app/lib/api";
import { getProducts } from "@/app/lib/products";

export const GET = jsonHandler(getProducts);
