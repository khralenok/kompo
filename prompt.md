# Build a Playable Composition Puzzle Game — MVP v0.1

You are a senior frontend engineer and creative developer. Build a functional, visually refined browser-based game that teaches fundamental principles of visual composition through interactive geometric puzzles.

The immediate objective is **to create something I can actually play, evaluate, and iterate on**. This is an exploratory prototype, not a production educational platform.

Do not stop at wireframes, documentation, or static mockups. Implement the working application.

## 1. Product concept

The game teaches visual composition through playful manipulation of abstract geometric elements.

The educational foundation comes from Suprematism, Constructivism, and the work of El Lissitzky, especially his Proun series.

The interface combines the dynamic geometric language of the Russian avant-garde with the precision, hierarchy, and typography of Swiss International Typographic Style.

Core experience:

1. The player selects a composition principle.
2. A short interactive introduction demonstrates that principle.
3. The player receives a visual puzzle.
4. They manipulate geometric objects to achieve the objective.
5. The game provides feedback.
6. The player advances through increasingly complex levels.

Aim for the accessibility of a casual puzzle game and the visual quality of an experimental design publication.

## 2. Technology

Use:

- React with TypeScript.
- Vite.
- SVG for rendering and manipulating game elements.
- CSS for interface styling and responsive layouts.
- Pointer Events for mouse and touch interactions.
- LocalStorage for saving progress.
- Minimal dependencies.

Avoid backend services, user authentication, databases, AI APIs, and unnecessary component libraries.

The game must run locally using `npm install` and `npm run dev`.

## 3. Visual direction

**Art direction: El Lissitzky meets Swiss poster design.**

Design the experience as a coherent visual product, not a conventional dashboard or an educational website template.

### Palette

- Warm paper white: `#F2EFE6`
- Constructivist red: `#D12F26`
- Near black: `#191919`
- Muted gray: `#A6A39C`
- Occasional ochre: `#D8AF58`

Use black, white, and red as the dominant colors.

### Typography

Use a modern grotesque sans-serif such as Inter or IBM Plex Sans.

- Large, confident typographic compositions.
- Oversized chapter numbers.
- Strong contrast in type scale.
- Compact uppercase labels.
- Precise alignment and spacing.
- Asymmetric but deliberate layouts.

### Graphic language

Use circles, rectangles, bars, diagonal lines, grids, and geometric intersections.

Include restrained Constructivist-inspired graphic elements, without introducing unnecessary ornamentation.

The actual puzzle compositions should remain visually distinct from the interface around them.

### UI behavior

- Smooth, restrained transitions.
- Strong hover, selected, and dragging states.
- Clear cursor feedback.
- Subtle animation when completing exercises.
- No excessive confetti or generic gamification decoration.

The game should feel like an interactive design exhibition.

## 4. Application structure

Create three main views.

### A. Home / chapter selection

A visually distinctive landing screen containing:

- Game title: **KOMPO**
- Subtitle: *Learn to see. Learn to arrange.*
- A large geometric hero composition.
- Chapter selection.
- Visible progress.
- A prominent Play button.

Chapters:

01 — Alignment  
02 — Repetition  
03 — Rhythm

Only these three principles are necessary for the first prototype.

### B. Lesson introduction

Before the puzzles, show a concise explanation of the principle.

Each lesson should contain:

- Principle title.
- Two or three sentences explaining the concept.
- An abstract geometric composition demonstrating the principle.
- A simple animated comparison or interactive demonstration.
- A button to start playing.

Keep the explanations short. The primary learning mechanism is experimentation.

Use original geometric compositions inspired by the relevant art movements. Structure the lesson data so historical artworks and verified attributions can be incorporated later.

### C. Gameplay

Create a focused game interface with:

- Current principle.
- Current level number.
- Short objective.
- Main SVG composition canvas.
- Available geometric objects.
- Check button.
- Reset button.
- Hint button.
- Next Level button after successful completion.
- A way to return to chapter selection.

The canvas should dominate the interface.

Controls should remain obvious without turning the experience into an illustration editor.

## 5. Interaction engine

Create reusable geometric objects supporting:

- Rectangle
- Circle
- Line / bar
- Triangle

Every object should have configurable properties:

- ID
- Type
- X and Y position
- Width and height or radius
- Rotation
- Fill color
- Z-index
- Locked / movable state

Implement reliable mouse and touch dragging.

Important details:

- Maintain correct pointer offsets while dragging.
- Use SVG coordinate transformations so dragging remains accurate on resized canvases.
- Prevent accidental text selection while dragging.
- Keep interactions smooth.
- Support configurable movement constraints.
- Provide a clear selected state.
- Allow resetting the puzzle to its initial arrangement.

Architect the engine so rotation, resizing, snapping, and additional manipulation tools can be introduced later without rewriting everything.

For v0.1, dragging is the primary interaction. Only add rotation when a particular puzzle actually requires it.

## 6. Levels

Create five levels for each principle, giving us 15 playable exercises.

### Chapter 01: Alignment

Explore arranging objects along common horizontal and vertical axes.

Progression:

1. Align two elements.
2. Align three elements.
3. Align different-sized objects.
4. Work with several possible alignment axes.
5. Create a more complex arrangement using alignment.

### Chapter 02: Repetition

Explore the repeated use of shapes, sizes, colors, and configurations.

Progression:

1. Complete a simple repeated pattern.
2. Repeat elements at consistent intervals.
3. Combine two repeated motifs.
4. Complete a pattern with missing elements.
5. Organize multiple shapes into a coherent repeated structure.

