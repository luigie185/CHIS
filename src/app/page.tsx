import Link from "next/link";

const services = [
  "General Consultation (ITR)",
  "Prenatal & Postpartum Care",
  "Expanded Program on Immunization",
  "Vaccination",
  "NCD Risk Assessment",
  "Mental Health",
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">Rural Health Unit</p>
        <h1 className="text-4xl font-semibold tracking-tight">Health Information System</h1>
        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Patient records, consultation queueing, and program analytics for RHU staff.
        </p>
        <div>
          <Link
            href="/login"
            className="mt-2 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Staff login
          </Link>
        </div>
      </header>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Services</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              {s}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
