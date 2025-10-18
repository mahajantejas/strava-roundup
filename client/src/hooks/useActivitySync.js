import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncAthleteActivities } from "@/lib/api";

const INITIAL_STATE = {
  status: "idle",
  summary: null,
  error: null,
};

export function useActivitySync(athleteId, { auto = false } = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const inFlightRef = useRef(null);

  const safeAthleteId = useMemo(() => {
    if (!athleteId) {
      return null;
    }
    return Number.isNaN(Number(athleteId)) ? athleteId : Number(athleteId);
  }, [athleteId]);

  const trigger = useCallback(
    async (options = {}) => {
      if (!safeAthleteId) {
        const error = new Error("Athlete not available for sync");
        setState({
          status: "error",
          summary: null,
          error: error.message,
        });
        return Promise.reject(error);
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      setState({
        status: "loading",
        summary: null,
        error: null,
      });

      const syncPromise = syncAthleteActivities(safeAthleteId, options)
        .then((summary) => {
          setState({
            status: "success",
            summary,
            error: null,
          });
          return summary;
        })
        .catch((error) => {
          const message = error?.message || "Failed to sync activities";
          setState({
            status: "error",
            summary: null,
            error: message,
          });
          throw error;
        })
        .finally(() => {
          inFlightRef.current = null;
        });

      inFlightRef.current = syncPromise;
      return syncPromise;
    },
    [safeAthleteId],
  );

  const reset = useCallback(() => {
    inFlightRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    if (!auto || !safeAthleteId) {
      return;
    }
    trigger().catch(() => {
      // errors handled in state; no-op for auto trigger
    });
  }, [auto, safeAthleteId, trigger]);

  return {
    syncState: state,
    triggerSync: trigger,
    isSyncing: state.status === "loading",
    resetSync: reset,
  };
}
