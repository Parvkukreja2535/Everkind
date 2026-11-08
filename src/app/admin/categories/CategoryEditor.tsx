"use client";

import { useActionState } from "react";
import { Field, FormMessage, Submit, TextArea, type FormState } from "@/components/forms";
import { saveCategoryAction } from "../actions";

export function CategoryEditor({ category }: { category?: { id: string; name: string; description: string; is_active: boolean; image_url: string | null } }) {
  const [state, action] = useActionState<FormState, FormData>(saveCategoryAction.bind(null, category?.id ?? null), {});
  return (
    <form action={action} className="grid gap-3" key={category ? "c" : state.ts ?? 0}>
      <FormMessage state={state} />
      <Field label="Name" name="name" defaultValue={category?.name} error={state.errors?.name} />
      <TextArea label="Description" name="description" rows={2} maxLength={600} defaultValue={category?.description} />
      <div><label className="label" htmlFor={`img-${category?.id ?? "new"}`}>Image (optional; otherwise the first service photo is used)</label><input id={`img-${category?.id ?? "new"}`} name="image_file" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-3 file:rounded-ctl file:border-0 file:bg-green-tint file:px-4 file:py-2 file:font-semibold file:text-green" /></div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex gap-2"><input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="accent-green" /> Active (shown on the website)</label>
        {category?.image_url && <label className="flex gap-2"><input type="checkbox" name="remove_image" className="accent-green" /> Remove custom image</label>}
      </div>
      <Submit className="btn-primary btn-sm justify-self-start" pending="Saving…">{category ? "Save category" : "Add category"}</Submit>
    </form>
  );
}
