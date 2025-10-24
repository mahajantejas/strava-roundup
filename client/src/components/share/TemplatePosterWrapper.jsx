import React from "react";
import SharePoster from "./SharePoster";

// Import the SVG template as raw text (Vite supports ?raw imports)
import template from "../../public/ShareTemplateV23Oct.svg?raw";

export default function TemplatePosterWrapper({ athlete, summary, metrics, className }) {
  return (
    <div className={className}>
      <SharePoster
        templateSvg={template}
        monthLabel={summary?.month}
        athleteName={athlete?.name}
        athleteInitial={athlete?.name ? athlete.name[0] : "A"}
        metrics={metrics}
        distanceHeadline={summary?.headline}
        summaryLine={summary?.line}
        posterYear={summary?.year}
        posterImage={athlete?.photo}
      />
    </div>
  );
}
