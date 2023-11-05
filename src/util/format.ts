export function formatDuration(
  duration: number,
  precision: number = 0
): string {
  const totalSeconds = duration / 1000;
  const neg = totalSeconds < 0 ? "-" : "";
  const posSeconds = Math.abs(totalSeconds);
  let minutes = Math.floor(posSeconds / 60);
  const mult = Math.pow(10, precision);
  let rest = (Math.round((posSeconds % 60) * mult) / mult).toFixed(precision);

  // Check if seconds should round up to 60
  if (parseFloat(rest) >= 60) {
    minutes += 1;
    rest = "00";
  } else if (parseFloat(rest) < 10) {
    rest = `0${rest}`;
  }

  return `${neg}${minutes}:${rest}`;
}

export function formatThousands(number: number): string {
  // If env variable LOCALE is set, use that locale for formatting.
  return Math.round(number || 0).toLocaleString();
}

export function formatNumber(number: number): string {
  if (number > 1000000 || number < -1000000) {
    return `${(number / 1000000).toFixed(2)}m`;
  }
  if (number > 10000 || number < -10000) {
    return `${Math.round(number / 1000)}k`;
  }
  return formatThousands(number);
}

/** Function to convert "mm:ss" time format to milliseconds */
export function formatTime(time: string): number | undefined {
  const timePattern = /^\d+:\d+$/; // Regular expression to match "mm:ss" format

  if (!timePattern.test(time)) {
    return;
  }

  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 * 1000 + seconds * 1000;
}
