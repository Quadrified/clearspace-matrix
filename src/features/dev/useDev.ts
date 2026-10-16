import { useEffect, useState } from 'react';
import { matrixSchema } from '../../domain/models';
import type { Matrix } from '../../domain/models';
import { localDate, mergeMatrix } from '../../domain/matrix';
export function useDev(
  change: (fn: (m: Matrix) => Matrix, message: string) => void,
  notify: (s: string) => void,
) {
  const [authorized, setAuthorized] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (location.protocol === 'file:') return;
    const controller = new AbortController();
    void fetch('/api/dev/status', {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (r) => {
        if (r.ok) {
          const data: unknown = await r.json();
          setAuthorized(
            typeof data === 'object' &&
              data !== null &&
              'authorized' in data &&
              data.authorized === true,
          );
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  async function generate() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/dev/tasks', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ today: localDate() }),
      });
      if (r.status === 403) {
        setAuthorized(false);
        throw Error('Owner sign-in expired. Open /dev to sign in again.');
      }
      if (!r.ok) throw Error('Could not generate sample tasks. Try again.');
      const data = matrixSchema.parse(await r.json());
      if (data.tasks.length !== 24 || data.tasks.some((t) => !t.isDevSample))
        throw Error('Invalid sample data received.');
      change((m) => mergeMatrix(m, data), '24 Dev sample tasks added.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not generate sample tasks.');
    } finally {
      setBusy(false);
    }
  }
  return {
    authorized,
    busy,
    generate,
    cleanup: () =>
      change(
        (m) => ({ ...m, tasks: m.tasks.filter((t) => !t.isDevSample) }),
        'Dev sample tasks removed.',
      ),
  };
}
