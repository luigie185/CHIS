import {
  ArrowRight,
  Baby,
  Brain,
  HeartPulse,
  Stethoscope,
  Syringe,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICES } from "@/lib/services";

const ICONS: Record<string, LucideIcon> = {
  "general-consultation": Stethoscope,
  "prenatal-care": Baby,
  immunization: ClipboardList,
  vaccination: Syringe,
  "risk-assessment": HeartPulse,
  "mental-health": Brain,
};

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">Rural Health Unit</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Health services for every barangay
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Consultations, maternal care, immunization and screening — with records kept safely so your care
          continues from one visit to the next.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <a href="#services">Our services</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Staff login</Link>
          </Button>
        </div>
      </section>

      <section id="services" className="scroll-mt-8">
        <h2 className="mb-4 text-xl font-semibold">Services</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => {
            const Icon = ICONS[s.slug] ?? Stethoscope;
            return (
              <Link key={s.slug} href={`/services/${s.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="flex items-center gap-1">
                      {s.title}
                      <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription>{s.summary}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
