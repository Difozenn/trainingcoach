"use client";

import { useEffect } from "react";

export function TimezoneSync({
  currentTimezone,
  updateAction,
}: {
  currentTimezone: string | null;
  updateAction: (tz: string) => Promise<void>;
}) {
  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTz && browserTz !== currentTimezone) {
      updateAction(browserTz);
    }
  }, [currentTimezone, updateAction]);

  return null;
}
