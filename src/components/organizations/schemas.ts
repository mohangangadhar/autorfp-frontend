import { z } from "zod";
import type { OrganizationCreateRequest } from "@/types/api";

/**
 * Zod mirror of the `POST /organizations` request body (forms-design §2).
 * Field names/types/limits follow the backend Pydantic model + TDD-020
 * (name ≤255, slug ≤100 alphanumeric+hyphens, retention 30–3650 days,
 * region default us-east). The backend remains authoritative.
 */

const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
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
  domain: z
    .string()
    .trim()
    .max(255, { message: "Domain must be 255 characters or fewer." })
    .refine((value) => value === "" || DOMAIN_PATTERN.test(value), {
      message: "Enter a valid domain, e.g. acme.com.",
    }),
  region: z.string().min(1, { message: "Select a data region." }),
  data_retention_days: z.coerce
    .number()
    .int({ message: "Retention must be a whole number of days." })
    .min(30, { message: "Retention must be at least 30 days." })
    .max(3650, { message: "Retention must be 3650 days or fewer." }),
  config: z.object({
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
  admin: z.object({
    name: z.string().trim().min(1, { message: "Enter the admin's name." }),
    email: z
      .string()
      .trim()
      .min(1, { message: "Enter the admin's email." })
      .email({ message: "Enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
  }),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

/** Defaults surface the tenant-config defaults (branding, thresholds, workflow) per AC. */
export const organizationDefaults: OrganizationFormValues = {
  name: "",
  slug: "",
  domain: "",
  region: "us-east",
  data_retention_days: 365,
  config: {
    branding: { primary_color: "#1d4ed8", secondary_color: "#0f172a" },
    thresholds: { coverage_threshold: 80, confidence_threshold: 70 },
    workflow: { require_approval: true },
  },
  admin: { name: "", email: "", password: "" },
};

export const REGION_OPTIONS = ["us-east", "us-west", "eu-central"] as const;

/** Map validated form values to the `POST /organizations` payload (snake_case). */
export function toCreateRequest(values: OrganizationFormValues): OrganizationCreateRequest {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    domain: values.domain.trim() ? values.domain.trim() : undefined,
    region: values.region,
    data_retention_days: values.data_retention_days,
    config: {
      branding: { ...values.config.branding },
      thresholds: { ...values.config.thresholds },
      workflow: { ...values.config.workflow },
    },
    admin: { ...values.admin },
  };
}
