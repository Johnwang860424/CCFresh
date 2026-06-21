import { jsonHandler } from "@/app/lib/api";
import { getCategories } from "@/app/lib/categories";

export const GET = jsonHandler(getCategories);
