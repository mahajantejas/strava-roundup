import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function MonthlyLineChart({ monthlyData, onShare }) {
  const cardRef = useRef(null);

  const handleShare = () => {
    if (onShare) {
      onShare(cardRef.current, "Monthly Progress");
    } else {
      console.log("Shareable image coming soon");
    }
  };

  // Prepare data for the chart
  const months = Object.keys(monthlyData || {}).sort();
  const distances = months.map(month => monthlyData[month]?.totalDistanceKm || 0);
  
  // Find min and max for scaling
  const maxDistance = Math.max(...distances, 1);
  const minDistance = Math.min(...distances, 0);
  const range = maxDistance - minDistance || 1;

  // Generate SVG path
  const width = 300;
  const height = 120;
  const padding = 20;
  
  const points = distances.map((distance, index) => {
    const x = padding + (index / (distances.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((distance - minDistance) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <Card ref={cardRef} className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Monthly Progress</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex justify-center">
            <svg width={width} height={height} className="overflow-visible">
              {/* Area fill */}
              <path
                d={areaData}
                fill="rgba(249, 115, 22, 0.1)"
                stroke="none"
              />
              {/* Line */}
              <path
                d={pathData}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.split(',')[0]}
                  cy={point.split(',')[1]}
                  r="3"
                  fill="#f97316"
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
          
          {/* Month labels */}
          <div className="flex justify-between text-xs text-gray-500">
            {months.slice(0, 3).map(month => (
              <span key={month}>{month.slice(0, 3).toUpperCase()}</span>
            ))}
            {months.length > 3 && (
              <>
                <span>...</span>
                <span>{months[months.length - 1].slice(0, 3).toUpperCase()}</span>
              </>
            )}
          </div>
          
          {/* Y-axis labels */}
          <div className="flex justify-end text-xs text-gray-500">
            <div className="text-right">
              <div>{Math.round(maxDistance)} km</div>
              <div>{Math.round(maxDistance / 2)} km</div>
              <div>0 km</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

