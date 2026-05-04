"use client";

import { useEffect, useRef, MutableRefObject } from "react";

interface Props {
  isSpeaking:   boolean;
  isListening?: boolean;
  analyserRef?: MutableRefObject<AnalyserNode | null>;
}

/* ── palette ── */
const C = {
  bg0:    "#1A0F2E",
  bg1:    "#2D1F4A",
  skinHi: "#F2C49C",
  skinMd: "#E0A070",
  skinSh: "#C07848",
  skinSh2:"#A85E30",
  hair:   "#120800",
  hairHi: "#2A1000",
  eyeW:   "#F5F0E8",
  iris:   "#3A1C06",
  pupil:  "#080300",
  lash:   "#080400",
  brow:   "#1A0800",
  lipTop: "#C45870",
  lipBot: "#B04060",
  lipOut: "#8C2E48",
  teeth:  "#F2F0E4",
  blush:  "rgba(210,110,110,0.22)",
  neck:   "#D09060",
  collar: "#4A3060",
  collarHi: "#6A4880",
  shine:  "rgba(255,255,255,0.55)",
};

/* ── canvas dimensions ── */
const W = 380;
const H = 480;

/* ── animation state ── */
interface AState {
  jaw:         number;
  spread:      number;
  jawT:        number;
  spreadT:     number;
  blink:       number;
  blinkTimer:  number;
  blinking:    boolean;
  time:        number;
  breathY:     number;
  eyeShiftX:   number;
  eyeShiftY:   number;
  eyeTimer:    number;
  lastAmp:     number;
}

