"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export default function HomePage() {
  const tAuth = useTranslations("auth");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, router, locale]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/60">
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-border/40 px-4 py-1.5 text-xs font-semibold text-muted-foreground bg-background/70 backdrop-blur mb-6 shadow-sm">
              {tHome("badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground drop-shadow-sm">
              {tHome("heroTitle")}
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-2xl">
              {tHome("heroSubtitle")}
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Link href={`/${locale}/login`}>
                <Button
                  size="lg"
                  className="cursor-pointer shadow-md shadow-primary/10"
                >
                  {tHome("primaryCta")}
                </Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer shadow-md"
                >
                  {tHome("secondaryCta")}
                </Button>
              </Link>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground/80">
              {tHome("hint")}
            </p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/10 bg-card/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-semibold text-foreground">
                {tHome("heroCardTitle")}
              </CardTitle>
              <CardDescription className="text-muted-foreground/90">
                {tHome("heroCardSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-base text-muted-foreground/90">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-semibold text-foreground">
                    {tHome("stats.briefsTitle")}
                  </p>
                  <p>{tHome("stats.briefsDesc")}</p>
                </div>
                <span className="rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold text-primary">
                  {tHome("stats.briefsBadge")}
                </span>
              </div>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-semibold text-foreground">
                    {tHome("stats.aiTitle")}
                  </p>
                  <p>{tHome("stats.aiDesc")}</p>
                </div>
                <span className="rounded-full bg-secondary/20 px-4 py-1.5 text-xs font-bold text-secondary-foreground">
                  {tHome("stats.aiBadge")}
                </span>
              </div>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-semibold text-foreground">
                    {tHome("stats.collabTitle")}
                  </p>
                  <p>{tHome("stats.collabDesc")}</p>
                </div>
                <span className="rounded-full bg-muted/80 px-4 py-1.5 text-xs font-bold text-muted-foreground">
                  {tHome("stats.collabBadge")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <Card className="bg-card/90 backdrop-blur-lg border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                {tHome("features.templatesTitle")}
              </CardTitle>
              <CardDescription className="text-muted-foreground/90">
                {tHome("features.templatesSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground/90">
                {tHome("features.templatesDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-lg border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                {tHome("features.collabTitle")}
              </CardTitle>
              <CardDescription className="text-muted-foreground/90">
                {tHome("features.collabSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground/90">
                {tHome("features.collabDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/90 backdrop-blur-lg border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                {tHome("features.aiTitle")}
              </CardTitle>
              <CardDescription className="text-muted-foreground/90">
                {tHome("features.aiSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground/90">
                {tHome("features.aiDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
