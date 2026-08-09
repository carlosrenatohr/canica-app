"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes (DS Fase 5)
const WARNING_BEFORE = 30 * 1000; // warn 30s before (DS Fase 5)

export function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningShownRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const redirectToLogin = useCallback(() => {
    clearAllTimers();
    window.location.href = "/login";
  }, [clearAllTimers]);

  const startCountdown = useCallback(() => {
    setRemainingSeconds(30);
    countdownRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          redirectToLogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [redirectToLogin]);

  const showWarningModal = useCallback(() => {
    warningShownRef.current = true;
    setShowWarning(true);
    startCountdown();
  }, [startCountdown]);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    warningShownRef.current = false;
    setRemainingSeconds(30);

    timeoutRef.current = setTimeout(() => {
      showWarningModal();
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
  }, [clearAllTimers, showWarningModal]);

  // Handle visibility change (HIPAA: lock when physician walks away)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !warningShownRef.current) {
      // Tab hidden: start a shorter lock timer (1 minute, per HIPAA recommendation)
      clearAllTimers();
      timeoutRef.current = setTimeout(() => {
        showWarningModal();
      }, 60 * 1000); // 1 minute when tab hidden
    } else if (!document.hidden && !warningShownRef.current) {
      // Tab visible again: restore normal timer
      resetTimer();
    }
  }, [clearAllTimers, showWarningModal, resetTimer]);

  useEffect(() => {
    // Activity events to track
    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "touchstart",
    ];

    // Start initial timer
    resetTimer();

    // Add event listeners
    activityEvents.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearAllTimers();
      activityEvents.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetTimer, handleVisibilityChange, clearAllTimers]);

  if (!showWarning) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label="Sesión por expirar"
    >
      <div className="w-full max-w-sm rounded-[var(--radius-dialog)] bg-surface p-6 shadow-lg">
        <h2 className="text-h3 font-semibold text-primary">
          Sesión por expirarse
        </h2>
        <p className="mt-2 text-small text-muted-foreground">
          Tu sesión expirará en{" "}
          <span className="font-medium text-primary">{remainingSeconds}s</span>{" "}
          por inactividad.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="inline-flex h-9 px-4 items-center justify-center rounded-[var(--radius-button)] bg-primary text-white text-small font-medium hover:bg-primary-hover motion-button focus-visible:ring-2 focus-visible:ring-ring"
            onClick={resetTimer}
          >
            Continuar sesión
          </button>
          <button
            className="inline-flex h-9 px-4 items-center justify-center rounded-[var(--radius-button)] border border-border bg-transparent text-small font-medium hover:bg-secondary/5 motion-button focus-visible:ring-2 focus-visible:ring-ring"
            onClick={redirectToLogin}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
