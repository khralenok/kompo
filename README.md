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

The production build uses Vite's relative base (`./`), so the same `dist/` works at `https://<user>.github.io/<repository>/`, at a user-site root, or on a custom domain. JavaScript, CSS, local fonts, and paper textures are rebased during the build. Navigation uses React state rather than URL routes, so no Pages SPA fallback is needed. Use the trailing slash on a repository URL. This follows [Vite's relative-base support](https://vite.dev/guide/build.html#relative-base).

1. Create the GitHub repository and push the initial commit to `main` or `master`.
2. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**, as described in [GitHub's Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
3. The included `.github/workflows/pages.yml` installs dependencies with `npm ci`, runs unit tests, builds, and tests the real production files under `/kompo/`. It deploys only the repository's default branch. Pull requests run the checks without deploying. Manual runs are available from the Actions tab.

The workflow supports either `main` or `master` (this checkout currently starts on `master`). It uses Node.js 24 and official Pages actions pinned to commit SHAs. It publishes only `dist/`; source references and the original prompt stay in the repository. No secrets or backend configuration are required beyond the workflow's GitHub-provided token and Pages permissions. An initial commit and a push are still needed; no commit or deployment was made during setup.

To reproduce the repository-path check locally:

```sh
npm run build
npm run test:pages
```

The test uses installed Google Chrome locally; CI installs Chromium. It checks font and texture requests, gameplay, progress after refresh, debug mode, and the narrow layout. Its static server deliberately returns 404 for root-level asset requests so accidentally broken paths cannot pass.

For a manual production preview, run `npm run preview:pages` and open `http://127.0.0.1:4173/kompo/`. `npm run preview` is also available for a normal root preview.

Saved progress uses `kompo.progress.v1`, with a fallback for existing `composition.progress.v1` data on the same origin. Moving from localhost to a hosted domain starts separate browser storage; it does not transfer local progress automatically.

## Play

Select a chapter, explore its lesson slider, then start an exercise. Drag colored forms; black forms marked with a small paper-colored dot are fixed. Use **Check composition** for feedback, **Show hint** for dashed shape outlines, edge markers, interval brackets, and gentle drag snapping near the relevant guides, and **Reset** to restore the initial arrangement. Tab to a movable piece and use arrow keys (Shift for larger steps) as an alternative to dragging. Feedback appears inside the canvas workspace and highlights a named piece when possible. Messages avoid the forms; on narrow or crowded frames they dock below the drawing within the workspace. Close or Escape dismisses the message; moving a piece clears stale feedback. Dismissing a hint keeps its guides active, while Reset clears both. Every chapter and exercise can be revisited directly. Completion offers sequential advancement, including across chapters.

Completed level IDs persist in versioned LocalStorage. If storage is unavailable, the current session still works. No account, server, timers, or penalties. Headings use Alumni Sans Black (weight 900); body text, controls, and canvas labels use IBM Plex Sans. Fonts and their SIL Open Font Licenses are bundled in `public/fonts`, with local declarations in `src/fonts.css`; no runtime Google Fonts request is needed.

## Developer mode

Append `?debug=true` to the app URL (locally `/?debug=true`, on Pages `/kompo/?debug=true`). The panel below the app provides a selector for all levels, reset, completion bypass, debugging guides, live coordinates, and progress clearing. Bypass intentionally saves completion just like a successful check.

## Structure

- `src/App.tsx`: lesson context, view/chapter navigation, progress persistence, and debug UI.
- `src/components/CanvasWorkspace.tsx`: self-contained puzzle state, persistent toolbar, checking, hints, collision-aware feedback popups, and completion/next actions.
- `src/components/Canvas.tsx`: SVG rendering, Pointer Events, keyboard interaction, bounds and constraints.
- `src/components/Artwork.tsx`: original geometric home composition.
- `src/game/types.ts`: shape, level, rule, and validation contracts.
- `src/game/levels.ts`: chapters and all authored level content.
- `src/game/validation.ts`: independent deterministic validators and registry.
- `src/game/guidance.ts`: rule-aware visual targets and optional drag assistance; unconstrained axes stay free.
- `src/game/storage.ts`: defensive versioned progress persistence.
- `src/styles.css`: visual system, responsive layouts, motion preferences.

## Add or modify a level

Add a `Level` definition in `src/game/levels.ts` with a unique ID and chapter, initial shapes, instructions, hint, success text, guides, and validation configuration. Each level declares a `frame: { width, height, inset }`. Its aspect ratio stays fixed as the workspace resizes; the inset constrains all pieces and is also checked by validation. Shapes use center coordinates in that frame; width and height define their dimensions, including circles (ellipses). Rotation is in degrees. `locked` prevents movement; optional `axis: 'x' | 'y'` restricts movement to that axis. Keep forms at least 12 units inside the canvas. Z order is controlled by `z`.

The current `relationships` strategy supports shared centers/edges, signed axis distances, target positions, ordered sequences, and frame relationships. A frame rule (`type: "frame"`, `ids`, `anchor`, `position`, `tolerance`) positions a group’s outer bounds relative to the frame: `anchor: "x"` or `"y"` uses the bounds’ midpoint, while `left`, `right`, `top`, and `bottom` use their respective edges. `position` is a fraction of the frame width/height (0.5 is the centerline). Tolerances stay in logical frame units. This measures geometric centering, not perceptual visual weight. Combine frame rules with object rules in the same level. Hints distinguish full-frame guides from object guides. The first Alignment study combines fixed objects and frame centering; the second uses a square frame without a fixed anchor. The first Rhythm study uses frame centering with all forms movable. Each rule specifies its own generous tolerance. Different strategies can be added to the validator registry without changing the renderer. These rules check explicit exercise objectives; they do not score aesthetic quality.

Include a `solution` map containing the movable pieces’ final positions. Tests check every initial state is unsolved, every supplied solution passes, locked pieces remain fixed, and solutions fit within the canvas. Guides and dashed target outlines appear only for hints/debugging. Hint mode additionally snaps drags near relevant checked axes; keyboard nudging stays free. Baseline exercises show bottom-edge arrows/checkmarks rather than center dots. Spacing exercises use visible interval brackets and relational instructions rather than undisplayed coordinate units. Lessons are stored separately from puzzle rules so verified historical references and artwork attribution can be added later.

Rotation and resizing controls are intentionally absent in v0.1: size and color progressions use predefined forms. Screen-to-SVG transforms preserve drag offsets on scaled canvases, with pointer capture and cancellation handling for mouse and touch.

## Interface color and icons

`color-system.css` supplies semantic light/dark UI tokens. Brand and button colors use the darker teal stops for legible text; supporting labels use secondary/tertiary text tokens rather than disabled colors. The UI follows a `data-theme="dark"` attribute when supplied; no theme switch is added. Puzzle paper, piece colors, and guide colors are deliberately stable across interface themes. Guide text has a paper halo, and hints appear at full opacity.

Controls use locally bundled Google Material Icons (Sharp, 24px), with visible text labels and decorative SVGs hidden from assistive technology. Original SVGs and the Apache-2.0 license are retained in `src/assets/material-icons`; `src/components/Icon.tsx` contains their paths. Source: https://github.com/google/material-design-icons. No icon font, runtime download, or icon package is required.

The page, lesson demonstration surface, and puzzle paper share a static procedural texture in `public/textures/paper-grain.svg`. Two seeded, seamless SVG noise layers supply fine grain and softer tonal variation at low opacity. The texture is a CSS background beneath the content; it adds no pointer target, overlay, animation, or JavaScript work during dragging. Adjust the SVG layer opacities to tune its strength and `--paper-texture` in `src/styles.css` to replace it.
