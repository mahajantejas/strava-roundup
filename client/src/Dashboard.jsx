import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CalendarDays, Clock, Loader2, Mountain, Share2, TrendingUp } from "lucide-react";
import { useActivitySync } from "@/hooks/useActivitySync";

const metricOptions = {
  distance: { label: "Distance", unit: "km" },
  time: { label: "Moving Time", unit: "hrs" },
  elevation: { label: "Elevation Gain", unit: "m" },
};

const timeframeOptions = {
  month: { label: "Last 4 Weeks" },
  quarter: { label: "Last 6 Months" },
};

const monthSummaries = [
  {
    id: "2024-11",
    label: "November 2024",
    monthName: "November",
    streakWeeks: 15,
    daysActive: 16,
    totalDistance: 166.9,
    totalTime: 20.1,
    totalElevation: 1524,
    longestRun: 20.6,
    bestPace: "4:38 /km",
    longestRide: 57.8,
    totalActivities: 28,
    activityBreakdown: {
      run: 14,
      ride: 6,
      training: 8,
    },
  },
  {
    id: "2024-10",
    label: "October 2024",
    monthName: "October",
    streakWeeks: 14,
    daysActive: 15,
    totalDistance: 148.2,
    totalTime: 18.3,
    totalElevation: 1318,
    longestRun: 19.7,
    bestPace: "4:40 /km",
    longestRide: 52.4,
    totalActivities: 24,
    activityBreakdown: {
      run: 11,
      ride: 5,
      training: 8,
    },
  },
  {
    id: "2024-09",
    label: "September 2024",
    monthName: "September",
    streakWeeks: 13,
    daysActive: 14,
    totalDistance: 160.5,
    totalTime: 19.0,
    totalElevation: 706,
    longestRun: 18.4,
    bestPace: "4:42 /km",
    longestRide: 54.2,
    totalActivities: 26,
    activityBreakdown: {
      run: 12,
      ride: 6,
      training: 8,
    },
  },
];

const monthlyTrend = [
  { id: "2024-06", label: "Jun", distance: 142.3, time: 16.8, elevation: 1180 },
  { id: "2024-07", label: "Jul", distance: 156.1, time: 18.2, elevation: 1345 },
  { id: "2024-08", label: "Aug", distance: 173.4, time: 19.4, elevation: 1492 },
  { id: "2024-09", label: "Sep", distance: 160.5, time: 19.0, elevation: 1426 },
  { id: "2024-10", label: "Oct", distance: 148.2, time: 18.3, elevation: 1318 },
  { id: "2024-11", label: "Nov", distance: 166.9, time: 20.1, elevation: 1524 },
];

const rollingWeeks = [
  { label: "Week 1", distance: 37.2, time: 4.6, elevation: 168 },
  { label: "Week 2", distance: 41.8, time: 4.9, elevation: 182 },
  { label: "Week 3", distance: 39.5, time: 4.7, elevation: 175 },
  { label: "Week 4", distance: 42.0, time: 5.0, elevation: 181 },
];

const weeklyLog = [
  { day: "M", label: "Mon", distance: 0, time: 0, type: null },
  { day: "T", label: "Tue", distance: 6.4, time: 0.9, type: "run" },
  { day: "W", label: "Wed", distance: 0, time: 0, type: null },
  { day: "T", label: "Thu", distance: 8.3, time: 1.1, type: "run" },
  { day: "F", label: "Fri", distance: 6.8, time: 0.8, type: "training" },
  { day: "S", label: "Sat", distance: 14.6, time: 1.8, type: "ride" },
  { day: "S", label: "Sun", distance: 12.3, time: 1.2, type: "run" },
];

const typeStyles = {
  run: "border-orange-200 bg-orange-100 text-orange-600",
  ride: "border-emerald-200 bg-emerald-100 text-emerald-600",
  training: "border-indigo-200 bg-indigo-100 text-indigo-600",
};

