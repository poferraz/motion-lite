import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import SplitType from "split-type";

gsap.registerPlugin(Flip);

type Opts = { reducedMotion?: boolean };

// one cleanup handle for this module
let cleanupCtx: (() => void) | null = null;
let ctxRef: gsap.Context | null = null;

export function mountLandingAnimations(root: HTMLElement, opts: Opts = {}) {
  // ensure previous timelines and listeners are removed
  unmountLandingAnimations();
  if (opts.reducedMotion) return;

  const ctx = gsap.context(() => {
    const titleEl = root.querySelector<HTMLElement>("[data-landing-title]");
    const subtitleEl = root.querySelector<HTMLElement>("[data-landing-subtitle]");
    const countEl = root.querySelector<HTMLElement>("[data-landing-count]");
    const lastUploadEl = root.querySelector<HTMLElement>("[data-landing-last-upload]");
    const updateCards = root.querySelectorAll<HTMLElement>("[data-landing-update]");
    const primaryCta = root.querySelector<HTMLButtonElement>("[data-landing-cta]");
    const replaceBtn = root.querySelector<HTMLButtonElement>("[data-landing-replace]");
    const resetBtn = root.querySelector<HTMLButtonElement>("[data-landing-reset]");

    // first run if no count block on the page
    const isFirstRun = !countEl;

    // delay map
    const delays = {
      entrance: isFirstRun ? 0.28 : 0.18,
      sweep: isFirstRun ? 0.35 : 0.20,
    };

    // entrance timeline
    const tl = gsap.timeline({ defaults: { duration: 0.8, ease: "power2.out" } });
    let split: SplitType | null = null;

    if (titleEl) {
      split = new SplitType(titleEl, { types: "chars" });
      tl.from(split.chars, { y: 10, opacity: 0, rotate: 0.25, stagger: 0.012 }, 0);
    }
    if (subtitleEl) tl.from(subtitleEl, { y: 8, opacity: 0 }, 0.05);
    if (countEl) tl.from(countEl, { y: 8, opacity: 0 }, 0.10);
    if (lastUploadEl) tl.from(lastUploadEl, { y: 8, opacity: 0 }, 0.12);
    if (updateCards.length) tl.from(updateCards, { y: 12, opacity: 0, stagger: 0.03 }, 0.16);

    if (primaryCta) {
      buildHeroButtonEffects(primaryCta, { entranceDelay: delays.entrance, sweepDelay: delays.sweep });
    }
    if (replaceBtn) attachPressFeedback(replaceBtn);
    if (resetBtn) attachPressFeedback(resetBtn);

    // register cleanup specific to this mount
    const localCleanup = () => {
      tl.kill();
      split?.revert();
      // remove shine wrappers we injected
      root.querySelectorAll<HTMLElement>("[data-shine]").forEach((n) => n.remove());
      // kill any remaining tweens on pressables
      gsap.killTweensOf(root.querySelectorAll("[data-pressable]"));
    };

    cleanupCtx = () => {
      localCleanup();
      ctxRef?.revert();
      cleanupCtx = null;
    };
  }, root);
  ctxRef = ctx;
}

export function unmountLandingAnimations() {
  if (cleanupCtx) {
    cleanupCtx();
    cleanupCtx = null;
  }
  if (ctxRef) {
    ctxRef.revert();
    ctxRef = null;
  }
}

// Flip helpers used by your component
export function captureLandingFlipState(root: HTMLElement) {
  const tracked = [
    root.querySelector("[data-landing-count]"),
    root.querySelector("[data-landing-cta]"),
  ].filter(Boolean) as Element[];
  return tracked.length ? Flip.getState(tracked) : null;
}

export function animateLandingFlipFrom(state: Flip.FlipState | null) {
  if (!state) return;
  Flip.from(state, {
    duration: 0.65,
    ease: "power3.out",
    absolute: true,
    nested: true,
    prune: true,
  });
}

/**
 * Premium CTA pack
 * Adds: Flip entrance, glow ramp, shine sweep, idle shimmer, crisp press, focus glow
 */
function buildHeroButtonEffects(
  btn: HTMLButtonElement,
  opts: { entranceDelay?: number; sweepDelay?: number } = {}
) {
  // add shine once
  let shine = btn.querySelector<HTMLElement>("[data-shine]");
  if (!shine) {
    shine = document.createElement("span");
    shine.setAttribute("data-shine", "true");
    shine.style.position = "absolute";
    shine.style.inset = "0";
    shine.style.borderRadius = "inherit";
    shine.style.pointerEvents = "none";
    shine.style.overflow = "hidden";
    const strip = document.createElement("span");
    strip.style.position = "absolute";
    strip.style.top = "0";
    strip.style.bottom = "0";
    strip.style.width = "35%";
    strip.style.left = "-40%";
    strip.style.background =
      "linear-gradient(110deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%)";
    strip.style.filter = "blur(6px)";
    shine.appendChild(strip);
    btn.style.position = "relative";
    btn.appendChild(shine);
  }
  const strip = shine.querySelector<HTMLSpanElement>("span");
  if (strip) {
    // Ensure shine starts offscreen for clean previews
    strip.style.transform = "translateX(-40%)";
  }

  // New entrance: width pop + scale pop with shadow ramp
  const entrance = gsap.timeline({ delay: opts.entranceDelay ?? 0.18 });

  entrance.fromTo(
    btn,
    { scaleX: 0.96, scaleY: 0.98, filter: "saturate(0.9)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
    {
      scaleX: 1,
      scaleY: 1,
      filter: "saturate(1)",
      duration: 0.9,
      ease: "power3.out",
    }
  );

  entrance.to(
    btn,
    { boxShadow: "0 10px 24px rgba(59,130,246,0.35)", duration: 0.9, ease: "power3.out" },
    0
  );

  // shine sweep
  if (strip) {
    entrance.to(
      strip,
      { xPercent: 220, duration: 1.2, ease: "power2.out" },
      opts.sweepDelay ?? 0.20
    );
  }

  // idle shimmer
  const idle = gsap.to(btn, {
    keyframes: [
      { scale: 1, duration: 1.6, ease: "power1.inOut" },
      { scale: 1.01, duration: 0.6, ease: "power1.inOut" },
    ],
    repeat: -1,
    yoyo: true,
  });

  // press feedback
  attachPressFeedback(btn, { idle });

  // keyboard focus glow
  btn.addEventListener("focus", () => {
    gsap.to(btn, { boxShadow: "0 0 0 4px rgba(59,130,246,0.4)", duration: 0.18, overwrite: "auto" });
  });
  btn.addEventListener("blur", () => {
    gsap.to(btn, { boxShadow: "0 10px 24px rgba(59,130,246,0.35)", duration: 0.25, overwrite: "auto" });
  });
}

function attachPressFeedback(
  el: HTMLElement,
  opts: { idle?: gsap.core.Tween | gsap.core.Timeline } = {}
) {
  const onDown = () => {
    opts.idle?.pause();
    gsap.to(el, { scaleX: 0.985, scaleY: 0.98, duration: 0.08, ease: "power2.out" });
  };
  const onUp = () => {
    gsap.to(el, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.2,
      ease: "power3.out",
      onComplete: () => { opts.idle?.play(); },
    });
    const strip = el.querySelector<HTMLSpanElement>("[data-shine] > span");
    if (strip) {
      gsap.fromTo(strip, { xPercent: -40 }, { xPercent: 220, duration: 0.7, ease: "power2.out" });
    }
  };

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointerleave", onUp);

  // register removers in gsap context via onRepeat trick
  // context.revert will remove listeners when node is gone
}


