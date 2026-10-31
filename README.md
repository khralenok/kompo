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

## Workspace and learning

Each exercise opens a blocking Sensei dialogue with its rule and a brief control instruction. Start composing, tap outside, press Escape, or close the dialogue to enter the workspace. The workspace contains the canvas, Lessons menu, toolbar, and touch controller when needed; it reserves no room for dialogue and repeats no lesson copy around the artwork.

Hints, corrections, and celebrations are separate modal dialogue states. Read a hint once, then dismiss it to try the composition with visual guides. The Hint tool can hide those guides. Lesson info opens an interactive explanation, including controls and a Replay guidance action.

Click a movable form to select it, then use the arrow keys to nudge it; Shift makes larger steps. Mouse dragging also leaves the form focused for keyboard adjustments. Tab can select forms without a pointer. On touch screens, tap a form, then tap or hold the thumb pad. Fixed forms carry a small paper-colored dot. The controller suppresses iOS selection/callouts without disabling text selection elsewhere.

Completion exists only in React memory during the current run, allowing section and course celebrations. Reloading resets completion and all piece positions. Every exercise visit gets its introduction. No localStorage, cookies, saved draft, remembered onboarding, or current-lesson storage is used. Old stored values are ignored. Explicit hash URLs still select exercises, and browser Back/Forward works; opening the root starts exercise one.

## Developer mode

Append `?debug=true` before the URL hash, for example `/kompo/?debug=true#/exercise/alignment-3`. The developer panel provides level jumping, reset, completion bypass, debug guides, coordinates, progress clearing, and onboarding replay. Completion bypass marks an exercise complete only within the current in-memory run.

## Structure

- `src/App.tsx`: workspace shell, hash navigation, studies/principle panels, progress and debug controls.
- `src/components/CanvasWorkspace.tsx`: puzzle state, checking, selection, hints, lesson dialogues, and input orchestration.
- `src/components/Canvas.tsx`: bounded SVG frame, mouse dragging, touch selection, and keyboard input.
- `src/components/ThumbController.tsx`: tap/hold directional controls with pointer capture and cancellation handling.
- `src/components/Panel.tsx`, `Principle.tsx`: accessible modal panels and interactive lesson comparison.
- `src/game/levels.ts`, `education.ts`: authored exercise and teaching content.
- `src/game/validation.ts`, `guidance.ts`, `movement.ts`: deterministic rules, optional hint assistance, and shared position constraints.
- `src/game/session.ts`: validated exercise hash helpers; no persistence.
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

### Sensei dialogue illustrations

Sensei has twenty independently authored SVG React components in `src/components/sensei`, based on the artwork in `kompo-sensei`. Each pose exports its own reaction settings. The `Sensei` wrapper runs one scoped GSAP entrance/reaction per dialogue event and leaves the illustration still afterward; reduced-motion preferences show the static pose immediately. There are no idle loops or pose morphs.

Lesson introductions use teaching; hints use thoughtful; corrections use patient or compassionate; success uses encouraging or amused. The other illustrations are available for future authored dialogue moments. Dialogue content and validation remain deterministic.

During development, open `/?sensei-gallery` to review all twenty illustrations and replay their reactions. The gallery is disabled in production. To add or change a dialogue reaction, choose a pose and supply a dialogue key that changes only when a new message is evoked.

Sensei dialogue events include patient first corrections, an optional hint after repeated unsuccessful checks, and recovery-aware success. Newly completed studies and the full course get distinct celebrations based on current-run progress, including exercises completed out of order. Replaying completed exercises does not re-award those milestones. Principle explanations include a character-led visual observation.

After 60 seconds on a quiet canvas, Sensei offers a clue once per exercise visit. Interaction restarts the timer; guidance, feedback, open panels, hidden tabs, and completed exercises suppress the offer. Hints remain opt-in. Reduced motion and one-shot reactions apply to all these dialogues.

Sensei uses a large portrait and nameplate in a centered native modal dialogue. Dialogues block background input, trap focus, support Escape and outside-click dismissal, and scroll independently on small screens. Closing them restores the unchanged workspace frame; speech never competes with the controller for space.

Reactions have an arrival, gesture, hold, and settle, lasting about 1.95 seconds for teaching/correction and 2.3 seconds for celebration. Text and actions remain immediately available. Each sequence plays once per dialogue event and respects reduced motion.
