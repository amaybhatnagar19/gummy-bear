import { Component, type ErrorInfo, type ReactNode, type ButtonHTMLAttributes } from 'react';

export function AppButton({ secondary = false, busy = false, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; busy?: boolean }) {
  return <button {...props} className={`ga-button${secondary ? ' ga-secondary' : ''}${props.className ? ` ${props.className}` : ''}`} disabled={props.disabled || busy} aria-busy={busy}>{children}</button>;
}
export function Notice({ title, children, error = false }: { title: string; children: ReactNode; error?: boolean }) {
  return <div className={`ga-notice${error ? ' ga-error' : ''}`} role={error ? 'alert' : 'status'}><strong>{title}</strong><div>{children}</div></div>;
}
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="ga-empty"><h2>{title}</h2><p>{children}</p>{action}</section>;
}
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Do not log family content or server payloads. */ }
  render() {
    return this.state.failed ? <main className="ga-recovery"><h1>We couldn’t open this screen</h1><p>Try reloading, or return to the website. Unsaved work may need to be entered again.</p><AppButton onClick={() => location.reload()}>Reload</AppButton><a href="/">Visit the website</a></main> : this.props.children;
  }
}
