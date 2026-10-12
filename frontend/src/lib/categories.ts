import { api } from "@/lib/api";
import { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  try {
    return await api.get<Category[]>("/categories");
  } catch {
    return [];
  }
}
