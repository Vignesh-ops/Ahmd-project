"use client";

import { useEffect, useMemo, useState } from "react";

const DISPLAY_OPTIONS = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
};

function formatLocalDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, DISPLAY_OPTIONS).format(date);
}

export default function LocalDateTime({ value, className }) {
  const [displayValue, setDisplayValue] = useState("");
  const dateTime = useMemo(() => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }, [value]);

  useEffect(() => {
    setDisplayValue(formatLocalDateTime(value));
  }, [value]);

  return (
    <time className={className} dateTime={dateTime}>
      {displayValue || "\u00a0"}
    </time>
  );
}
