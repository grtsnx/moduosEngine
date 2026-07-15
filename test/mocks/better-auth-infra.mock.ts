export function dash(options?: unknown): { id: string; options?: unknown } {
  return options === undefined ? { id: 'dash' } : { id: 'dash', options };
}

export function sentinel(options?: unknown): { id: string; options?: unknown } {
  return options === undefined
    ? { id: 'sentinel' }
    : { id: 'sentinel', options };
}