/* ── helpers ── */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function ellipsePath(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/* ════════════════════════════════════════════════════════════
   DRAWING FUNCTIONS
   ════════════════════════════════════════════════════════════ */

function drawBg(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(W / 2, H * 0.35, 60, W / 2, H * 0.5, W * 0.85);
  g.addColorStop(0, C.bg1);
  g.addColorStop(1, C.bg0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawShoulders(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  /* neck */
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy + 92);
  ctx.bezierCurveTo(cx - 20, cy + 130, cx - 18, cy + 155, cx - 24, cy + 175);
  ctx.lineTo(cx + 24, cy + 175);
  ctx.bezierCurveTo(cx + 18, cy + 155, cx + 20, cy + 130, cx + 22, cy + 92);
  ctx.closePath();
  ctx.fillStyle = C.neck;
  ctx.fill();

  /* collar shadow on neck */
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 168);
  ctx.bezierCurveTo(cx - 18, cy + 160, cx + 18, cy + 160, cx + 24, cy + 168);
  ctx.lineTo(cx + 24, cy + 175);
  ctx.lineTo(cx - 24, cy + 175);
  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();

  /* shoulders — blouse */
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, cy + 165);
  ctx.bezierCurveTo(cx * 0.2, cy + 145, cx * 0.5, cy + 140, cx - 24, cy + 172);
  ctx.lineTo(cx + 24, cy + 172);
  ctx.bezierCurveTo(cx * 1.5, cy + 140, cx * 1.8, cy + 145, W, cy + 165);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = C.collar;
  ctx.fill();

  /* collar highlight */
  ctx.beginPath();
  ctx.moveTo(cx - 70, cy + 145);
  ctx.bezierCurveTo(cx - 30, cy + 135, cx + 30, cy + 135, cx + 70, cy + 145);
  ctx.strokeStyle = C.collarHi;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawHairBack(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  /* back hair mass */
  ctx.beginPath();
  ctx.ellipse(cx, cy - 5, 86, 96, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.hair;
  ctx.fill();

  /* bun at top */
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy - 88, 26, 22, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = C.hair;
  ctx.fill();

  /* bun highlight */
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 94, 10, 8, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = C.hairHi;
  ctx.fill();
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();

  /* main face */
  const faceG = ctx.createRadialGradient(cx - 18, cy - 25, 20, cx, cy + 10, 100);
  faceG.addColorStop(0, C.skinHi);
  faceG.addColorStop(0.6, C.skinMd);
  faceG.addColorStop(1, C.skinSh);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 72, 90, 0, 0, Math.PI * 2);
  ctx.fillStyle = faceG;
  ctx.fill();

  /* jaw definition */
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 71, 89, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(140,80,30,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();

  /* cheek blush L */
  const blushL = ctx.createRadialGradient(cx - 46, cy + 22, 0, cx - 46, cy + 22, 26);
  blushL.addColorStop(0, C.blush);
  blushL.addColorStop(1, "rgba(210,110,110,0)");
  ellipsePath(ctx, cx - 46, cy + 22, 26, 18);
  ctx.fillStyle = blushL;
  ctx.fill();

  /* cheek blush R */
  const blushR = ctx.createRadialGradient(cx + 46, cy + 22, 0, cx + 46, cy + 22, 26);
  blushR.addColorStop(0, C.blush);
  blushR.addColorStop(1, "rgba(210,110,110,0)");
  ellipsePath(ctx, cx + 46, cy + 22, 26, 18);
  ctx.fillStyle = blushR;
  ctx.fill();

  /* forehead highlight */
  const fhG = ctx.createRadialGradient(cx, cy - 52, 5, cx, cy - 40, 40);
  fhG.addColorStop(0, "rgba(255,255,240,0.28)");
  fhG.addColorStop(1, "rgba(255,255,240,0)");
  ellipsePath(ctx, cx, cy - 40, 38, 28);
  ctx.fillStyle = fhG;
  ctx.fill();

  ctx.restore();
}

function drawEars(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  for (const side of [-1, 1]) {
    const ex = cx + side * 72;
    const ey = cy + 6;
    ellipsePath(ctx, ex, ey, 11, 16);
    ctx.fillStyle = C.skinMd;
    ctx.fill();
    /* inner ear */
    ellipsePath(ctx, ex + side * 2, ey, 6, 10);
    ctx.fillStyle = C.skinSh;
    ctx.fill();
    /* small earring */
    ellipsePath(ctx, ex, ey + 16, 4, 4);
    ctx.fillStyle = "#D4AF37";
    ctx.fill();
    ctx.strokeStyle = "#B8940A";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHairFront(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  /* hairline curve */
  ctx.beginPath();
  ctx.moveTo(cx - 72, cy - 30);
  ctx.bezierCurveTo(cx - 60, cy - 90, cx - 20, cy - 102, cx, cy - 100);
  ctx.bezierCurveTo(cx + 20, cy - 102, cx + 60, cy - 90, cx + 72, cy - 30);
  ctx.bezierCurveTo(cx + 60, cy - 72, cx + 30, cy - 88, cx, cy - 88);
  ctx.bezierCurveTo(cx - 30, cy - 88, cx - 60, cy - 72, cx - 72, cy - 30);
  ctx.fillStyle = C.hair;
  ctx.fill();

  /* centre part highlight */
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 100);
  ctx.bezierCurveTo(cx - 2, cy - 80, cx, cy - 68, cx + 2, cy - 58);
  ctx.strokeStyle = C.hairHi;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  /* wispy side strands */
  for (const [sx, sy, ex, ey, c1x, c1y, c2x, c2y] of [
    [cx - 62, cy - 68, cx - 72, cy - 10, cx - 80, cy - 50, cx - 78, cy - 30],
    [cx + 62, cy - 68, cx + 72, cy - 10, cx + 80, cy - 50, cx + 78, cy - 30],
  ] as number[][]) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
    ctx.strokeStyle = C.hairHi;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyebrows(ctx: CanvasRenderingContext2D, cx: number, cy: number, isListening: boolean) {
  ctx.save();
  const lift = isListening ? -3 : 0;
  for (const side of [-1, 1]) {
    const bx = cx + side * 34;
    const by = cy - 48 + lift;
    ctx.beginPath();
    ctx.moveTo(bx - side * 20, by + 5);
    ctx.bezierCurveTo(
      bx - side * 8,  by - 3,
      bx + side * 8,  by - 5,
      bx + side * 20, by + 2,
    );
    ctx.strokeStyle = C.brow;
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.stroke();
    /* inner brow hairs */
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.hairHi;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  blink: number,
  eyeShiftX: number, eyeShiftY: number,
) {
  ctx.save();
  for (const side of [-1, 1]) {
    const ex = cx + side * 34;
    const ey = cy - 22;
    const ew = 22, eh = 12;

    ctx.save();
    /* eye clip */
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, eh * (1 - blink * 0.98), 0, 0, Math.PI * 2);
    ctx.clip();

    /* white */
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.eyeW;
    ctx.fill();

    /* iris */
    const ix = ex + eyeShiftX * 5;
    const iy = ey + eyeShiftY * 3;
    const irisG = ctx.createRadialGradient(ix - 3, iy - 3, 1, ix, iy, 10);
    irisG.addColorStop(0, "#7A4A20");
    irisG.addColorStop(0.4, C.iris);
    irisG.addColorStop(1, "#1A0800");
    ellipsePath(ctx, ix, iy, 10, 10);
    ctx.fillStyle = irisG;
    ctx.fill();

    /* pupil */
    ellipsePath(ctx, ix, iy, 5, 5);
    ctx.fillStyle = C.pupil;
    ctx.fill();

    /* iris shine */
    ellipsePath(ctx, ix - 3, iy - 3, 2.5, 2.5);
    ctx.fillStyle = C.shine;
    ctx.fill();
    ellipsePath(ctx, ix + 4, iy + 2, 1, 1);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fill();

    ctx.restore();

    /* upper eyelid shadow */
    ctx.beginPath();
    ctx.ellipse(ex, ey - eh * 0.3, ew, eh * 0.55, 0, Math.PI, 0);
    ctx.fillStyle = "rgba(60,20,10,0.15)";
    ctx.fill();

    /* upper lashes */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew + 2, (eh + 2) * (1 - blink * 0.98), 0, 0, Math.PI * 2);
    ctx.clip();
    const numLashes = 9;
    for (let i = 0; i < numLashes; i++) {
      const angle = Math.PI + (i / (numLashes - 1)) * Math.PI;
      const lx = ex + Math.cos(angle) * (ew + 1);
      const ly = ey + Math.sin(angle) * (eh + 1) * (1 - blink * 0.98);
      const spread = (i / (numLashes - 1) - 0.5) * 0.3;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(angle + spread) * 7, ly + Math.sin(angle + spread) * 4 - 2);
      ctx.strokeStyle = C.lash;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.restore();

    /* lower lash line */
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI);
    ctx.strokeStyle = "rgba(30,10,5,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    /* eyelid crease */
    ctx.beginPath();
    ctx.ellipse(ex, ey - 4, ew * 0.85, eh * 0.5 * (1 - blink * 0.95), 0, Math.PI, 0);
    ctx.strokeStyle = "rgba(150,80,40,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawNose(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  const nx = cx, ny = cy + 22;

  /* nose bridge */
  ctx.beginPath();
  ctx.moveTo(nx - 6, ny - 22);
  ctx.bezierCurveTo(nx - 8, ny - 10, nx - 10, ny, nx - 11, ny + 8);
  ctx.strokeStyle = "rgba(140,70,30,0.22)";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.stroke();

  /* nostrils */
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(nx + side * 11, ny + 8, 7, 5, side * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(140,70,30,0.18)";
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(nx + side * 13, ny + 10, 4, 3, side * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(80,30,10,0.35)";
    ctx.fill();
  }

  /* nose tip highlight */
  const nhG = ctx.createRadialGradient(nx + 2, ny + 4, 0, nx + 2, ny + 4, 9);
  nhG.addColorStop(0, "rgba(255,240,220,0.35)");
  nhG.addColorStop(1, "rgba(255,240,220,0)");
  ellipsePath(ctx, nx + 2, ny + 4, 9, 7);
  ctx.fillStyle = nhG;
  ctx.fill();

  ctx.restore();
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  jaw: number,
  spread: number,
) {
  ctx.save();
  const my = cy + 60;
  const mw = 36;

  /* how much corners pull back/pucker */
  const cw  = mw + spread * 9;
  const cDip = -spread * 4;  /* corners dip when spread (smile), rise when rounded */
  const openH = jaw * 30;

  if (jaw < 0.04) {
    /* ── closed mouth: resting smile ── */
    ctx.beginPath();
    ctx.moveTo(cx - mw, my);
    ctx.bezierCurveTo(cx - mw * 0.4, my - 6, cx + mw * 0.4, my - 6, cx + mw, my);
    ctx.bezierCurveTo(cx + mw * 0.4, my + 5, cx - mw * 0.4, my + 5, cx - mw, my);
    ctx.closePath();
    ctx.fillStyle = C.lipTop;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - mw, my);
    ctx.bezierCurveTo(cx - mw * 0.4, my - 6, cx + mw * 0.4, my - 6, cx + mw, my);
    ctx.strokeStyle = C.lipOut;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    /* ── open mouth ── */

    /* mouth cavity */
    ctx.beginPath();
    ctx.moveTo(cx - cw + 3, my + cDip + 2);
    ctx.bezierCurveTo(
      cx - cw * 0.4, my + openH * 0.85,
      cx + cw * 0.4, my + openH * 0.85,
      cx + cw - 3,   my + cDip + 2,
    );
    ctx.bezierCurveTo(
      cx + cw * 0.3, my - 4 + cDip,
      cx - cw * 0.3, my - 4 + cDip,
      cx - cw + 3,   my + cDip + 2,
    );
    ctx.fillStyle = "#2A0810";
    ctx.fill();

    /* teeth (show when jaw opens enough) */
    if (jaw > 0.18) {
      const tAlpha = clamp((jaw - 0.18) / 0.25, 0, 1);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - cw + 5, my + cDip + 2);
      ctx.bezierCurveTo(
        cx - cw * 0.4, my + openH * 0.5,
        cx + cw * 0.4, my + openH * 0.5,
        cx + cw - 5,   my + cDip + 2,
      );
      ctx.bezierCurveTo(
        cx + cw * 0.25, my - 2 + cDip,
        cx - cw * 0.25, my - 2 + cDip,
        cx - cw + 5,    my + cDip + 2,
      );
      ctx.clip();
      /* upper teeth */
      const tg = ctx.createLinearGradient(cx, my - 4, cx, my + openH * 0.45);
      tg.addColorStop(0, `rgba(242,240,228,${tAlpha})`);
      tg.addColorStop(1, `rgba(200,198,185,${tAlpha})`);
      ctx.fillStyle = tg;
      ctx.fillRect(cx - cw, my - 10, cw * 2, openH * 0.45);
      /* tooth lines */
      ctx.strokeStyle = `rgba(170,168,155,${tAlpha * 0.6})`;
      ctx.lineWidth = 0.8;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 12, my - 4);
        ctx.lineTo(cx + i * 12, my + openH * 0.45);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* upper lip */
    ctx.beginPath();
    /* left corner → cupid's bow left → peak left */
    ctx.moveTo(cx - cw, my + cDip);
    ctx.bezierCurveTo(cx - cw * 0.6, my - 3 + cDip, cx - 12, my - 12, cx, my - 13);
    /* peak right → cupid's bow right → right corner */
    ctx.bezierCurveTo(cx + 12, my - 12, cx + cw * 0.6, my - 3 + cDip, cx + cw, my + cDip);
    /* lower edge of upper lip */
    ctx.bezierCurveTo(cx + cw * 0.3, my - 1 + cDip, cx - cw * 0.3, my - 1 + cDip, cx - cw, my + cDip);
    ctx.closePath();
    const ulG = ctx.createLinearGradient(cx, my - 13, cx, my);
    ulG.addColorStop(0, C.lipTop);
    ulG.addColorStop(1, C.lipOut);
    ctx.fillStyle = ulG;
    ctx.fill();

    /* lower lip */
    ctx.beginPath();
    ctx.moveTo(cx - cw, my + cDip);
    ctx.bezierCurveTo(
      cx - cw * 0.5, my + openH + 6,
      cx + cw * 0.5, my + openH + 6,
      cx + cw,       my + cDip,
    );
    ctx.bezierCurveTo(
      cx + cw * 0.3, my + openH * 0.7,
      cx - cw * 0.3, my + openH * 0.7,
      cx - cw,       my + cDip,
    );
    ctx.closePath();
    const llG = ctx.createLinearGradient(cx, my, cx, my + openH + 6);
    llG.addColorStop(0, C.lipBot);
    llG.addColorStop(0.6, C.lipTop);
    llG.addColorStop(1, C.lipOut);
    ctx.fillStyle = llG;
    ctx.fill();

    /* lower lip highlight */
    const llhG = ctx.createRadialGradient(cx, my + openH * 0.35, 0, cx, my + openH * 0.35, 16);
    llhG.addColorStop(0, "rgba(255,200,200,0.35)");
    llhG.addColorStop(1, "rgba(255,200,200,0)");
    ellipsePath(ctx, cx, my + openH * 0.35, 16, 9);
    ctx.fillStyle = llhG;
    ctx.fill();

    /* lip outline */
    ctx.beginPath();
    ctx.moveTo(cx - cw, my + cDip);
    ctx.bezierCurveTo(cx - cw * 0.6, my - 3 + cDip, cx - 12, my - 12, cx, my - 13);
    ctx.bezierCurveTo(cx + 12, my - 12, cx + cw * 0.6, my - 3 + cDip, cx + cw, my + cDip);
    ctx.strokeStyle = C.lipOut;
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function Avatar2D({ isSpeaking, isListening = false, analyserRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const stateRef  = useRef<AState>({
    jaw: 0, spread: 0, jawT: 0, spreadT: 0,
    blink: 0, blinkTimer: 2.5 + Math.random() * 2,
    blinking: false,
    time: 0, breathY: 0,
    eyeShiftX: 0, eyeShiftY: 0, eyeTimer: 3 + Math.random() * 3,
    lastAmp: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* hi-DPI support */
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    let lastTime = performance.now();

    function frame(now: number) {
      const dt  = Math.min((now - lastTime) / 1000, 0.05);
      lastTime  = now;
      const s   = stateRef.current;
      s.time   += dt;

      /* ── audio analysis ── */
      const analyser = analyserRef?.current;
      if (analyser && isSpeaking) {
        const buf  = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buf);

        /* amplitude — drives jaw */
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const amp = sum / buf.length / 255;

        /* frequency centroid — drives spread (bright=ee, dark=oh) */
        let wSum = 0, wTot = 0;
        for (let i = 0; i < buf.length; i++) { wSum += i * buf[i]; wTot += buf[i]; }
        const centroid = wTot > 0 ? wSum / wTot / buf.length : 0.5;

        s.jawT    = clamp(amp * 4.2, 0, 1);
        s.spreadT = clamp((centroid - 0.35) * 2.5, -0.8, 1);
        s.lastAmp = amp;
      } else {
        /* smooth close */
        s.jawT    = 0;
        s.spreadT = 0;
      }

      /* lerp mouth state (faster open, slower close for natural feel) */
      const openSpeed  = 0.55;
      const closeSpeed = 0.25;
      s.jaw    = lerp(s.jaw,    s.jawT,    s.jaw < s.jawT    ? openSpeed  : closeSpeed);
      s.spread = lerp(s.spread, s.spreadT, 0.3);

      /* ── blink ── */
      s.blinkTimer -= dt;
      if (!s.blinking && s.blinkTimer <= 0) {
        s.blinking   = true;
        s.blinkTimer = 3 + Math.random() * 4;
      }
      if (s.blinking) {
        s.blink += dt * 18;
        if (s.blink >= 1) { s.blink = 1; }
        if (s.blink > 0.8) { s.blink -= dt * 14; }
        if (s.blink <= 0)  { s.blink = 0; s.blinking = false; }
      }

      /* ── subtle eye wander ── */
      s.eyeTimer -= dt;
      if (s.eyeTimer <= 0) {
        s.eyeShiftX  = (Math.random() - 0.5) * 1.2;
        s.eyeShiftY  = (Math.random() - 0.5) * 0.6;
        s.eyeTimer   = 2 + Math.random() * 4;
      }

      /* ── breathing bob ── */
      s.breathY = Math.sin(s.time * (isSpeaking ? 1.8 : 0.55)) * (isSpeaking ? 1.2 : 0.8);

      /* ── draw ── */
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.44 + s.breathY;

      drawBg(ctx);
      drawShoulders(ctx, cx, cy);
      drawHairBack(ctx, cx, cy);
      drawFace(ctx, cx, cy);
      drawEars(ctx, cx, cy);
      drawHairFront(ctx, cx, cy);
      drawEyebrows(ctx, cx, cy, isListening);
      drawEyes(ctx, cx, cy, s.blink, s.eyeShiftX, s.eyeShiftY);
      drawNose(ctx, cx, cy);
      drawMouth(ctx, cx, cy, s.jaw, s.spread);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isSpeaking, isListening, analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}
