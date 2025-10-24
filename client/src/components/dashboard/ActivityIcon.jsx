import React from "react";
import { Bike, Footprints, Waves, Dumbbell, Activity, Mountain, Timer } from "lucide-react";

export function ActivityIcon({ type, className = "h-5 w-5" }) {
  const key = String(type || "").toLowerCase();
  const map = {
    run: Footprints,
    walk: Footprints,
    hike: Mountain,
    ride: Bike,
    cycling: Bike,
    swim: Waves,
    workout: Dumbbell,
    weighttraining: Dumbbell,
    strength: Dumbbell,
    elevation: Mountain,
    time: Timer,
  };
  const Icon = map[key] || Activity;
  return <Icon className={className} aria-hidden="true" />;
}

export default ActivityIcon;

