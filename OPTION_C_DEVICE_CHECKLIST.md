# Option C real-device verification checklist

Prepared 15 October 2026. **Physical devices have not been tested.** Desktop Chromium checks are not evidence of iPhone/Android behavior. Use the isolated testing deployment and synthetic accounts/photos. Keep production on Option A.

Record device, OS/browser version, installed/browser mode, result, screenshot and issue for each item. Until an isolated synthetic provider simulation is available on the device, do not enable live AI or upload real family photographs to test these steps.

| Check | iPhone Safari | Android Chrome |
| --- | --- | --- |
| Landing at 320–430 px; text zoom; no sideways scrolling | Not run | Not run |
| Every Get Started link; direct `/app`; refresh; Back | Not run | Not run |
| Safe-area insets, bottom navigation, portrait/landscape, software keyboard | Not run | Not run |
| Camera opens; cancel returns safely; permission denied has recovery | Not run | Not run |
| Limited picker selects one photo without unrestricted gallery access | Not run | Not run |
| HEIC/JPEG/PNG support, large image, decode failure and memory cleanup | Not run | Not run |
| Correction → age → mocked generation; previous success survives failure | Not run | Not run |
| Signed-in account switch/logout/expiry; no previous-family display | Not run | Not run |
| Child/toy assignments; saved vs tried; deliberate favorite revisit | Not run | Not run |
| Typed deletion confirmation, pending status and retry | Not run | Not run |
| Consent withdrawal; saving disabled; retained data stays available for deletion | Not run | Not run |
| Unsubscribe opens without changing settings; confirmation works; URL proof removed | Not run | Not run |
| Add to Home Screen; correct icon/name; standalone launch; updates | Not run | Not run |
| Offline shell and honest online-only notices; no API/photo/private caching | Not run | Not run |
| VoiceOver/TalkBack reading order, labels, headings, live notices and focus after navigation | Not run | Not run |
| External keyboard, visible focus, skip link, select/checkbox operation | Not run | Not run |
| Touch targets, font scaling, contrast, reduced motion | Not run | Not run |
| Reminder known-new exclusion and opt-out; no offline-disuse claims | Not run | Not run |

Do not create real accounts or send email/AI requests without separate approval. Mocked results must be labeled as such. Google login/delivery checks require verified external configuration; browser automation does not prove those flows. A later authorized real-model pilot is a separate activity and budget.
