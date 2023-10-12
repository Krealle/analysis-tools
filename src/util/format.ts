export function formatDuration(
  duration: number,
  precision: number = 0
): string {
  const totalSeconds = duration / 1000;
  const neg = totalSeconds < 0 ? "-" : "";
  const posSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(posSeconds / 60);
  const mult = Math.pow(10, precision);
  const rest = (Math.floor((posSeconds % 60) * mult) / mult).toFixed(precision);
  const seconds = Number(rest) < 10 ? `0${rest}` : rest;

  return `${neg}${minutes}:${seconds}`;
}

export function formatThousands(number: number): string {
  // If env variable LOCALE is set, use that locale for formatting.
  return Math.round(number || 0).toLocaleString();
}

export function formatNumber(number: number): string {
  if (number > 1000000) {
    return `${(number / 1000000).toFixed(2)}m`;
  }
  if (number > 10000) {
    return `${Math.round(number / 1000)}k`;
  }
  return formatThousands(number);
}
