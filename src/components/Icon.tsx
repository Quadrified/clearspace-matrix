import paths from '../lib/icons.json';
const extra: Record<string, string[]> = {
  settings: [
    'M10 2h4l.5 2.5 1.8.8 2.2-1.4 2.8 2.8-1.4 2.2.8 1.8L23 11v2l-2.3.5-.8 1.8 1.4 2.2-2.8 2.8-2.2-1.4-1.8.8L14 22h-4l-.5-2.3-1.8-.8-2.2 1.4-2.8-2.8 1.4-2.2-.8-1.8L1 13v-2l2.3-.5.8-1.8-1.4-2.2 2.8-2.8 2.2 1.4 1.8-.8Z',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  ],
  sun: [
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42',
  ],
  tag: ['M20 13 13 20 3 10V3h7Z', 'M7 7h.01'],
  folder: ['M3 7V4h6l3 3h9v13H3Z'],
  chevron: ['m6 9 6 6 6-6'],
};
export function Icon({ name, ...props }: { name: string } & React.SVGProps<SVGSVGElement>) {
  const list = (paths as Record<string, string[]>)[name] ?? extra[name] ?? extra.tag;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {list.map((d, i) => (
        <path d={d} key={i} />
      ))}
    </svg>
  );
}
