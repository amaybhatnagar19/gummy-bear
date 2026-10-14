import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { categoryLabels, type Activity } from '../../../shared/activityContract';
import { AppButton } from './components';
import { errorMessage } from './usePlayFlow';
export function ActivityCard({
  activity,
  id,
  age,
  saved = false,
  favorite = false,
  intended = false,
  tried = false,
  rating,
  detail = false,
  onDetails,
  onNotice
}: {
  activity: Activity;
  id?: Id<'activities'>;
  age?:number;
  saved?: boolean;
  favorite?: boolean;
  intended?: boolean;
  tried?: boolean;
  rating?: string;
  detail?: boolean;
  onDetails?: () => void;
  onNotice: (text: string) => void;
}) {
  const update = useMutation(api.family.updateActivity);
  const [busy, setBusy] = useState(false);
  async function change(patch: Record<string, unknown>) {
    if (!id) {
      onNotice('Keep this idea in this tab. Sign in to save it once the privacy policy is approved.');
      return;
    }
    setBusy(true);
    try {
      await update({
        id,
        ...patch
      });
      onNotice('Updated. Saving an idea does not mark it as tried.');
    } catch (e) {
      onNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return <article className={`ga-card ga-activity ga-${activity.category}`}><div className="ga-meta"><span>{categoryLabels[activity.category]}</span><span>About {activity.durationMinutes} minutes</span></div><h2>{activity.title}</h2>{age!==undefined&&<p>Suggested for age {age}. Review suitability before using it with a different child.</p>}<p>{activity.toyReferences.join(', ')}</p><h3>What you’ll need</h3><p>{activity.materials.join(', ')}</p>{detail ? <><h3>How to play</h3><ol>{activity.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></> : <p>{activity.steps[0]}</p>}<h3>Your role</h3><p>{activity.parentRole}</p><div className="ga-safety"><h3>A note on safety</h3><ul>{activity.safetyNotes.map((note, i) => <li key={i}>{note}</li>)}</ul><p>You know your child and toys best. Stop if a toy or activity seems unsuitable.</p></div><div className="ga-actions">{!detail && <AppButton onClick={onDetails}>See steps</AppButton>}<AppButton secondary busy={busy} onClick={() => void change({
        saved: !saved
      })}>{saved ? 'Unsave idea' : 'Save idea'}</AppButton><AppButton secondary busy={busy} onClick={() => void change({
        favorite: !favorite
      })}>{favorite ? 'Remove favorite' : 'Favorite'}</AppButton>{detail && <><AppButton secondary busy={busy} onClick={() => void change({
          intended: !intended
        })}>{intended ? 'Remove intention' : 'Intend to try'}</AppButton><AppButton busy={busy} onClick={() => void change({
          tried: true
        })}>{tried ? 'Report another try' : 'We tried this'}</AppButton></>}</div>{detail && tried && <fieldset><legend>How did it go?</legend>{(['loved', 'okay', 'did_not_work'] as const).map((value, i) => <AppButton key={value} secondary busy={busy} onClick={() => void change({
        feedback: value
      })}>{rating === value ? '✓ ' : ''}{['Loved it', 'It was okay', 'Didn’t work'][i]}</AppButton>)}</fieldset>}</article>;
}
