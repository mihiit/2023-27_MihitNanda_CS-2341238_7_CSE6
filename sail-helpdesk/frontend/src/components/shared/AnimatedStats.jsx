import React, { useEffect, useRef, useState } from 'react';

/* Animated count-up number. Counts from 0 (or previous value) to `value`
   over `duration` ms using requestAnimationFrame with ease-out easing. */
export function CountUp({ value = 0, duration = 1200, decimals = 0, suffix = '', prefix = '', className = '' }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

/* Radial SVG gauge — animates its arc in via stroke-dashoffset transition
   (handled in CSS .gauge-progress). value 0-100. */
export function RadialGauge({ value = 0, size = 160, strokeWidth = 14, color = 'var(--sail)', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          className="gauge-track"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="gauge-progress"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: size * 0.22, color: 'var(--text)', lineHeight: 1 }}>
          <CountUp value={clamped} decimals={0} suffix="%" />
        </span>
        {label && <span className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-light)' }}>{label}</span>}
        {sublabel && <span className="text-[10px]" style={{ color: 'var(--text-light)' }}>{sublabel}</span>}
      </div>
    </div>
  );
}