import React, { forwardRef } from "react";

export const sharePosterTokens = {
  size: { width: 1080, height: 1920 },
  palette: {
    backgroundTop: "#040611",
    backgroundMid: "#0b1424",
    backgroundBottom: "#111d33",
    accentStart: "#ff7f3f",
    accentEnd: "#f97316",
    cardTop: "#1e293b",
    cardBottom: "#0f172a",
    cardStroke: "rgba(148, 163, 184, 0.2)",
    primaryText: "#f8fafc",
    secondaryText: "#cbd5f5",
    tertiaryText: "#94a3b8",
    headline: "#fde68a",
    label: "#f97316",
    photoFallbackStart: "#fb923c",
    photoFallbackEnd: "#f97316",
    baselineStroke: "rgba(148, 163, 184, 0.18)",
    photoOutline: "rgba(248, 250, 252, 0.2)",
  },
  typography: {
    family: "Inter, sans-serif",
    monthSize: 28,
    heroSize: 74,
    subheadSize: 28,
    metricLabelSize: 22,
    metricValueSize: 52,
    metricCaptionSize: 20,
    headlineSize: 36,
    summarySize: 26,
    footerSize: 22,
  },
  layout: {
    padding: 120,
    photo: { x: 180, y: 320, size: 720, radius: 72 },
    metrics: { cardWidth: 360, cardHeight: 210, hGap: 300, vGap: 40, startY: 1150 },
    accentPath: "M-160 360 Q520 100 1140 540 L1140 860 Q520 600 -160 940 Z",
    ribbonPath: "M120 1060 C320 900 760 900 960 1060",
  },
};

const SharePoster = forwardRef(
  (
    {
      className,
      size = sharePosterTokens.size,
      tokens = sharePosterTokens,
      monthLabel,
      athleteName,
      athleteInitial,
      metrics,
      distanceHeadline,
      summaryLine,
      posterYear,
      posterImage,
    },
    ref,
  ) => {
    const { width, height } = size;
    const { palette, typography, layout } = tokens;
    const { photo, metrics: metricLayout } = layout;
    const metricCards = Array.isArray(metrics) ? metrics.slice(0, 4) : [];

    return (
      <svg
        ref={ref}
        className={className}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="presentation"
      >
        <defs>
          <linearGradient id="poster-bg" x1="0" y1="0" x2="0.95" y2="1">
            <stop offset="0%" stopColor={palette.backgroundTop} />
            <stop offset="40%" stopColor={palette.backgroundMid} />
            <stop offset="100%" stopColor={palette.backgroundBottom} />
          </linearGradient>
          <linearGradient id="poster-accent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={palette.accentStart} />
            <stop offset="100%" stopColor={palette.accentEnd} />
          </linearGradient>
          <linearGradient id="metric-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.cardTop} stopOpacity="0.94" />
            <stop offset="100%" stopColor={palette.cardBottom} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="avatar-fallback" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.photoFallbackStart} />
            <stop offset="100%" stopColor={palette.photoFallbackEnd} />
          </linearGradient>
          <clipPath id="athlete-avatar">
            <rect x={photo.x} y={photo.y} width={photo.size} height={photo.size} rx={photo.radius} />
          </clipPath>
        </defs>

        <rect width={width} height={height} fill="url(#poster-bg)" />
        <path d={layout.accentPath} fill="url(#poster-accent)" opacity="0.65" />
        <path
          d={layout.ribbonPath}
          fill="none"
          stroke={palette.baselineStroke}
          strokeWidth="8"
          strokeLinecap="round"
        />

        <text
          x={layout.padding}
          y="180"
          fill={palette.headline}
          fontFamily={typography.family}
          fontSize={typography.monthSize}
          fontWeight="600"
          letterSpacing="8"
        >
          {monthLabel?.toUpperCase()}
        </text>
        <text
          x={layout.padding}
          y="260"
          fill={palette.primaryText}
          fontFamily={typography.family}
          fontSize={typography.heroSize}
          fontWeight="700"
        >
          {athleteName}
        </text>
        <text
          x={layout.padding}
          y="316"
          fill={palette.secondaryText}
          fontFamily={typography.family}
          fontSize={typography.subheadSize}
        >
          Monthly Roundup Snapshot
        </text>

        <g clipPath="url(#athlete-avatar)">
          <rect x={photo.x} y={photo.y} width={photo.size} height={photo.size} fill={palette.cardBottom} />
          {posterImage ? (
            <image
              href={posterImage}
              x={photo.x}
              y={photo.y}
              width={photo.size}
              height={photo.size}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <>
              <rect x={photo.x} y={photo.y} width={photo.size} height={photo.size} fill="url(#avatar-fallback)" />
              <text
                x={photo.x + photo.size / 2}
                y={photo.y + photo.size / 2}
                fill="#fff7ed"
                fontFamily={typography.family}
                fontSize="220"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {athleteInitial || "A"}
              </text>
            </>
          )}
        </g>
        <rect
          x={photo.x}
          y={photo.y}
          width={photo.size}
          height={photo.size}
          rx={photo.radius}
          fill="none"
          stroke={palette.photoOutline}
          strokeWidth="6"
        />

        {metricCards.map((metric, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          const cardX = layout.padding + column * (metricLayout.cardWidth + metricLayout.hGap);
          const cardY = metricLayout.startY + row * (metricLayout.cardHeight + metricLayout.vGap);
          const label = typeof metric.label === "string" ? metric.label : "";

          return (
            <g key={metric.id ?? index} transform={`translate(${cardX}, ${cardY})`}>
              <rect
                width={metricLayout.cardWidth}
                height={metricLayout.cardHeight}
                rx="28"
                fill="url(#metric-card)"
                stroke={palette.cardStroke}
                strokeWidth="2"
              />
              <path
                d={`M30 52 L${metricLayout.cardWidth - 30} 52`}
                stroke="rgba(249, 115, 22, 0.45)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <text
                x="30"
                y="92"
                fill={palette.label}
                fontFamily={typography.family}
                fontSize={typography.metricLabelSize}
                fontWeight="600"
                letterSpacing="4"
              >
                {label.toUpperCase()}
              </text>
              <text
                x="30"
                y="152"
                fill={palette.primaryText}
                fontFamily={typography.family}
                fontSize={typography.metricValueSize}
                fontWeight="700"
              >
                {metric.value}
              </text>
              <text
                x="30"
                y="188"
                fill={palette.secondaryText}
                fontFamily={typography.family}
                fontSize={typography.metricCaptionSize}
              >
                {metric.caption}
              </text>
            </g>
          );
        })}

        <text
          x={layout.padding}
          y="1700"
          fill={palette.primaryText}
          fontFamily={typography.family}
          fontSize={typography.headlineSize}
          fontWeight="600"
        >
          {distanceHeadline}
        </text>
        <text
          x={layout.padding}
          y="1760"
          fill={palette.secondaryText}
          fontFamily={typography.family}
          fontSize={typography.summarySize}
        >
          {summaryLine}
        </text>
        <text
          x={width - layout.padding}
          y={height - 120}
          fill={palette.tertiaryText}
          fontFamily={typography.family}
          fontSize={typography.footerSize}
          textAnchor="end"
        >
          Strava Roundup • {posterYear}
        </text>
      </svg>
    );
  },
);

SharePoster.displayName = "SharePoster";

export default SharePoster;

