import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, RefreshCcw, Share2 } from "lucide-react";
import { useActivitySync } from "@/hooks/useActivitySync";
import { fetchMonthlyRoundup } from "@/lib/api";

const sharePosterSize = { width: 960, height: 540 };
const calendarHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthParam(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildEmptyRoundup(monthParam) {
  const baseDate = (() => {
    if (typeof monthParam === "string") {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      if (!Number.isNaN(year) && !Number.isNaN(monthIndex)) {
        return new Date(Date.UTC(year, monthIndex, 1));
      }
    }
    return new Date();
  })();

  const year = baseDate.getUTCFullYear();
  const monthIndex = baseDate.getUTCMonth();
  const nextMonth = new Date(Date.UTC(year, monthIndex + 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayDate = new Date(Date.UTC(year, monthIndex, day));
    return {
      day,
      date: dayDate.toISOString().slice(0, 10),
      is_active: false,
      total_activities: 0,
      total_distance_km: 0,
      total_moving_time_seconds: 0,
    };
  });

  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long" });
  const monthLabelFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

  return {
    athlete_id: null,
    month: getMonthParam(baseDate),
    month_name: monthFormatter.format(baseDate),
    month_label: monthLabelFormatter.format(baseDate),
    period_start: new Date(Date.UTC(year, monthIndex, 1)).toISOString(),
    period_end: nextMonth.toISOString(),
    total_active_days: 0,
    total_activities: 0,
    total_distance_km: 0,
    total_moving_time_seconds: 0,
    total_elevation_gain_m: 0,
    activity_split: [],
    calendar_days: calendarDays,
    insights: {
      most_active_day: null,
      most_active_time_of_day: null,
      average_activity_time_seconds: null,
      weekly_streak_weeks: 0,
    },
  };
}

function buildCalendarCells(calendarDays) {
  if (!Array.isArray(calendarDays) || calendarDays.length === 0) {
    return [];
  }

  const firstDate = new Date(`${calendarDays[0].date}T00:00:00Z`);
  const mondayBasedWeekday = (firstDate.getUTCDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < mondayBasedWeekday; index += 1) {
    cells.push({ key: `blank-start-${index}`, day: null, active: false });
  }

  calendarDays.forEach((entry) => {
    cells.push({
      key: `day-${entry.day}`,
      day: entry.day,
      active: entry.is_active,
      stats: entry,
    });
  });

  while (cells.length % 7 !== 0) {
    cells.push({ key: `blank-end-${cells.length}`, day: null, active: false });
  }

  return cells;
}

function formatDuration(seconds) {
  if (!seconds) {
    return "0h 0m";
  }
  const safeSeconds = Math.max(Number(seconds) || 0, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDistance(km) {
  if (!km) {
    return "0 km";
  }
  const rounded = Math.round(Number(km) * 10) / 10;
  return `${rounded.toFixed(1)} km`;
}

function formatElevation(meters) {
  if (!meters) {
    return "0 m";
  }
  return `${Math.round(Number(meters))} m`;
}

function formatDateLabel(isoDate) {
  if (!isoDate) {
    return "";
  }
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });
  const date = new Date(`${isoDate}T00:00:00Z`);
  return formatter.format(date);
}

function formatHourLabel(hour) {
  if (typeof hour !== "number") {
    return "";
  }
  const formatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  const baseDate = new Date(Date.UTC(1970, 0, 1, hour, 0));
  return formatter.format(baseDate);
}

function formatWeeklyStreak(weeks) {
  if (!weeks) {
    return "No active weeks yet";
  }
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

export default function Dashboard() {
  const athleteName = (typeof window !== "undefined" && localStorage.getItem("athleteName")) || "Strava Athlete";
  const athleteImage = (typeof window !== "undefined" && localStorage.getItem("athleteImage")) || "";
  const athleteId = typeof window !== "undefined" ? localStorage.getItem("athleteId") : null;

  const [isSharing, setIsSharing] = useState(false);
  const [roundupData, setRoundupData] = useState(null);
  const [isLoadingRoundup, setIsLoadingRoundup] = useState(false);
  const [roundupError, setRoundupError] = useState(null);

  const monthParam = useMemo(() => getMonthParam(new Date()), []);
  const fallbackRoundup = useMemo(() => buildEmptyRoundup(monthParam), [monthParam]);
  const monthlyRoundup = roundupData ?? fallbackRoundup;

  const totalMovingTimeHours = monthlyRoundup.total_moving_time_seconds / 3600;
  const totalMovingTimeDisplay = formatDuration(monthlyRoundup.total_moving_time_seconds);
  const totalMovingTimeHoursRounded = Number.isFinite(totalMovingTimeHours)
    ? Math.round(totalMovingTimeHours * 10) / 10
    : 0;

  const splitWithPercentages = useMemo(() => {
    if (!monthlyRoundup.activity_split) {
      return [];
    }
    return monthlyRoundup.activity_split.map((entry) => ({
      ...entry,
      percentage: Math.round((entry.percentage ?? 0) * 10) / 10,
    }));
  }, [monthlyRoundup.activity_split]);

  const calendarCells = useMemo(
    () => buildCalendarCells(monthlyRoundup.calendar_days),
    [monthlyRoundup.calendar_days],
  );

  const {
    syncState: dashboardSyncState,
    triggerSync: triggerDashboardSync,
    isSyncing: isDashboardSyncing,
  } = useActivitySync(athleteId, { auto: true });

  const posterRef = useRef(null);

  const summaryCards = useMemo(
    () => [
      {
        id: "activeDays",
        label: "Total active days",
        primary: isLoadingRoundup ? "…" : monthlyRoundup.total_active_days,
        caption: "Days with at least one activity",
      },
      {
        id: "activities",
        label: "Total activities",
        primary: isLoadingRoundup ? "…" : monthlyRoundup.total_activities,
        caption: "Workouts logged across the month",
      },
      {
        id: "distance",
        label: "Total kms",
        primary: isLoadingRoundup ? "…" : formatDistance(monthlyRoundup.total_distance_km),
        caption: `${monthlyRoundup.month_name} distance`,
      },
      {
        id: "movingTime",
        label: "Total moving time",
        primary: isLoadingRoundup ? "…" : totalMovingTimeDisplay,
        caption: isLoadingRoundup
          ? "Loading moving time"
          : `${totalMovingTimeHoursRounded.toFixed(1)} hrs spent moving`,
      },
      {
        id: "elevation",
        label: "Total elevation gained",
        primary: isLoadingRoundup ? "…" : formatElevation(monthlyRoundup.total_elevation_gain_m),
        caption: "Elevation climbed this month",
      },
      {
        id: "activitySplit",
        label: "Split of activities",
        type: "split",
        caption: isLoadingRoundup ? "Loading activity split" : "Rounded share for each activity type",
      },
    ],
    [
      isLoadingRoundup,
      monthlyRoundup.month_name,
      monthlyRoundup.total_activities,
      monthlyRoundup.total_active_days,
      monthlyRoundup.total_distance_km,
      monthlyRoundup.total_elevation_gain_m,
      totalMovingTimeDisplay,
      totalMovingTimeHoursRounded,
    ],
  );

  const loadMonthlyRoundup = useCallback(async () => {
    if (!athleteId) {
      return;
    }
    setIsLoadingRoundup(true);
    setRoundupError(null);
    try {
      const response = await fetchMonthlyRoundup(athleteId, { month: monthParam });
      setRoundupData(response);
    } catch (error) {
      console.error(error);
      setRoundupData(null);
      setRoundupError(error?.message || "We could not load the monthly roundup");
    } finally {
      setIsLoadingRoundup(false);
    }
  }, [athleteId, monthParam]);

  useEffect(() => {
    if (!athleteId) {
      return;
    }
    loadMonthlyRoundup();
  }, [athleteId, loadMonthlyRoundup]);

  useEffect(() => {
    if (!athleteId) {
      return;
    }
    if (dashboardSyncState.summary?.synced_at) {
      loadMonthlyRoundup();
    }
  }, [athleteId, dashboardSyncState.summary?.synced_at, loadMonthlyRoundup]);

  const syncedAt = dashboardSyncState?.summary?.synced_at;
  let lastSyncedLabel = null;
  if (syncedAt) {
    const parsed = new Date(syncedAt);
    if (!Number.isNaN(parsed.getTime())) {
      lastSyncedLabel = parsed.toLocaleString();
    }
  }

  const shareMessage = `${monthlyRoundup.month_name} roundup: ${formatDistance(
    monthlyRoundup.total_distance_km,
  )} across ${monthlyRoundup.total_activities} activities.`;

  const handleShare = async () => {
    if (!posterRef.current) {
      return;
    }
    try {
      setIsSharing(true);
      const svgNode = posterRef.current.cloneNode(true);
      svgNode.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgNode.setAttribute("width", `${sharePosterSize.width}`);
      svgNode.setAttribute("height", `${sharePosterSize.height}`);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgNode);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.crossOrigin = "anonymous";
      const imageLoad = new Promise((resolve, reject) => {
        image.onload = () => resolve(true);
        image.onerror = () => reject(new Error("Preview failed"));
      });
      image.src = svgUrl;
      await imageLoad;
      URL.revokeObjectURL(svgUrl);

      const canvas = document.createElement("canvas");
      const scale = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = sharePosterSize.width * scale;
      canvas.height = sharePosterSize.height * scale;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas not supported");
      }

      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sharePosterSize.width, sharePosterSize.height);
      ctx.drawImage(image, 0, 0, sharePosterSize.width, sharePosterSize.height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob((canvasBlob) => resolve(canvasBlob), "image/png");
      });

      if (!blob) {
        throw new Error("We could not create the image");
      }

      const fileName = `strava-roundup-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Strava Roundup",
          text: shareMessage,
        });
      } else {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error(error);
      window.alert("We could not generate the shareable image. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleSyncActivities = async () => {
    if (!athleteId) {
      return;
    }
    try {
      await triggerDashboardSync();
    } catch (error) {
      console.error(error);
    }
  };

  if (!athleteId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 text-center text-slate-700">
        <h1 className="text-3xl font-semibold text-slate-900">Connect your Strava account</h1>
        <p className="mt-4 max-w-md text-sm text-slate-500">
          We could not find an athlete profile. Return to the home page and connect your Strava account to see
          your roundup dashboard.
        </p>
        <Button
          className="mt-6 rounded-full bg-orange-500 px-6 py-2 text-white shadow-lg hover:bg-orange-600"
          onClick={() => window.location.assign("/")}
        >
          Back to home
        </Button>
      </div>
    );
  }

  if (dashboardSyncState.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">Sync in progress</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          We are pulling the latest activities from Strava. Your dashboard will appear shortly.
        </p>
      </div>
    );
  }

  if (dashboardSyncState.status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">Sync failed</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">{dashboardSyncState.error}</p>
        <Button
          className="mt-6 rounded-full bg-orange-500 px-6 py-2 text-white shadow-lg hover:bg-orange-600"
          onClick={handleSyncActivities}
        >
          Retry sync
        </Button>
      </div>
    );
  }

  const mostActiveDayText = isLoadingRoundup
    ? "Loading…"
    : monthlyRoundup.insights.most_active_day
      ? formatDateLabel(monthlyRoundup.insights.most_active_day.date)
      : "Not enough data yet";
  const mostActiveTimeText = isLoadingRoundup
    ? "Loading…"
    : monthlyRoundup.insights.most_active_time_of_day
      ? formatHourLabel(monthlyRoundup.insights.most_active_time_of_day.hour)
      : "Not enough data yet";
  const averageActivityTimeText = isLoadingRoundup
    ? "Loading…"
    : monthlyRoundup.insights.average_activity_time_seconds
      ? formatDuration(monthlyRoundup.insights.average_activity_time_seconds)
      : "Not enough data yet";
  const weeklyStreakText = isLoadingRoundup
    ? "Loading…"
    : formatWeeklyStreak(monthlyRoundup.insights.weekly_streak_weeks);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {athleteImage ? (
                <img
                  src={athleteImage}
                  alt="Athlete avatar"
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-semibold uppercase text-orange-500 shadow-sm">
                  {athleteName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Hero section</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {monthlyRoundup.month_name} roundup
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {athleteName} · Your {monthlyRoundup.month_name} in sports.
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {lastSyncedLabel ? `Last synced ${lastSyncedLabel}` : isLoadingRoundup ? "Loading monthly data…" : "Monthly data ready"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleShare}
                disabled={isSharing || isLoadingRoundup}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Share2 className="h-4 w-4" />
                {isSharing ? "Creating image…" : "Share roundup"}
              </Button>
              <Button
                onClick={handleSyncActivities}
                disabled={!athleteId || isDashboardSyncing}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDashboardSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Sync activities
              </Button>
            </div>
          </div>
        </section>

        <Separator className="my-10 border-slate-200" />

        <section className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-slate-900">Monthly roundup</CardTitle>
              <CardDescription className="text-slate-500">
                {isLoadingRoundup
                  ? "Fetching the latest snapshot…"
                  : `Snapshot for ${monthlyRoundup.month_label}. Data is ready to swap with live metrics.`}
              </CardDescription>
              {roundupError ? (
                <p className="mt-3 text-sm text-red-500">{roundupError}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaryCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-inner transition"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                      {card.type === "split" ? (
                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                          {isLoadingRoundup ? (
                            <li className="text-slate-400">Loading…</li>
                          ) : splitWithPercentages.length > 0 ? (
                            splitWithPercentages.map((entry) => (
                              <li key={`${card.id}-${entry.type}`} className="flex items-center justify-between">
                                <span>{entry.type}</span>
                                <span className="text-slate-500">
                                  {entry.count} · {entry.percentage.toFixed(1)}%
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400">Not enough data yet</li>
                          )}
                        </ul>
                      ) : (
                        <p className="mt-4 text-3xl font-semibold text-slate-900">{card.primary}</p>
                      )}
                    </div>
                    {card.caption ? <p className="text-xs text-slate-500">{card.caption}</p> : null}
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-inner">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-700">Calendar view</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{monthlyRoundup.month_label}</p>
                </div>
                <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400">
                  {calendarHeaders.map((header) => (
                    <span key={`calendar-header-${header}`} className="tracking-[0.2em]">
                      {header}
                    </span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {isLoadingRoundup && calendarCells.length === 0 ? (
                    <div className="col-span-7 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Loading calendar…
                    </div>
                  ) : (
                    calendarCells.map((cell) => (
                      <div
                        key={cell.key}
                        className={`aspect-square w-full rounded-2xl border text-sm font-medium transition ${
                          cell.day
                            ? cell.active
                              ? "border-orange-200 bg-orange-50 text-orange-600 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600"
                            : "border-transparent bg-transparent text-slate-300"
                        } flex items-center justify-center`}
                        title={
                          cell.day && cell.stats
                            ? `${cell.stats.total_activities} activities · ${formatDistance(cell.stats.total_distance_km)}`
                            : undefined
                        }
                      >
                        {cell.day || ""}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-inner">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Monthly insights</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InsightItem label="Most active day" value={mostActiveDayText} />
                  <InsightItem label="Most active time of day" value={mostActiveTimeText} />
                  <InsightItem label="Average activity time per day" value={averageActivityTimeText} />
                  <InsightItem label="Weekly streak" value={weeklyStreakText} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <svg
        ref={posterRef}
        className="hidden"
        width={sharePosterSize.width}
        height={sharePosterSize.height}
        viewBox={`0 0 ${sharePosterSize.width} ${sharePosterSize.height}`}
        role="presentation"
      >
        <rect x="0" y="0" width={sharePosterSize.width} height={sharePosterSize.height} fill="#ffffff" />
        <rect
          x="40"
          y="40"
          width={sharePosterSize.width - 80}
          height={sharePosterSize.height - 80}
          rx="32"
          fill="#f8fafc"
          stroke="rgba(148,163,184,0.25)"
        />
        <text
          x="80"
          y="120"
          fill="#f97316"
          fontFamily="Inter, sans-serif"
          fontSize="20"
          letterSpacing="10"
        >
          {monthlyRoundup.month_label.toUpperCase()}
        </text>
        <text
          x="80"
          y="180"
          fill="#0f172a"
          fontFamily="Inter, sans-serif"
          fontSize="54"
          fontWeight="700"
        >
          {athleteName}
        </text>
        <text
          x="80"
          y="230"
          fill="#475569"
          fontFamily="Inter, sans-serif"
          fontSize="24"
        >
          Monthly Roundup Overview
        </text>
        <text
          x="80"
          y="290"
          fill="#0f172a"
          fontFamily="Inter, sans-serif"
          fontSize="36"
          fontWeight="600"
        >
          {formatDistance(monthlyRoundup.total_distance_km)} · {monthlyRoundup.total_activities} activities
        </text>
        <text
          x="80"
          y="340"
          fill="#475569"
          fontFamily="Inter, sans-serif"
          fontSize="22"
        >
          {monthlyRoundup.total_active_days} active days · {formatElevation(monthlyRoundup.total_elevation_gain_m)} climbed ·{" "}
          {totalMovingTimeDisplay} moving
        </text>
        <text
          x="80"
          y="400"
          fill="#64748b"
          fontFamily="Inter, sans-serif"
          fontSize="18"
        >
          Activity split:
        </text>
        {(splitWithPercentages.length ? splitWithPercentages : [{ type: "No data yet", count: 0, percentage: 0 }]).map(
          (entry, index) => (
            <text
              key={`split-${entry.type}-${index}`}
              x="80"
              y={430 + index * 28}
              fill="#334155"
              fontFamily="Inter, sans-serif"
              fontSize="18"
            >
              {entry.type} · {entry.count}{entry.count ? ` (${entry.percentage.toFixed(1)}%)` : ""}
            </text>
          ),
        )}
        <text
          x={sharePosterSize.width - 80}
          y={sharePosterSize.height - 60}
          fill="#94a3b8"
          fontFamily="Inter, sans-serif"
          fontSize="16"
          textAnchor="end"
        >
          Strava Roundup • {new Date().getFullYear()}
        </text>
      </svg>
    </div>
  );
}

function InsightItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
