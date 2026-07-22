'use client';

import { useEffect, useRef } from 'react';

export interface SwarmDot {
  /** Arbitrary group tags used by layouts (e.g. satisfaction band, work model). */
  tags: Record<string, string>;
}

export interface SwarmLayout {
  /** Returns target position (0..1 space) + color + alpha for a dot. */
  place: (dot: SwarmDot, index: number, total: number) => {
    x: number;
    y: number;
    color: string;
    alpha: number;
    r?: number;
    shape?: 'dot' | 'person';
  };
}

interface DotSwarmProps {
  dots: SwarmDot[];
  layout: SwarmLayout;
  className?: string;
}

/**
 * Canvas dot swarm. ~400 dots lerp toward the active layout's targets in a
 * rAF loop that pauses when converged or offscreen. Reduced motion jumps.
 */
export function DotSwarm({ dots, layout, className }: DotSwarmProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ x: number; y: number; color: string; alpha: number; r: number }[]>([]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const runningRef = useRef(false);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      if (e.isIntersecting) kick();
    });
    io.observe(canvas);

    if (stateRef.current.length !== dots.length) {
      stateRef.current = dots.map((d, i) => {
        const t = layoutRef.current.place(d, i, dots.length);
        return { x: t.x + (Math.sin(i * 999) * 0.3), y: t.y + (Math.cos(i * 777) * 0.3), color: t.color, alpha: 0, r: t.r ?? 3 };
      });
    }

    let raf = 0;
    function frame() {
      raf = 0;
      if (!visibleRef.current) { runningRef.current = false; return; }
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      let moving = 0;
      stateRef.current.forEach((s, i) => {
        const t = layoutRef.current.place(dots[i], i, dots.length);
        const k = reduced ? 1 : 0.085;
        s.x += (t.x - s.x) * k;
        s.y += (t.y - s.y) * k;
        s.alpha += ((t.alpha ?? 1) - s.alpha) * k;
        s.color = t.color;
        s.r = t.r ?? 3;
        if (Math.abs(t.x - s.x) + Math.abs(t.y - s.y) > 0.0005) moving++;
        ctx!.globalAlpha = Math.max(0, Math.min(1, s.alpha));
        ctx!.fillStyle = s.color;
        const x = s.x * w;
        const y = s.y * h;
        const radius = s.r * dpr;
        if (t.shape === 'person') {
          ctx!.beginPath();
          ctx!.arc(x, y - radius * 0.72, radius * 0.5, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.beginPath();
          ctx!.arc(x, y + radius * 0.92, radius, Math.PI, 0);
          ctx!.lineTo(x + radius, y + radius * 1.35);
          ctx!.lineTo(x - radius, y + radius * 1.35);
          ctx!.closePath();
          ctx!.fill();
        } else {
          ctx!.beginPath();
          ctx!.arc(x, y, radius, 0, Math.PI * 2);
          ctx!.fill();
        }
      });
      ctx!.globalAlpha = 1;
      if (moving > 0) raf = requestAnimationFrame(frame);
      else runningRef.current = false;
    }

    function kick() {
      if (!runningRef.current) {
        runningRef.current = true;
        raf = requestAnimationFrame(frame);
      }
    }
    kick();
    // re-kick whenever the layout changes
    const interval = setInterval(kick, 250);

    return () => {
      ro.disconnect();
      io.disconnect();
      clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
      runningRef.current = false;
    };
  }, [dots]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} aria-hidden="true" />;
}
