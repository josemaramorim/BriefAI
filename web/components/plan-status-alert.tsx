"use client";

import Link from "next/link";
import { AlertCircle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlanStatusAlertProps {
  planName: string;
  trialEndsAt?: string | null;
  renewalAt?: string | null;
  isTrialActive: boolean;
  daysRemaining: number;
  percentageRemaining: number;
  status: "active" | "warning" | "expired";
  renewalDaysRemaining?: number;
}

export function PlanStatusAlert({
  planName,
  trialEndsAt,
  renewalAt,
  isTrialActive,
  daysRemaining,
  percentageRemaining,
  status,
  renewalDaysRemaining = 0,
}: PlanStatusAlertProps) {
  // Exibe alerta para trial OU para plano pago
  const isTrial = !!trialEndsAt;
  const isPaidPlan = !trialEndsAt && !!renewalAt;

  const getStatusConfig = () => {
    switch (status) {
      case "expired":
        return {
          icon: XCircle,
          variant: "destructive" as const,
          title: isTrial ? "Trial Expirado" : "Plano Expirado",
          bgColor: "bg-card",
          borderColor: "border-destructive/50",
          progressColor: "bg-red-500",
        };
      case "warning":
        return {
          icon: AlertCircle,
          variant: "default" as const,
          title: isTrial ? "Trial Expirando em Breve" : "Plano Expirando em Breve",
          bgColor: "bg-card",
          borderColor: "border-yellow-400",
          progressColor: "bg-yellow-500",
        };
      default:
        return {
          icon: CheckCircle,
          variant: "default" as const,
          title: isTrial ? "Trial Ativo" : "Plano Ativo",
          bgColor: "bg-card",
          borderColor: "border-green-400",
          progressColor: "bg-green-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const formattedDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("pt-BR")
    : renewalAt
    ? new Date(renewalAt).toLocaleDateString("pt-BR")
    : "";

  return (
    <Alert
      variant={config.variant}
      className={`${config.bgColor} ${config.borderColor} border-2 text-foreground shadow-lg backdrop-blur`}
    >
      <Icon className="h-5 w-5" />
      <AlertTitle className="flex items-center justify-between mb-2">
        <span className="font-bold">{config.title}</span>
        <span className="text-sm font-medium">
          Plano: {planName}
        </span>
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            {status === "expired" ? (
              <span>
                {isTrial
                  ? `Seu trial expirou${formattedDate ? ` em ${formattedDate}` : ""}`
                  : isPaidPlan
                  ? `Seu plano expirou${formattedDate ? ` em ${formattedDate}` : ""}`
                  : `Seu plano expirou`}
              </span>
            ) : (
              <span>
                {isTrial
                  ? `${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"} restantes (expira em ${formattedDate})`
                  : isPaidPlan
                  ? `Próxima renovação em ${renewalDaysRemaining} ${renewalDaysRemaining === 1 ? "dia" : "dias"} (${formattedDate})`
                  : `Plano ativo`}
              </span>
            )}
          </div>

          {status !== "expired" && (
            <div className="space-y-1">
              <Progress
                value={percentageRemaining}
                className={`h-2 ${config.progressColor}`}
              />
              <p className="text-xs text-muted-foreground">
                {isTrial
                  ? `${Math.round(percentageRemaining)}% do período de trial restante`
                  : `${Math.round(percentageRemaining)}% do período do plano restante`}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" variant={status === "expired" ? "default" : "outline"}>
              <Link href="/upgrade">
                {status === "expired" ? "Renovar Agora" : "Ver Planos"}
              </Link>
            </Button>
            {status !== "expired" && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/billing">
                  Gerenciar Assinatura
                </Link>
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
