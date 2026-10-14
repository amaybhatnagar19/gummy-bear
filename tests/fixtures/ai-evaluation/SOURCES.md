# Evaluation corpus preparation

Only **one photograph is ready**, not 24. The remaining slots in `shared/evaluationCorpus.ts` are a checklist, not supplied photos or measured recognition results. No private parent/child photographs were used or downloaded.

`case-01.jpg`: derivative of the approved D1 photograph, “Teddy Bear - 7.jpg”, Dan Bollinger, 2 January 2021.

- Source: https://commons.wikimedia.org/wiki/File:Teddy_Bear_-_7.jpg
- License: Creative Commons Attribution-ShareAlike 4.0 International, https://creativecommons.org/licenses/by-sa/4.0/
- Preparation: existing locally hosted `public/images/toy-teddy-640.webp`, whose source/license was verified for D1, converted to JPEG using macOS sips. The original D1 derivative was cropped/resized and metadata removed; this JPEG derivative remains CC BY-SA 4.0. No new original downloaded or retained.
- Public benchmark asset only; not stored by the app/backend as a parent upload. Credit/license accompanies this fixture. No endorsement implied.

For every remaining slot: obtain a distinct synthetic photo or a clearly licensed photograph of the planned objects, exclude private people/labels/background information, verify the photographer/license/source, reduce to JPEG within 768 pixels and 350,000 base64 characters, remove metadata, and add source/license/changes plus SHA-256 of the reduced bytes. Do not count duplicate crops as different categories or mark licenseVerified until reviewed. Non-toy/unsafe cases must keep generationAllowed=false. The internal runner requires at least 20 distinct reviewed photo hashes before it transmits any photo.
