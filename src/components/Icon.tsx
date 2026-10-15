import paths from '../lib/icons.json';
const extra: Record<string, string[]> = {
  settings: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    'm9 3 6 0 1 3 3 1 2 5-2 2-1 3-5 2-2-2-3-1-2-5 2-2 1-3 2-1Z',
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
