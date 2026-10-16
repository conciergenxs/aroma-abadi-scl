import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/scl/app-shell";
import {
  useBroadcastsStore,
  broadcastRuns,
  findBroadcastRun,
} from "@/components/scl/broadcasts-store";
import { BroadcastSessionAnalytics } from "@/components/scl/broadcast-session-analytics";
import { RunStatusBadge } from "./broadcasts.$broadcastId";

/* One send session of a broadcast. Reached from the Broadcast Logs table, and
 * the only place broadcast performance is read: a recurring series is measured
 * one occurrence at a time, not as a lifetime average. */
export const Route = createFileRoute("/broadcast-log/$broadcastId/$logId")({
  head: () => ({ meta: [{ title: "Broadcast Log — SCL" }] }),
  component: BroadcastLogPage,
});

function BroadcastLogPage() {
  const { broadcastId, logId } = Route.useParams();
  const { broadcasts } = useBroadcastsStore();
  const broadcast = broadcasts.find((b) => b.id === broadcastId) ?? null;
  const run = broadcast ? findBroadcastRun(broadcast, logId) : null;

  if (!broadcast || !run) {
    return (
      <AppShell backTo="/broadcasts">
        <div className="max-w-xl">
          <h1 className="mt-4 text-lg font-semibold">Send not found</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {broadcast
              ? "This broadcast has no send with that id — it may have been removed."
              : "The broadcast it belongs to may have been deleted."}
          </p>
          <Link
            to="/broadcasts"
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to broadcasts
          </Link>
        </div>
      </AppShell>
    );
  }

  const runs = broadcastRuns(broadcast);
  // Runs come back newest first; number them the way a sender counts them.
  const position = runs.length - runs.findIndex((r) => r.id === run.id);

  return (
    <AppShell>
      <Link
        to="/broadcasts/$broadcastId"
        params={{ broadcastId: broadcast.id }}
        className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to broadcast
      </Link>

      <div className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{run.sentAt}</h1>
          <RunStatusBadge status={run.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {broadcast.name} · send {position} of {runs.length}
          {broadcast.recurrence ? ` · ${broadcast.recurrence.summary}` : ""}
        </p>
      </div>

      <BroadcastSessionAnalytics broadcast={broadcast} run={run} />
    </AppShell>
  );
}
