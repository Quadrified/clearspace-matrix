import { emptyArt } from './emptyArt';
import type { QuadrantId } from '../domain/models';
export function EmptyIllustration({ q }: { q: QuadrantId }) {
  return (
    <svg className="empty-art" viewBox="0 0 200 112" aria-hidden="true">
      <ellipse cx="100" cy="59" rx="67" ry="44" fill="var(--tint)" stroke="none" opacity=".65" />
      <path d="M44 99h112" opacity=".18" />
      {emptyArt[q]}
    </svg>
  );
}
