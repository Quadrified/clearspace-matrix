export const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
export function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3})(?::([0-5]\d))?$/);
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2] ?? 0);
  return seconds >= 1 && seconds <= 14400 ? seconds : null;
}
export const remainingAt = (deadline: number, now = Date.now()) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));
