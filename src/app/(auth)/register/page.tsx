import { AuthProvider } from "@/lib/auth/auth-context";
import { OrganizationCreateWizard } from "@/components/organizations/organization-create-wizard";

export const metadata = { title: "Create your organization" };

export default function RegisterPage() {
  return (
    <AuthProvider>
      <OrganizationCreateWizard mode="self-service" />
    </AuthProvider>
  );
}