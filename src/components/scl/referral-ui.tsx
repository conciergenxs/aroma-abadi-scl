import { CheckCircle2, Clock, Search, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { referralStore, type ReferralSeason, type ReferralStatus } from "./referral-store";

// Small pieces shared by the Referral pages, kept out of the route files so
// routes never import from each other.

export function SeasonStatusBadge({ status }: { status: ReferralStatus }) {
  if (status === "active")
    return (
      <span className="badge-animate inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
        <CheckCircle2 className="h-3 w-3" /> Ongoing
      </span>
    );
  if (status === "ended")
    return (
      <span className="badge-animate inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-500 px-2.5 py-0.5 text-[11px] font-medium text-white">
        <XCircle className="h-3 w-3" /> Ended
      </span>
    );
  return (
    <span className="badge-animate inline-flex items-center gap-1 rounded-full border border-sky-700 bg-sky-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
      <Clock className="h-3 w-3" /> Upcoming
    </span>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
  title,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="card-hover rounded-xl border border-border bg-card/40 p-4 transition-all duration-300"
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-foreground stat-value">{value}</div>
    </div>
  );
}

export function TableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full sm:w-[280px] rounded-md border border-border bg-card pl-8 pr-3 text-[13px] transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
      />
    </div>
  );
}

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export function TablePager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSize(Number(e.target.value));
            onPage(1);
          }}
          className="h-7 rounded-md border border-border bg-card px-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {from}–{to} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="press tap h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="press tap h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

/** Clamp a page so a shrinking list never strands the view past its end. */
export function clampPage(page: number, total: number, pageSize: number) {
  return Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
}

export function DeleteSeasonDialog({
  season,
  onClose,
  onDeleted,
}: {
  season: ReferralSeason | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  return (
    <AlertDialog open={!!season} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this referral season?</AlertDialogTitle>
          <AlertDialogDescription>
            "{season?.name}" and its report will be permanently deleted. Customers' referral codes
            are not affected. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (season) referralStore.deleteSeason(season.id);
              toast.success("Season deleted");
              onClose();
              onDeleted?.();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-150"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
