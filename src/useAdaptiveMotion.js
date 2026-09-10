import { useEffect } from "react";

export function selectMotionMode({ reducedMotion, saveData, effectiveType, cores, memory, touch }) {
  if (reducedMotion) return "none";
  if (saveData || /^(slow-2g|2g)$/.test(effectiveType || "") ||
      (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4) || touch) return "lite";
  return "full";
}

const revealTargets = [
  ".section-heading", ".service-card", ".process-step", ".advantages-lead",
  ".advantage-item", ".production-copy", ".case-card", ".request-intro",
  ".contact-grid > *", ".deliverable-card", ".engineering-copy",
  ".faq-intro", ".faq-list > details", ".other-services-grid > a",
].join(", ");

export function useAdaptiveMotion(route) {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(any-pointer: coarse)");
    const connection = navigator.connection;
    const active = new Map();
    let observer;
    let frameId = 0;
    let sampled = false;
    let slowDevice = false;
    let mode;

    const stopAnimations = () => {
      active.forEach((animation) => animation.cancel());
      active.clear();
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const updateMode = () => {
      const next = selectMotionMode({
        reducedMotion: reduced.matches,
        touch: touch.matches || slowDevice,
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
      });
      if (mode !== next) stopAnimations();
      mode = next;
      root.dataset.motion = mode;
    };

    // A bounded sample during real motion, never an idle animation loop.
    const sampleFrames = () => {
      if (sampled || mode !== "full") return;
      sampled = true;
      let last = 0;
      let frames = 0;
      let slowFrames = 0;
      const sample = (time) => {
        if (!active.size || document.hidden) { frameId = 0; return; }
        if (last) {
          frames += 1;
          if (time - last > 36) slowFrames += 1;
        }
        last = time;
        if (slowFrames >= 4) {
          slowDevice = true;
          updateMode();
        } else if (frames < 18) {
          frameId = requestAnimationFrame(sample);
        } else frameId = 0;
      };
      frameId = requestAnimationFrame(sample);
    };

    updateMode();
    if ("IntersectionObserver" in window && typeof Element.prototype.animate === "function") {
      const pending = new Set(document.querySelectorAll(revealTargets));
      let firstDelivery = true;
      observer = new IntersectionObserver((entries) => {
        let order = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            active.get(entry.target)?.cancel();
            active.delete(entry.target);
            return;
          }
          const target = entry.target;
          if (!pending.has(target)) return;
          pending.delete(target);
          // The first viewport (including anchor navigation) stays immediately visible.
          if (firstDelivery || mode === "none" || document.hidden ||
              target.contains(document.activeElement) || active.size >= (mode === "full" ? 6 : 2)) {
            observer.unobserve(target);
            return;
          }
          const full = mode === "full";
          // The process rail stays perfectly aligned throughout the reveal.
          const lift = full && !target.classList.contains("process-step");
          const animation = target.animate(lift
            ? [{ opacity: 0.25, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }]
            : [{ opacity: 0.65 }, { opacity: 1 }], {
            duration: full ? 460 : 180,
            delay: full ? Math.min(order++ * 45, 135) : 0,
            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
            fill: "backwards",
          });
          active.set(target, animation);
          const release = () => {
            active.delete(target);
            observer.unobserve(target);
            // Remove finished effects so the browser can release compositor layers.
            animation.cancel();
            if (!pending.size && !active.size) observer.disconnect();
          };
          animation.finished.then(release, release);
          sampleFrames();
        });
        firstDelivery = false;
        if (!pending.size && !active.size) observer.disconnect();
      }, { threshold: 0.08 });
      pending.forEach((target) => observer.observe(target));
    }

    const onVisibility = () => { if (document.hidden) stopAnimations(); };
    const onFocus = (event) => {
      active.forEach((animation, target) => {
        if (target.contains(event.target)) animation.cancel();
      });
    };
    reduced.addEventListener("change", updateMode);
    touch.addEventListener("change", updateMode);
    connection?.addEventListener("change", updateMode);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("focusin", onFocus);

    return () => {
      observer?.disconnect();
      stopAnimations();
      reduced.removeEventListener("change", updateMode);
      touch.removeEventListener("change", updateMode);
      connection?.removeEventListener("change", updateMode);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("focusin", onFocus);
      delete root.dataset.motion;
    };
  }, [route]);
}
