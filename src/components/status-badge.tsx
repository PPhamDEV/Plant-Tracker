import { Badge } from "./ui/badge";

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "outline" }> = {
  ok: { label: "OK", variant: "success" },
  thirsty: { label: "Durstig", variant: "warning" },
  pests: { label: "Schädlinge", variant: "destructive" },
  repotted: { label: "Umgetopft", variant: "default" },
  sick: { label: "Krank", variant: "destructive" },
  growing: { label: "Wächst", variant: "success" },
};

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] || { label: status, variant: "outline" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
