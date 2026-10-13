import type { ReactNode } from 'react';

export function ButtonLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <a className={`gb-button${secondary ? ' gb-button-secondary' : ''}`} href={href}>{children}</a>;
}