export default function Dashboard() {
  const athleteName = localStorage.getItem("athleteName") || "Strava Athlete";
  const athleteImage = localStorage.getItem("athleteImage") || "";
  const athleteId = typeof window !== "undefined" ? localStorage.getItem("athleteId") : null;

  const [metric, setMetric] = useState("distance");
  const [timeframe, setTimeframe] = useState("quarter");
  const [selectedMonthId, setSelectedMonthId] = useState(monthSummaries[0].id);
  const [isSharing, setIsSharing] = useState(false);
  const {
    syncState: dashboardSyncState,
    triggerSync: triggerDashboardSync,
    isSyncing: isDashboardSyncing,
  } = useActivitySync(athleteId, { auto: true });
  const dashboardSyncSummary = dashboardSyncState.summary;

  const posterRef = useRef(null);

  const sharePosterSize = { width: 960, height: 540 };
  const chartConfig = { width: 560, height: 220, padding: 28 };
  const shareChartConfig = { width: 760, height: 240, padding: 44 };

  const selectedMonth = useMemo(
    () => monthSummaries.find((entry) => entry.id === selectedMonthId) ?? monthSummaries[0],
    [selectedMonthId],
  );

  const chartData = timeframe === "month" ? rollingWeeks : monthlyTrend;
  const labels = chartData.map((item) => item.label);
  const activityEntries = Object.entries(selectedMonth.activityBreakdown ?? {});
  const totalActivities =
    selectedMonth.totalActivities ??
    activityEntries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const selectedMetricValues = useMemo(
    () => chartData.map((item) => Number(item[metric] || 0)),
    [chartData, metric],
  );

  const selectedMetricSummary = useMemo(() => {
    if (selectedMetricValues.length === 0) {
      return { last: 0, previous: 0, delta: 0, total: 0 };
    }
    const last = selectedMetricValues.at(-1) ?? 0;
    const previous =
      selectedMetricValues.length > 1
        ? selectedMetricValues[selectedMetricValues.length - 2]
        : last;
    const delta = last - previous;
    const total = selectedMetricValues.reduce((sum, value) => sum + value, 0);
    return { last, previous, delta, total };
  }, [selectedMetricValues]);

  const chartGeometry = useMemo(
    () => buildChartGeometry(selectedMetricValues, chartConfig.width, chartConfig.height, chartConfig.padding),
    [selectedMetricValues, chartConfig.height, chartConfig.padding, chartConfig.width],
  );

  const shareGeometry = useMemo(
    () => buildChartGeometry(selectedMetricValues, shareChartConfig.width, shareChartConfig.height, shareChartConfig.padding),
    [selectedMetricValues, shareChartConfig.height, shareChartConfig.padding, shareChartConfig.width],
  );

  const shareMetricDescriptor = metricOptions[metric];
  const changePercentage =
    selectedMetricSummary.previous > 0
      ? (selectedMetricSummary.delta / selectedMetricSummary.previous) * 100
      : 0;

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
          text: `My latest ${shareMetricDescriptor.label.toLowerCase()} highlight: ${selectedMetricSummary.last.toFixed(1)} ${shareMetricDescriptor.unit}`,
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
    } catch (err) {
      // errors surface via dashboardSyncState
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12">
        <div className="mb-10 space-y-6">
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
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Roundup Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Welcome back, {athleteName.split(" ")[0]}!
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Monthly highlights, ready to share with your crew.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleShare}
                disabled={isSharing}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Share2 className="h-4 w-4" />
                {isSharing ? "Creating image…" : "Share snapshot"}
              </Button>
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
                Connected
              </Badge>
            </div>
          </div>
          <Separator className="border-slate-200" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-lg shadow-slate-200/40">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900">
                    {selectedMonth.monthName} roundup
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    {selectedMonth.daysActive} active days powering a {selectedMonth.streakWeeks}-week streak.
                  </CardDescription>
                </div>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="font-medium uppercase tracking-[0.25em] text-slate-400">Month</span>
                  <select
                    value={selectedMonthId}
                    onChange={(event) => setSelectedMonthId(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    {monthSummaries.map((monthOption) => (
                      <option key={monthOption.id} value={monthOption.id}>
                        {monthOption.label}
                      </option>
                    ))}
                  </select>
                </label>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Active days</p>
                    <p className="mt-6 text-6xl font-semibold text-slate-900">{selectedMonth.daysActive}</p>
                    <p className="mt-3 text-sm text-slate-500">
                      Days you laced up and logged a workout.
                    </p>
                    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-inner">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Highlights</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>Longest run · {selectedMonth.longestRun.toFixed(1)} km</p>
                        <p>Best pace · {selectedMonth.bestPace}</p>
                        <p>Longest ride · {selectedMonth.longestRide.toFixed(1)} km</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
                        <span>Hours</span>
                        <Clock className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="mt-5 text-3xl font-semibold text-slate-900">
                        {selectedMonth.totalTime.toFixed(1)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Moving time</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
                        <span>Distance</span>
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="mt-5 text-3xl font-semibold text-slate-900">
                        {selectedMonth.totalDistance.toFixed(1)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Kilometers covered</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
                        <span>Elevation</span>
                        <Mountain className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="mt-5 text-3xl font-semibold text-slate-900">
                        {Math.round(selectedMonth.totalElevation)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Meters climbed</p>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-6 shadow-sm">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
                        <span>Activities</span>
                        <CalendarDays className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="mt-5 text-3xl font-semibold text-slate-900">{totalActivities}</p>
                      <p className="mt-1 text-xs text-slate-500">Logged this month</p>
                      <div className="mt-4 space-y-1 text-xs text-slate-500">
                        {activityEntries.length > 0 ? (
                          activityEntries.map(([type, count]) => (
                            <div key={type} className="flex justify-between capitalize text-slate-600">
                              <span>{type}</span>
                              <span>{count}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400">Breakdown coming soon</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-lg shadow-slate-200/30">
              <CardHeader className="gap-6 lg:flex lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-900">Progress trend</CardTitle>
                  <CardDescription className="text-slate-500">
                    Switch metrics and timeframe to watch the story your training tells.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(metricOptions).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMetric(key)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        metric === key
                          ? "border-orange-400 bg-orange-500 text-white shadow-md shadow-orange-500/30"
                          : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                      {timeframeOptions[timeframe].label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {selectedMetricSummary.last.toFixed(1)} {shareMetricDescriptor.unit}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {changePercentage >= 0 ? "+" : ""}
                      {changePercentage.toFixed(1)}% vs previous data point
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                    {Object.entries(timeframeOptions).map(([key, option]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTimeframe(key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          timeframe === key
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <svg
                    viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                    className="h-60 w-full"
                    role="presentation"
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(249,115,22,0.45)" />
                        <stop offset="100%" stopColor="rgba(249,115,22,0.05)" />
                      </linearGradient>
                    </defs>
                    {Array.from({ length: 5 }).map((_, index) => {
                      const y =
                        chartConfig.padding +
                        (index / 4) * (chartConfig.height - chartConfig.padding * 2);
                      return (
                        <line
                          key={index}
                          x1={chartConfig.padding}
                          x2={chartConfig.width - chartConfig.padding}
                          y1={y}
                          y2={y}
                          stroke="rgba(148,163,184,0.2)"
                          strokeWidth="1"
                        />
                      );
                    })}
                    <line
                      x1={chartConfig.padding}
                      y1={chartConfig.padding}
                      x2={chartConfig.padding}
                      y2={chartConfig.height - chartConfig.padding}
                      stroke="rgba(148,163,184,0.35)"
                    />
                    <line
                      x1={chartConfig.width - chartConfig.padding}
                      y1={chartConfig.padding}
                      x2={chartConfig.width - chartConfig.padding}
                      y2={chartConfig.height - chartConfig.padding}
                      stroke="rgba(148,163,184,0.15)"
                    />
                    {chartGeometry.areaPath ? (
                      <path d={chartGeometry.areaPath} fill="url(#trendGradient)" stroke="none" />
                    ) : null}
                    {chartGeometry.linePath ? (
                      <path
                        d={chartGeometry.linePath}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ) : null}
                    {chartGeometry.coordinates.map((point, index) => (
                      <g key={`${point.x}-${index}`}>
                        <circle cx={point.x} cy={point.y} r="7" fill="#f97316" />
                        <circle cx={point.x} cy={point.y} r="12" fill="#f97316" opacity="0.16" />
                      </g>
                    ))}
                  </svg>
                  <div className="mt-6 flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.35em] text-slate-400">
                    {labels.map((label) => (
                      <span key={label} className="flex-1 min-w-0 text-center text-slate-500">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-lg shadow-slate-200/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-900">
                  Training log
                  <span className="text-xs font-normal uppercase tracking-[0.35em] text-slate-400">
                    Oct 13 – Oct 19
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-2">
                  {weeklyLog.map((day) => {
                    const size = day.distance || day.time ? Math.max(34, day.distance * 6 + day.time * 12) : 20;
                    return (
                      <div key={day.label} className="flex w-full flex-col items-center gap-2">
                        <div
                          className={`flex items-center justify-center rounded-full border bg-white transition ${
                            day.type ? typeStyles[day.type] : "border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                          style={{ width: size, height: size }}
                        >
                          <span className="text-xs font-semibold">
                            {day.distance > 0 ? day.distance.toFixed(1) : ""}
                          </span>
                        </div>
                        <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  Mix runs, rides, and strength to stay balanced and keep the streak rolling.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-200 bg-white shadow-md shadow-slate-200/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <CalendarDays className="h-4 w-4 text-orange-500" />
                  Quick actions
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Jump straight into your favorite follow-up actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-orange-500 text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Share2 className="h-4 w-4" />
                  {isSharing ? "Creating image…" : "Share snapshot"}
                </Button>
                <Button
                  onClick={handleSyncActivities}
                  disabled={!athleteId || isDashboardSyncing}
                  className="w-full rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isDashboardSyncing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Syncing…
                    </span>
                  ) : (
                    "Sync Activities"
                  )}
                </Button>
                {dashboardSyncState.status === "success" && dashboardSyncSummary ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
                    Last synced {new Date(dashboardSyncSummary.synced_at).toLocaleString()} ·{" "}
                    {dashboardSyncSummary.fetched} fetched
                  </p>
                ) : null}
                {dashboardSyncState.status === "error" ? (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
                    {dashboardSyncState.error}
                  </p>
                ) : null}
                <Button className="w-full rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100">
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-md shadow-slate-200/40">
              <CardHeader>
                <CardTitle className="text-slate-900">Navigation</CardTitle>
                <CardDescription className="text-slate-500">
                  Quick links to manage your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100">
                  Log out
                </Button>
                <Button className="w-full rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100">
                  Delete Account
                </Button>
                <Button className="w-full rounded-full border border-slate-200 bg-orange-50 text-orange-600 transition hover:bg-orange-100">
                  Invite a friend
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-md shadow-slate-200/40">
              <CardHeader>
                <CardTitle className="text-slate-900">Give a compliment</CardTitle>
                <CardDescription className="text-slate-500">
                  Give the builders a shout or share feedback for what comes next.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100">
                  Give a compliment
                </Button>
                <Button className="w-full rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
                  Give feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <svg
        ref={posterRef}
        className="hidden"
        width={sharePosterSize.width}
        height={sharePosterSize.height}
        viewBox={`0 0 ${sharePosterSize.width} ${sharePosterSize.height}`}
        role="presentation"
      >
        <defs>
          <linearGradient id="shareGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(249,115,22,0.35)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0.08)" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width={sharePosterSize.width}
          height={sharePosterSize.height}
          rx="36"
          fill="#ffffff"
        />
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
          {selectedMonth.monthName.toUpperCase()}
        </text>
        <text
          x="80"
          y="180"
          fill="#0f172a"
          fontFamily="Inter, sans-serif"
          fontSize="72"
          fontWeight="700"
        >
          {selectedMonth.daysActive}
        </text>
        <text
          x="200"
          y="150"
          fill="#475569"
          fontFamily="Inter, sans-serif"
          fontSize="18"
          letterSpacing="6"
        >
          ACTIVE DAYS
        </text>
        <text
          x="200"
          y="190"
          fill="#0f172a"
          fontFamily="Inter, sans-serif"
          fontSize="26"
          fontWeight="600"
        >
          {selectedMetricSummary.last.toFixed(1)} {shareMetricDescriptor.unit}
        </text>
        <text
          x="80"
          y="230"
          fill="#64748b"
          fontFamily="Inter, sans-serif"
          fontSize="18"
        >
          Distance {selectedMonth.totalDistance.toFixed(1)} km • Time {selectedMonth.totalTime.toFixed(1)} hrs • Elevation{" "}
          {Math.round(selectedMonth.totalElevation)} m
        </text>
        <svg
          x="80"
          y="260"
          width={shareChartConfig.width}
          height={shareChartConfig.height}
          viewBox={`0 0 ${shareChartConfig.width} ${shareChartConfig.height}`}
        >
          <rect
            x="0"
            y="0"
            width={shareChartConfig.width}
            height={shareChartConfig.height}
            fill="#fff"
            rx="28"
          />
          {Array.from({ length: 5 }).map((_, index) => {
            const y =
              shareChartConfig.padding +
              (index / 4) * (shareChartConfig.height - shareChartConfig.padding * 2);
            return (
              <line
                key={`share-grid-${index}`}
                x1={shareChartConfig.padding}
                x2={shareChartConfig.width - shareChartConfig.padding}
                y1={y}
                y2={y}
                stroke="rgba(203,213,225,0.5)"
                strokeWidth="1"
              />
            );
          })}
          {shareGeometry.areaPath ? (
            <path d={shareGeometry.areaPath} fill="url(#shareGradient)" stroke="none" />
          ) : null}
          {shareGeometry.linePath ? (
            <path
              d={shareGeometry.linePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {shareGeometry.coordinates.map((point, index) => (
            <g key={`share-point-${index}`}>
              <circle cx={point.x} cy={point.y} r="9" fill="#f97316" />
              <circle cx={point.x} cy={point.y} r="15" fill="#f97316" opacity="0.18" />
            </g>
          ))}
        </svg>
        {labels.map((label, index) => (
          <text
            key={`label-${label}`}
            x={
              80 +
              index *
                ((shareChartConfig.width - shareChartConfig.padding * 2) / (labels.length - 1 || 1))
            }
            y={520}
            fill="#64748b"
            fontFamily="Inter, sans-serif"
            fontSize="16"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
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

function buildChartGeometry(values, width, height, padding) {
  if (!values || values.length === 0) {
    return { areaPath: "", linePath: "", coordinates: [] };
  }

  const safePadding = typeof padding === "number" ? padding : 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const innerWidth = width - safePadding * 2;
  const innerHeight = height - safePadding * 2;
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  const coordinates = values.map((value, index) => {
    const x = safePadding + index * step;
    const normalized = (value - min) / range;
    const y = safePadding + (1 - normalized) * innerHeight;
    return { x, y, value };
  });

  if (coordinates.length === 1) {
    const point = coordinates[0];
    const baseY = height - safePadding;
    const areaPath = `M ${point.x} ${baseY} L ${point.x} ${point.y} L ${point.x + 1} ${baseY} Z`;
    const linePath = `M ${point.x} ${point.y}`;
    return { areaPath, linePath, coordinates };
  }

  const linePath = buildSmoothPath(coordinates);
  const areaPath = `${linePath} L ${coordinates.at(-1).x} ${height - safePadding} L ${coordinates[0].x} ${height - safePadding} Z`;

  return { areaPath, linePath, coordinates };
}

function buildSmoothPath(points) {
  if (!points || points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y}`;
  }

  const path = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const afterNext = points[index + 2] ?? next;

    const control1x = current.x + (next.x - previous.x) / 6;
    const control1y = current.y + (next.y - previous.y) / 6;
    const control2x = next.x - (afterNext.x - current.x) / 6;
    const control2y = next.y - (afterNext.y - current.y) / 6;

    path.push(`C ${control1x} ${control1y}, ${control2x} ${control2y}, ${next.x} ${next.y}`);
  }
  return path.join(" ");
}
