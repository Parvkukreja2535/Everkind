import "server-only";
import { cache } from "react";
import { CATEGORIES, INSTANT_CLEAN_HOURS, SERVICES, type Availability, type Category, type PriceType, type Service, type Workforce } from "./catalogue";
import { DURATION_MINUTES } from "./booking";
import { supabaseConfigured } from "./supabase/config";
import { supabaseServer } from "./supabase/server";

// Reads the live catalogue from the database (managed in the admin dashboard). If the
// database isn't connected yet, falls back to the built-in catalogue so the site still works.

export interface Catalogue {
  categories: Category[];
  services: Service[]; // listed services only (flat-pack is an option of Furniture assembly)
  live: boolean; // true when read from the database
}

type CategoryRow = { id: string; slug: string; name: string; workbook_name: string | null; description: string; image_url: string | null; sort_order: number; is_active: boolean };
type OptionRow = { id: string; slug: string; name: string; description: string; workbook_row: number | null; price_type: PriceType; price_pence: number; price_note: string; min_hours: number | null; sort_order: number; is_active: boolean };
type ServiceRow = {
  id: string; slug: string; category_id: string; name: string; summary: string; included: string[]; excluded: string[]; checks: string; image_url: string;
  availability: Availability; workforce: Workforce; workbook_row: number | null; workbook_phase: string | null; everkind_addition: boolean; keywords: string[];
  price_type: PriceType; price_pence: number | null; price_note: string; extra_hour_pence: number | null; min_hours: number | null; hours_options: number[] | null;
  duration_minutes: number; sort_order: number; is_active: boolean; compliance_approved: boolean; service_options: OptionRow[];
};

export const SERVICE_SELECT = "*, service_options(*)";

export function mapCategory(c: CategoryRow): Category {
  return { id: c.id, slug: c.slug, name: c.name, workbookName: c.workbook_name ?? c.name, description: c.description, imageUrl: c.image_url, isActive: c.is_active, sortOrder: c.sort_order };
}

export function mapService(r: ServiceRow, categories: Category[]): Service {
  const cat = categories.find((c) => c.id === r.category_id);
  const options = (r.service_options ?? []).filter((o) => o.is_active).sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: r.id, slug: r.slug, category: cat?.slug ?? "", categoryName: cat?.name, name: r.name, availability: r.availability, workforce: r.workforce,
    workbookRow: r.workbook_row ?? 0, workbookPhase: r.workbook_phase ?? "", pricePence: r.price_pence, priceType: r.price_type, priceNote: r.price_note,
    summary: r.summary, included: r.included ?? [], excluded: r.excluded ?? [], checks: r.checks, image: r.image_url, everkindAddition: r.everkind_addition,
    keywords: r.keywords ?? [], minHours: r.min_hours == null ? null : Number(r.min_hours), hoursOptions: r.hours_options?.map(Number) ?? null,
    extraHourPence: r.extra_hour_pence, durationMinutes: r.duration_minutes, sortOrder: r.sort_order, isActive: r.is_active, complianceApproved: r.compliance_approved,
    options: options.length
      ? options.map((o) => ({ id: o.id, slug: o.slug, name: o.name, description: o.description, workbookRow: o.workbook_row ?? 0, pricePence: o.price_pence, priceType: o.price_type, priceNote: o.price_note, minHours: o.min_hours == null ? null : Number(o.min_hours) }))
      : undefined,
  };
}

function staticCatalogue(): Catalogue {
  const services = SERVICES.filter((s) => !s.optionOf).map((s, i) => ({
    ...s,
    categoryName: CATEGORIES.find((c) => c.slug === s.category)?.name,
    minHours: s.slug === "instant-clean" ? 1 : s.slug === "regular-domestic-cleaning" ? 2 : s.options || s.priceType === "hourly" ? 1 : null,
    hoursOptions: s.slug === "instant-clean" ? INSTANT_CLEAN_HOURS : s.options ? [1, 2, 3, 4] : null,
    durationMinutes: DURATION_MINUTES[s.slug] ?? 60,
    sortOrder: i * 10,
    isActive: true,
    options: s.options?.map((o) => ({ ...o, minHours: o.priceType === "hourly" ? 1 : null })),
  }));
  return { categories: CATEGORIES.map((c, i) => ({ ...c, isActive: true, sortOrder: i * 10 })), services, live: false };
}

/** Public catalogue: only active categories and services (RLS also enforces this). Cached per request. */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  if (!supabaseConfigured) return staticCatalogue();
  const supabase = await supabaseServer();
  if (!supabase) return staticCatalogue();
  const [cats, svcs] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("services").select(SERVICE_SELECT).eq("is_active", true).is("archived_at", null).order("sort_order"),
  ]);
  if (cats.error || svcs.error || !cats.data?.length) {
    // Tables missing (migration not run yet) or a temporary error: keep the site working.
    return staticCatalogue();
  }
  const categories = (cats.data as CategoryRow[]).map(mapCategory);
  const services = (svcs.data as ServiceRow[]).map((r) => mapService(r, categories)).filter((s) => s.category);
  return { categories, services, live: true };
});

export async function getServiceBySlug(slug: string) {
  const { services } = await getCatalogue();
  return services.find((s) => s.slug === slug);
}

export async function getCategoryBySlug(slug: string) {
  const { categories } = await getCatalogue();
  return categories.find((c) => c.slug === slug);
}
