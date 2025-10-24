import React, { useEffect, useRef, useState } from "react";

export default function ScrollStack({ children, onIndexChange }) {
  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;
    const sections = Array.from(root.querySelectorAll('[data-stack="section"]'));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const i = sections.findIndex((el) => el === visible.target);
        setIndex(i);
        if (onIndexChange) onIndexChange(i);
      },
      { root, threshold: [0.6, 0.75, 0.9] },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [onIndexChange]);

  const pages = Array.isArray(children) ? children : [children];

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[100svh] snap-y snap-mandatory overflow-y-auto scroll-smooth"
        style={{ overscrollBehavior: "contain" }}
      >
        {pages.map((child, i) => (
          <section key={i} data-stack="section" className="snap-start flex min-h-[100svh] flex-col">
            {child}
          </section>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {pages.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition ${i === index ? "bg-orange-500" : "bg-slate-300/60"}`}
          />
        ))}
      </div>
    </div>
  );
}

