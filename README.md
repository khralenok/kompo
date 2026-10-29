# KOMPO

A browser-based visual composition game: three short interactive lessons and fifteen authored SVG puzzles exploring alignment, repetition, and rhythm. Original geometry takes inspiration from Constructivism and Swiss typography; the supplied reference images are not reproduced in the interface.

## Run

Requires Node.js 22.12+ or Node.js 24+ (the test runner uses current Node.js APIs).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To validate and build:

```sh
npm test
npm run typecheck
npm run build

# Browser tests (uses an installed Google Chrome)
npm run test:e2e
```

## GitHub Pages

The production build uses Vite's relative base (`./`), so the same `dist/` works at `https://<user>.github.io/<repository>/`, at a user-site root, or on a custom domain. JavaScript, CSS, local fonts, and paper textures are rebased during the build. Exercise navigation uses URL hashes, so no Pages SPA fallback is needed. Use the trailing slash on a repository URL. This follows [Vite's relative-base support](https://vite.dev/guide/build.html#relative-base).

1. Create the GitHub repository and push the initial commit to `main` or `master`.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**, as described in [GitHub's Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
3. The included `.github/workflows/pages.yml` installs dependencies with `npm ci`, runs unit tests, builds, and tests the real production files under `/kompo/`. It deploys only the repository's default branch. Pull requests run the checks without deploying. Manual runs are available from the Actions tab.

The workflow supports either `main` or `master` (this checkout currently starts on `master`). It uses Node.js 24 and official Pages actions pinned to commit SHAs. It publishes only `dist/`; source references and the original prompt stay in the repository. No secrets or backend configuration are required beyond the workflow's GitHub-provided token and Pages permissions. An initial commit and a push are still needed; no commit or deployment was made during setup.

To reproduce the repository-path check locally:

```sh
npm run build
npm run test:pages
```

The test uses installed Google Chrome locally; CI installs Chromium. It checks font and texture requests, workspace entry, hash navigation and refresh, gameplay, progress, and debug mode. Its static server deliberately returns 404 for root-level asset requests so accidentally broken paths cannot pass.

For a manual production preview, run `npm run preview:pages` and open `http://127.0.0.1:4173/kompo/`. `npm run preview` is also available for a normal root preview.

Saved progress uses `kompo.progress.v1`, with a fallback for existing `composition.progress.v1` data on the same origin. Moving from localhost to a hosted domain starts separate browser storage; it does not transfer local progress automatically.

## Workspace and learning

KOMPO opens directly in the exercise workspace. A first visit starts Alignment 01; returning visitors resume their selected exercise and saved form positions. URLs use `#/exercise/alignment-1`, so refresh, sharing, and browser Back/Forward work on GitHub Pages without server routes. The upper-left **Lessons** control opens a studies drawer; the **Lesson info** tool opens an optional interactive principle panel. Neither replaces the workspace with a landing page.

The first exercise teaches selection, movement, and checking through the player's actions. After the controls are learned, subsequent exercises show concise principle guidance instead. Every level's teaching concept, action prompt, and focus form are authored separately in `src/game/education.ts` and attached to its level definition. **Skip guidance** dismisses teaching without completing a puzzle. **Replay guidance** in the principle panel or workspace starts it again. Learning state is stored independently for mouse and touch controls and for each exercise.

Mouse users drag colored forms. Keyboard users Tab to a movable form and use arrow keys; Shift makes larger steps. Fixed forms are marked with a paper-colored dot. On touch devices, tapping selects a form without moving it. Use the directional pad at the lower right: tap for a small step; hold for continuous movement. Movement stops on release, pointer cancellation, lost capture, blur, hidden document, or exercise change. The pad is disabled until a movable form is selected. Hint snapping occurs on release, allowing a held movement to leave a guide. The controller and its descendants disable WebKit selection, callouts, native drag, and touch gestures; local non-passive touch-start and selection handlers prevent long-press editing behavior without disabling selection elsewhere in the app. Movement constraints and frame boundaries are shared across all inputs.

One floating tool panel contains **Reset**, **Hint**, **Lesson info**, and **Check** (which becomes **Next** after success). It sits at the upper edge on desktop and phones. Check/Next use centered icons, with accessible names and tooltips. Lesson context sits quietly beneath the upper-left lesson menu. Feedback and onboarding appear in a dismissible bottom-center popup. On touch screens the popup stops short of the separate lower-right thumb pad. The drawing reserves clearance for controls and messages, so they do not shift the frame or cover forms. There is no permanent guidance deck or footer legend; control explanations are available in Lesson info. Incorrect answers retain the composition and explain the relationship to adjust. Success enables the next exercise. Every exercise can be replayed from the studies drawer.

Completed IDs use `kompo.progress.v1`, the current exercise uses `kompo.current.v1`, the current draft uses `kompo.draft.v1`, and onboarding uses `kompo.learning.v1`. Draft saves are debounced and flushed on leaving the exercise/page. Storage failures keep the session playable. No account or backend is involved. Fonts and procedural paper grain are bundled locally.

## Developer mode

Append `?debug=true` before the URL hash, for example `/kompo/?debug=true#/exercise/alignment-3`. The developer panel provides level jumping, reset, completion bypass, debug guides, coordinates, progress clearing, and onboarding replay. Completion bypass intentionally saves exercise completion but does not mark educational guidance as learned.

## Structure

- `src/App.tsx`: workspace shell, hash navigation, studies/principle panels, progress and debug controls.
- `src/components/CanvasWorkspace.tsx`: puzzle state, checking, selection, hints, action-based onboarding, and input orchestration.
- `src/components/Canvas.tsx`: bounded SVG frame, mouse dragging, touch selection, and keyboard input.
- `src/components/ThumbController.tsx`: tap/hold directional controls with pointer capture and cancellation handling.
- `src/components/Panel.tsx`, `Principle.tsx`: accessible modal panels and interactive lesson comparison.
- `src/game/levels.ts`, `education.ts`: authored exercise and teaching content.
- `src/game/validation.ts`, `guidance.ts`, `movement.ts`: deterministic rules, optional hint assistance, and shared position constraints.
- `src/game/storage.ts`, `session.ts`: completion, resume, drafts, onboarding, and hash helpers.
- `src/styles.css`, `workspace.css`: shared visual styling and responsive full-viewport application layout.

## Add or modify a level

Add a `Level` definition in `src/game/levels.ts` with a unique ID and chapter, initial shapes, instructions, hint, success text, guides, and validation configuration. Each level declares a `frame: { width, height, inset }`. Its aspect ratio stays fixed as the workspace resizes; the inset constrains all pieces and is also checked by validation. Shapes use center coordinates in that frame; width and height define their dimensions, including circles (ellipses). Rotation is in degrees. `locked` prevents movement; optional `axis: 'x' | 'y'` restricts movement to that axis. Keep forms at least 12 units inside the canvas. Z order is controlled by `z`.

The current `relationships` strategy supports shared centers/edges, signed axis distances, target positions, ordered sequences, and frame relationships. A frame rule (`type: "frame"`, `ids`, `anchor`, `position`, `tolerance`) positions a group’s outer bounds relative to the frame: `anchor: "x"` or `"y"` uses the bounds’ midpoint, while `left`, `right`, `top`, and `bottom` use their respective edges. `position` is a fraction of the frame width/height (0.5 is the centerline). Tolerances stay in logical frame units. This measures geometric centering, not perceptual visual weight. Combine frame rules with object rules in the same level. Hints distinguish full-frame guides from object guides. The first Alignment study combines fixed objects and frame centering; the second uses a square frame without a fixed anchor. The first Rhythm study uses frame centering with all forms movable. Each rule specifies its own generous tolerance. Different strategies can be added to the validator registry without changing the renderer. These rules check explicit exercise objectives; they do not score aesthetic quality.

Include a `solution` map containing the movable pieces’ final positions. Tests check every initial state is unsolved, every supplied solution passes, locked pieces remain fixed, and solutions fit within the canvas. Guides and dashed target outlines appear only for hints/debugging. Hint mode additionally snaps mouse drags near relevant checked axes and settles touch-controller movement on release; keyboard nudging stays free. Baseline exercises show bottom-edge arrows/checkmarks rather than center dots. Spacing exercises use visible interval brackets and relational instructions rather than undisplayed coordinate units. Lessons are stored separately from puzzle rules so verified historical references and artwork attribution can be added later.

Rotation and resizing controls are intentionally absent in v0.1: size and color progressions use predefined forms. Screen-to-SVG transforms preserve drag offsets on scaled canvases, with pointer capture and cancellation handling for mouse and touch.

## Interface color and icons

`color-system.css` supplies semantic light/dark UI tokens. Brand and button colors use the darker teal stops for legible text; supporting labels use secondary/tertiary text tokens rather than disabled colors. The UI follows a `data-theme="dark"` attribute when supplied; no theme switch is added. Puzzle paper, piece colors, and guide colors are deliberately stable across interface themes. Guide text has a paper halo, and hints appear at full opacity.

Controls use locally bundled Google Material Icons (Sharp, 24px), with visible text labels and decorative SVGs hidden from assistive technology. Original SVGs and the Apache-2.0 license are retained in `src/assets/material-icons`; `src/components/Icon.tsx` contains their paths. Source: https://github.com/google/material-design-icons. No icon font, runtime download, or icon package is required.

The page, lesson demonstration surface, and puzzle paper share a static procedural texture in `public/textures/paper-grain.svg`. Two seeded, seamless SVG noise layers supply fine grain and softer tonal variation at low opacity. The texture is a CSS background beneath the content; it adds no pointer target, overlay, animation, or JavaScript work during dragging. Adjust the SVG layer opacities to tune its strength and `--paper-texture` in `src/styles.css` to replace it.
