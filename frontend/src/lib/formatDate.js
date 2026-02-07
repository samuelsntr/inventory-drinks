// src/lib/formatDate.js

export function formatDate(dateString, withTime = false) {
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime && {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  
    return new Intl.DateTimeFormat("en-US", options).format(new Date(dateString));
  }
  