import { useEffect, useState } from 'react';
import { AppButton } from './components';
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: string;
  }>;
};
export function InstallGuide() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const listener = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    addEventListener('beforeinstallprompt', listener);
    return () => removeEventListener('beforeinstallprompt', listener);
  }, []);
  if (dismissed || matchMedia('(display-mode: standalone)').matches) return null;
  return <details className="ga-card"><summary>Keep Gummy Bear on your home screen</summary><p>Install for a familiar app shortcut. New AI ideas and saving changes still need a connection. Offline access does not include saved family records.</p>{prompt ? <AppButton onClick={async () => {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    }}>Install Gummy Bear</AppButton> : <p>On iPhone, open this page in Safari, choose Share, then Add to Home Screen. On Android or desktop, look for Install app in your browser menu.</p>}<AppButton secondary onClick={() => setDismissed(true)}>Not now</AppButton></details>;
}
