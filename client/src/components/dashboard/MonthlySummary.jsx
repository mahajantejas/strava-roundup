import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function MonthlySummary({ monthData, monthName, onShare }) {
  const cardRef = useRef(null);

  const handleShare = () => {
    if (onShare) {
      onShare(cardRef.current, `${monthName} Summary`);
    } else {
      // Fallback toast/tooltip
      console.log("Shareable image coming soon");
    }
  };

  return (
    <Card ref={cardRef} className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{monthName} TOTALS</CardTitle>
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
        <div className="grid grid-cols-2 gap-6">
          {/* Days Active */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {monthData?.daysActive || 0}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">DAYS</div>
          </div>
          
          {/* Stats Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {monthData?.totalHours ? Math.round(monthData.totalHours) : 0} HRS
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {monthData?.totalDistanceKm ? Math.round(monthData.totalDistanceKm * 10) / 10 : 0} KM
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {monthData?.elevationGainM ? Math.round(monthData.elevationGainM) : 0} M
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

