import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function CalendarGrid({ monthData, monthName, onShare }) {
  const cardRef = useRef(null);

  const handleShare = () => {
    if (onShare) {
      onShare(cardRef.current, `${monthName} Calendar`);
    } else {
      console.log("Shareable image coming soon");
    }
  };

  // Get activity icons based on type
  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'run':
      case 'running':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'ride':
      case 'cycling':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'weighttraining':
      case 'strengthtraining':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
            ?
          </div>
        );
    }
  };

  // Generate calendar grid for the month
  const generateCalendarGrid = () => {
    const days = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayActivities = monthData?.dailyActivities?.[day] || [];
      days.push({
        day,
        activities: dayActivities,
        isToday: day === today.getDate()
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarGrid();
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card ref={cardRef} className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{monthName} Calendar</CardTitle>
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
        <div className="space-y-3">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
            {dayNames.map(day => (
              <div key={day} className="p-1">{day}</div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayData, index) => {
              if (!dayData) {
                return <div key={index} className="h-8"></div>;
              }
              
              const { day, activities, isToday } = dayData;
              const hasActivities = activities.length > 0;
              
              return (
                <div
                  key={day}
                  className={`h-8 flex items-center justify-center text-sm relative ${
                    isToday ? 'bg-orange-100 rounded-full' : ''
                  }`}
                >
                  <span className={isToday ? 'font-bold text-orange-600' : ''}>
                    {day}
                  </span>
                  
                  {/* Activity indicators */}
                  {hasActivities && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {activities.slice(0, 2).map((activity, idx) => (
                        <div
                          key={idx}
                          className="w-2 h-2 bg-orange-500 rounded-full"
                          title={activity.type}
                        >
                          {idx === 0 && getActivityIcon(activity.type)}
                        </div>
                      ))}
                      {activities.length > 2 && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">
                          {activities.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Activity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-100 rounded-full"></div>
              <span>Today</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

