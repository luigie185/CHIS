import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/lib/auth/session";
import { formatPatientName } from "@/lib/format";
import { getString } from "@/lib/search-params";
import { getPatient } from "@/server/patients/queries";
import { NewVisitWizard } from "./new-visit-wizard";

export const metadata: Metadata = { title: "New visit" };

export default async function NewVisitPage({ searchParams }: PageProps<"/visits/new">) {
  await requirePermission("encounter:create");
  const patientId = getString(await searchParams, "patientId");
  const p = patientId ? await getPatient(patientId) : null;

  return (
    <>
      <PageHeader
        title="New visit"
        description="Individual Treatment Record — patient intake and vital signs."
      />
      <NewVisitWizard
        key={p?.id ?? "new"}
        initialPatient={
          p
            ? {
                id: p.id,
                name: formatPatientName(p),
                patientNo: p.patientNo,
                sex: p.sex,
                birthdate: p.birthdate,
                barangayName: p.barangayName,
                contactNo: p.contactNo,
              }
            : null
        }
      />
    </>
  );
}
