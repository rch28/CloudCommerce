interface BadgeProps {
  status: string;
}

const styles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paid: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  shipped: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  refunded: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  draft: "bg-slate-500/15 text-muted-foreground border-slate-500/30",
  archived: "bg-slate-500/15 text-muted-foreground border-slate-500/30",
  trialing: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  past_due: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function Badge({ status }: BadgeProps) {
  const cls = styles[status] || (status ? styles.draft : "");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status?.replace("_", " ") ?? ""}
    </span>
  );
}