### Chapter 03: Rhythm

Explore how variations in spacing, size, and repetition create a sense of visual rhythm.

Progression:

1. Create a regular sequence.
2. Create a progressive sequence.
3. Alternate two visual elements.
4. Experiment with changes in interval and scale.
5. Complete a more complex geometric rhythm.

Levels should be individually designed, not automatically generated variations of the same arrangement.

Introduce difficulty by changing relationships and constraints, rather than simply adding more objects.

## 7. Validation architecture — IMPORTANT

**Do not attempt to invent a universal mathematical formula for good composition.**

The game's validation mechanics are still an open design problem that we will explore separately.

For now, implement a modular validation architecture.

Each level should declare its validation strategy and configuration independently.

Create a common validator interface that accepts the current state of a puzzle and returns structured feedback.

Example result:

```ts
type ValidationResult = {
  success: boolean;
  score?: number;
  message: string;
  details?: Record<string, unknown>;
};
```

For the initial playable version, implement straightforward deterministic validators for narrowly specified objectives, including:

- Aligning specified object edges or centers within a tolerance.
- Maintaining a required distance between objects.
- Placing objects in a specified sequence.
- Satisfying explicit relative size or position relationships.

These are provisional mechanics, not definitions of aesthetic quality.

Design levels around the capabilities of these validators.

Make validation visually understandable. For example, reveal relevant alignment guides or spacing intervals when giving hints or explaining results.

Avoid one-pixel precision requirements. Use reasonable tolerances and make targets achievable through mouse and touch interactions.

The validation system must support future replacement with entirely different approaches, including alternative scoring models or subjective evaluation.

**Do not lock the product architecture into any particular aesthetic-scoring algorithm.**

If necessary, include an optional developer-only control to bypass validation, mark a level as complete, and continue testing the game.

## 8. Level data architecture

Keep level content separate from React components.

Each level should be described through structured TypeScript data.

A level definition should support:

- Unique ID.
- Chapter ID.
- Title.
- Learning objective.
- Instructions.
- Initial composition.
- Locked elements.
- Movable elements.
- Allowed interactions.
- Validation strategy.
- Validation parameters.
- Hint text.
- Success feedback.

The renderer, interaction engine, and validation logic should not contain hardcoded level-specific behavior.

We should eventually be able to create new levels by writing configurations rather than new React components.

## 9. Feedback and game progression

After clicking Check:

**If the objective is satisfied:**

- Show a clear completion state.
- Explain briefly what principle the player successfully applied.
- Offer a Next Level action.
- Save completed progress.

**If the objective is not satisfied:**

- Provide useful, specific feedback.
- Do not reset the player's composition.
- Allow immediate further experimentation.
- Offer a hint.

Do not use arbitrary timers or penalties.

A completion score is optional. Prioritize meaningful feedback over points.

Allow players to replay completed levels.

## 10. Responsive behavior

Desktop is the primary target, but the interface must also work on tablets and mobile devices.

- Keep the main canvas usable at smaller viewport widths.
- Scale SVG visuals correctly.
- Keep draggable objects large enough for touch.
- Reorganize instructions and controls below the canvas on narrow screens.
- Avoid horizontal overflow.

Make the game usable without requiring a specific screen resolution.

## 11. Developer tooling

Because this is an experimental project, build a lightweight developer mode.

Include:

- Level selector to jump directly to any puzzle.
- Reset current puzzle.
- Bypass validation / complete level.
- Toggle visual debugging guides.
- Display current object coordinates.
- Option to clear saved progress.

Keep these tools hidden from the normal gameplay interface.

Prefer a simple `?debug=true` URL parameter.

## 12. Code quality

Use a straightforward project structure separating:

- UI components
- Game canvas
- Interaction logic
- Level definitions
- Validation strategies
- Progress storage
- Styling

Use sensible TypeScript types.

Avoid premature abstractions, but preserve clear boundaries around systems we know will evolve.

Make the code understandable for continued development through Codex.

## 13. Acceptance criteria

The prototype is finished when:

1. The application launches locally without errors.
2. The visual design has a coherent Constructivist / Swiss aesthetic.
3. The user can select any of three chapters.
4. Each chapter has five playable levels.
5. SVG elements can be manipulated reliably.
6. Each level has an achievable objective.
7. Players receive meaningful feedback after checking their answers.
8. Successful completion unlocks progression.
9. Progress persists after refreshing the browser.
10. The game works with both mouse and touch input.
11. Developer mode provides debugging and level navigation.
12. The project passes TypeScript checks and a production build.

Add a few automated tests for the deterministic validation functions. Verify that the provided initial levels are solvable.

## 14. Implementation process

1. Initialize the React + Vite + TypeScript project.
2. Establish the visual design system.
3. Build the SVG interaction engine.
4. Implement the modular validation interface.
5. Create three representative levels and make them fully playable.
6. Expand to the complete 15-level prototype.
7. Add progression, persistence, and developer tools.
8. Test interactions and verify the build.
9. Document how to run the project and how to add or modify levels.

When making implementation decisions, prioritize:

**Playability → Clear interaction → Visual quality → Extensibility.**

Do not add features beyond the requested scope simply because they are conventional in games or learning platforms.

Make reasonable decisions autonomously and complete the implementation.

The ultimate goal is a small but genuinely playable experiment that we can use to discover the game's next iteration.
