// Tiny dependency-free confetti burst on a throwaway full-screen canvas.
// Used to celebrate finishing a guided session.

const COLORS = ['#c41e3a', '#10b981', '#1a3a5c', '#e6b54a', '#1a1a1a'];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  color: string;
}

export function celebrate(durationMs = 1600): void {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const count = Math.min(160, Math.floor(W / 4));
  const pieces: Piece[] = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 120,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -12 - 4,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.4,
    size: Math.random() * 6 + 4,
    color: COLORS[(Math.random() * COLORS.length) | 0],
  }));

  const start = performance.now();
  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, W, H);
    for (const p of pieces) {
      p.vy += 0.45; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.globalAlpha = Math.max(0, 1 - elapsed / durationMs);
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    }
    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}
