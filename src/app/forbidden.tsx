import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">403 — Not allowed</h1>
      <p className="text-neutral-500">Your role does not have access to this page.</p>
      <Link href="/login" className="text-emerald-700 underline">
        Go to my home page
      </Link>
    </main>
  );
}
