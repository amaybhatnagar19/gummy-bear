# D1.1 asset sources and permissions

Verified 14 October 2026. No production account or child photographs were used.

## Toy photograph

`toy-teddy-640.webp` and `toy-teddy-960.webp`: “Teddy Bear - 7.jpg”, Dan Bollinger, own work, 2 January 2021.
Source: https://commons.wikimedia.org/wiki/File:Teddy_Bear_-_7.jpg
Original: https://upload.wikimedia.org/wikipedia/commons/3/36/Teddy_Bear_-_7.jpg
License: Creative Commons Attribution-ShareAlike 4.0 International, https://creativecommons.org/licenses/by-sa/4.0/
Changes: central crop to approximately 3:2, resize and WebP conversion (quality 82), metadata removed. These adaptations remain CC BY-SA 4.0. Credit and source/license links appear beneath the displayed photo. No endorsement implied. No source photograph was generated. The old fixture was not copied; its source page credits Leon Brooks rather than the fixture note's author.

## Mascot

`gummy-bear-character.webp`: generated for this project using the built-in Imagegen tool on 14 October 2026. No downloaded character or reference artwork used. Original generated PNG is retained outside the repository. Resized to 384 square, WebP quality 90, transparent background preserved. AI-generated artwork is subject to the image tool's applicable terms; no third-party stock license or exclusive copyright guarantee is claimed. Brand/trademark clearance has not been performed.
Prompt direction: the full approved `design/style-anchor.md`, one rounded seated ivory-peach matte clay bear, subtle violet inner ears and paw pads, gentle upper-left studio light, three-quarter front view, modest friendly expression, full body and generous transparent margins. No lettering, accessories, fur, gloss, particles, pedestals or background. Separate from the photographed toy.

## Vector identity and favicon

`../brand/gummy-bear-mark.svg`: original hand-authored vector artwork created for Gummy Bear. D1.2 simplifies the mark to a violet bear-head silhouette, ivory face and inner ears, and three facial features for readability at 16–48px. The wordmark is unchanged. Not generated or copied from an icon library. `../favicon-32.png` is a 32px raster fallback derived from this SVG. Project license applies; trademark uniqueness is not established.

## Font

`../fonts/plus-jakarta-sans-latin.woff2`: Plus Jakarta Sans, copyright 2020 The Plus Jakarta Sans Project Authors (Tokotype). SIL Open Font License 1.1 permits embedding and redistribution with the copyright and license retained in `../fonts/OFL.txt`.
License source: https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/OFL.txt
Font source: https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2
Selection: Google Fonts CSS2 Latin subset, normal variable weights 400–700. Hosted locally; no Google Fonts request from the landing page. Other languages use system fallback. Existing app font behavior is unchanged.

## Performance

Responsive photo candidates mean one photograph is downloaded per display, rather than both. See the implementation report for measured byte sizes. Explicit image dimensions reserve space. The mascot is decorative (empty alt); the real toy has descriptive alternative text. No image contains UI text.
