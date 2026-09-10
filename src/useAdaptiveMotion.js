import { useEffect } from "react";

export function selectMotionMode({ reducedMotion, saveData, effectiveType, cores, memory, touch }) {
  if (reducedMotion) return "none";
  if (saveData || /^(slow-2g|2g)$/.test(effectiveType || "") ||
      (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4) || touch) return "lite";
  return "full";
}

export function useAdaptiveMotion(route) {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(any-pointer: coarse)");
    const connection = navigator.connection;

    const updateMode = () => {
      root.dataset.motion = selectMotionMode({
        reducedMotion: reduced.matches,
        touch: touch.matches,
        saveData: connection?.saveData,
        effectiveType: connection?.effectiveType,
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
      });
    };

    updateMode();
    reduced.addEventListener("change", updateMode);
    touch.addEventListener("change", updateMode);
    connection?.addEventListener("change", updateMode);

    return () => {
      reduced.removeEventListener("change", updateMode);
      touch.removeEventListener("change", updateMode);
      connection?.removeEventListener("change", updateMode);
      delete root.dataset.motion;
    };
  }, [route]);
}
