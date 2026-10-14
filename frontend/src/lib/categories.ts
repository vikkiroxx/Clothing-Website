import { api } from "@/lib/api";
import { Audience, Category } from "@/types";

export async function getCategories(audience?: Audience): Promise<Category[]> {
  try {
    return await api.get<Category[]>(`/categories${audience ? `?audience=${audience}` : ""}`);
  } catch {
    return [];
  }
}
