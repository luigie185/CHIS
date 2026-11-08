import { ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getService, SERVICES } from "@/lib/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = getService((await params).slug);
  return { title: service?.title ?? "Service", description: service?.summary };
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const service = getService((await params).slug);
  if (!service) notFound();

  return (
    <article className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/#services">
          <ArrowLeft /> All services
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{service.title}</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{service.summary}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>What we provide</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {service.details.map((d) => (
                <li key={d} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Who it is for</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <p>{service.whoFor}</p>
            <div>
              <p className="mb-1 font-medium">What to bring</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {service.bring.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
