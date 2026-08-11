import { z } from "zod";
import type { OrganizationCreateRequest, OrganizationSettings } from "@/types/api";

/**
 * Zod mirror of the `POST /organizations` request body (forms-design §2).
 * Field names/types/limits follow the backend Pydantic model
 * (`OrganizationCreate`: name ≤255, slug ≤100 alphanumeric+hyphens,
 * settings JSONB). The backend remains authoritative.
 */

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export const slugSchema = z
  .string()
  .trim()
  .min(2, { message: "Slug must be at least 2 characters." })
  .max(100, { message: "Slug must be 100 characters or fewer." })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Use lowercase letters, numbers and hyphens (no spaces).",
  });

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Enter an organization name." })
    .max(255, { message: "Name must be 255 characters or fewer." }),
  slug: slugSchema,
  settings: z.object({
    branding: z.object({
      primary_color: z
        .string()
        .regex(HEX_COLOR_PATTERN, { message: "Enter a hex color, e.g. #1d4ed8." }),
      secondary_color: z
        .string()
        .regex(HEX_COLOR_PATTERN, { message: "Enter a hex color, e.g. #0f172a." }),
    }),
    thresholds: z.object({
      coverage_threshold: z.coerce
        .number()
        .min(0, { message: "Coverage threshold must be 0–100." })
        .max(100, { message: "Coverage threshold must be 0–100." }),
      confidence_threshold: z.coerce
        .number()
        .min(0, { message: "Confidence threshold must be 0–100." })
        .max(100, { message: "Confidence threshold must be 0–100." }),
    }),
    workflow: z.object({
      require_approval: z.boolean(),
    }),
  }),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

/** Defaults surface the tenant-config defaults (branding, thresholds, workflow) per AC. */
export const organizationDefaults: OrganizationFormValues = {
  name: "",
  slug: "",
  settings: {
    branding: { primary_color: "#1d4ed8", secondary_color: "#0f172a" },
    thresholds: { coverage_threshold: 80, confidence_threshold: 70 },
    workflow: { require_approval: true },
  },
};

/** Map validated form values to the `POST /organizations` payload (backend `OrganizationCreate`). */
export function toCreateRequest(values: OrganizationFormValues): OrganizationCreateRequest {
  const settings: OrganizationSettings = {
    branding: { ...values.settings.branding },
    thresholds: { ...values.settings.thresholds },
    workflow: { ...values.settings.workflow },
  };
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    settings,
  };
}
