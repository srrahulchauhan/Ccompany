import { useEffect, useRef, useState } from "react";

const defaultFormat = (value) => Math.round(value).toLocaleString("en-IN");

export default function AnimatedNumber({ value, format = defaultFormat, duration = 850, className = "" }) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [displayValue, setDisplayValue] = useState(0);
  const currentValue = useRef(0);

  useEffect(() => {
    const startValue = currentValue.current;
    const difference = target - startValue;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!difference || reduceMotion || duration <= 0) {
      currentValue.current = target;
      setDisplayValue(target);
      return undefined;
    }

    let frameId;
    let startTime;
    const animate = (time) => {
      if (startTime === undefined) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 4;
      const nextValue = startValue + difference * eased;
      currentValue.current = nextValue;
      setDisplayValue(nextValue);
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
      else currentValue.current = target;
    };
    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, duration]);

  return <span className={className} aria-label={format(target)} aria-live="off">{format(displayValue)}</span>;
}
