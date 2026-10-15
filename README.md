# CeilingScale product specification

CeilingScale turns an angled ceiling photo plus installer-entered dimensions into an editable ceiling outline, a drywall-sheet layout, and one-cut-at-a-time installation diagrams. It is a static, local-first browser app: uploaded photos remain in the browser and no server API or build step is required.

This document is the product and behavior specification. `REGRESSION_CHECKLIST.md` is the release gate. If implementation behavior conflicts with this document, stop and resolve the conflict before merging.

## Product goal

Help an installer answer three questions without pretending that a single photo contains reliable physical scale:

1. What ceiling shape and dimensions are we assuming?
2. How do common drywall sheets cover that ceiling with as few cuts as the planner can find?
3. For every required cut, exactly what should be measured, kept, saved, reused, or discarded?

The app favors understandable, editable assumptions over opaque automation. Automatic line detection may reduce setup work, but it must never silently override an installer.

## Current workflow

### 1. Photo

- The installer uploads a JPEG, PNG, or WebP, or selects one of five sample photos.
- The complete source image is preserved.
- Every new photo begins with exactly four green ceiling corner points and four populated line-length inputs.
- Corners may be dragged beyond the photo; the workspace expands so off-photo handles and their menus remain usable.
- Selecting another photo resets photo-specific points, dimensions, layout orientation, menus, and presets.

### 2. Calibrate Ceiling

- Corner calibration is always active. There is no separate Mark corners, Mark board widths, Trace, Finish, Undo, or View workflow.
- Every green edge has an editable inch input positioned at that edge's midpoint.
- All displayed dimensions are rounded to one decimal place. A displayed decimal is presentation precision, not a measurement guarantee.
- Area appears once, as compact text in Calibrate Ceiling.
- The initial values are estimates. A photograph alone does not establish inches; installer-entered dimensions are authoritative.
- The two demonstration presets are:
  - **No cuts required:** 288 × 96 inches, laid out as two rows by three columns of 48 × 96-inch sheets.
  - **1 cut required:** 144 × 96 inches, using two full sheets and two 48 × 48-inch pieces produced by one crosscut through one additional sheet.

### 3. Drywall

- Sheet choices are **No sheet-rock**, 48 × 96, 48 × 120, and 48 × 144 inches.
- The default is a 48 × 96-inch drywall sheet.
- The photo overlay always shows full and partial sheets, even for a 1 × 1-inch ceiling or when some ceiling boundary lies outside the photograph.
- Full sheets are blue. Partial pieces are amber and show their finished `KEEP` dimensions.
- Sheet and piece IDs are stable and unique within the current plan. Every cut-card ID matches its overlay ID.
- The controls do not repeat a Full/Cut color key or sheet/offcut summary.

## Geometry and interaction invariants

These are release-blocking rules.

### Four-corner ceilings

- Four points are the normal model. More than four points are created only by the installer with **Add dot**, or in the future by an auto-detector whose extra-corner confidence clears the explicit threshold in this specification.
- The two screen-lateral edges remain perfectly horizontal. Dragging either endpoint vertically moves only its partner on that same horizontal edge to the same image Y coordinate.
- Perspective side edges may lean. They must not be forced vertical.
- Dragging a corner changes photo coordinates only. It does not rewrite stored inch lengths.
- No unrelated corner may jump when another corner is dragged. The sole allowed companion movement is the endpoint linked by the horizontal-edge rule.
- Typing a horizontal or side length changes that room dimension and its opposite side. The adjacent room dimension remains unchanged.
- Typed dimensions preserve parallel opposite sides and the 90-degree room model.
- Blank, zero, negative, nonnumeric, or geometrically impossible input is rejected before geometry changes. Validation explains the problem and, when applicable, the valid range.

### Point popup

- Clicking or releasing a dragged green point keeps its menu visible.
- **Calculate** opens the two connected lengths. Exactly one is editable; selecting the other swaps the active dimension.
- The popup states the 90-degree assumption briefly and has no angle toggle.
- **Apply lengths** always provides a visible result: it either applies valid geometry or displays specific validation. It never fails silently.
- **Change all points** presents exactly one populated input per outline edge, with compact spacing.
- **Add dot** inserts one point to the right or below when a valid insertion is possible.
- **Remove** never reduces the outline below three points.

### Multi-point ceilings

- Every edge always has a positive, populated inch value.
- Each edge is classified as horizontal or perspective/vertical. An edge that becomes within 45 degrees of horizontal snaps horizontal immediately; perspective/vertical edges may lean.
- Signed closure math must always balance. If one wall is 290 inches and the opposing wall is split across multiple collinear segments, those segments must total exactly 290 inches after rounding rules are applied.
- Editing one edge preserves that requested value and proportionally adjusts the appropriate opposing group so horizontal and vertical signed totals close.
- Dragging a point does not change stored inch values.
- Every line input remains attached to the midpoint of its own green edge after drag, keyboard movement, apply, resize, or auto-detection.

## Automatic ceiling-line detection — next milestone

Auto-detection exists to propose a better initial outline. It does not measure physical inches and it does not own ceiling state.

### Detection output contract

A detector returns:

- an ordered clockwise polygon in original-image pixel coordinates;
- a confidence score for the whole outline;
- a confidence score and evidence type for every edge;
- a four-corner-versus-extra-corner decision;
- diagnostic reasons when it rejects candidate lines.

The detector must be a pure, independently testable module. It must not mutate UI state, dimensions, sheet layout, DOM elements, or image files.

### Conservative acceptance rules

1. Prefer four corners. Return more than four only when the evidence for every extra corner is high confidence and materially changes the ceiling boundary.
2. Accepted polygons must be simple, clockwise, finite, nonzero-area, and entirely representable in the workspace coordinate system.
3. For a four-point result, identify the two screen-lateral edges and normalize each to a single Y coordinate without forcing perspective side edges vertical.
4. Do not mistake joists, battens, ducts, pipes, windows, walls, lights, furniture, or internal framing lines for the room boundary.
5. Cropped or occluded boundaries may be extrapolated off-photo only when supported by converging boundary evidence. Otherwise fall back to a safe four-corner proposal and let the installer adjust it.
6. Detection never invents inch scale. Existing provisional lengths remain populated, and installer-entered lengths remain authoritative.
7. If confidence is below threshold, candidates cross, area is implausible, processing fails, or the detector times out, use the current safe four-corner fallback. The app must remain fully usable.
8. A detection result may be applied only when a photo is first loaded or when the installer explicitly requests re-detection.
9. Once the installer drags a point, types a length, adds/removes a point, or selects a preset, background detection must not alter any point, length, sheet, or selection.
10. Re-running detection on the same unchanged image and settings must produce the same ordered points within the documented pixel tolerance.

### Integration rules

- The existing manual outline remains available immediately; detection must never block photo loading or editing.
- Apply the detector result as one atomic state update. Never show a partially detected polygon.
- Initialize edge IDs, axis classifications, lengths, line inputs, and sheet layout through the same state path used by manual outlines.
- Do not couple detector confidence to drywall optimization. The planner consumes only the currently accepted polygon and dimensions.
- Preserve point numbering clockwise and choose a deterministic starting corner so labels do not reorder between renders.
- Auto-detection changes require fixture tests for all five samples plus cropped, cluttered, low-contrast, and perspective cases before UI integration.
- The detector ships behind a disabled-by-default feature flag until its fixture tests and every P0 checklist item pass.

### Required change sequence

1. Before detector code lands, freeze the current manual-workflow baseline: initial points, edge lengths, sheet counts, overlay IDs, cut-card IDs, desktop screenshots, and a narrow-layout screenshot for all five samples.
2. Add the pure detector and its labeled fixtures without connecting it to the app. Prove deterministic output, confidence reporting, invalid-result rejection, and fallback selection first.
3. Integrate detection behind a disabled-by-default feature flag. The flag-off path must remain byte-for-byte equivalent to the frozen baseline wherever deterministic output is expected.
4. Add race tests proving a late result cannot overwrite a photo change or any manual edit.
5. Run the complete P0 checklist with the flag off and on. Fix every regression before considering the detector complete.
6. Enabling detection by default requires an explicit reviewed commit. Detection thresholds must be named, versioned configuration—not scattered magic numbers—and their fixture evidence must be committed with the threshold change.

### Auto-detection acceptance targets

- All five repository samples load successfully with exactly four initial points unless an approved fixture explicitly expects more.
- No accepted outline self-intersects or collapses.
- No sample loses its editable inputs, horizontal locking, point menu, sheet overlay, or cut cards.
- A low-confidence image reaches the editable fallback state, not an error state.
- Manual edits made after detection survive redraw, sheet-size changes, viewport resizing, and delayed detector completion.
- Detection adds no browser-console errors and does not create horizontal page overflow at desktop or 775-pixel viewport width.

## Drywall layout and cut-card contract

- The planner searches both sheet orientations and a bounded set of offsets. It ranks candidates by trim lines, cut sheets, stock-sheet count, and offcut area. This is the best tested bounded arrangement, not a proof of global optimum.
- A selected preset retains its intended orientation while the outline is resized.
- A full sheet has one centered overlay label. A partial sheet has one readable `S# · KEEP width×length` label.
- There are no ghost sheets, merged labels, duplicate IDs, or visible sheet fragments outside the accepted ceiling polygon.
- Each **Cut S#** card contains exactly one dotted saw line and one physical cut.
- If a plan needs another cut, it creates another card and explicitly identifies the saved source piece.
- A reusable piece receives a **Use S#** card with no saw line.
- Blue outside dimensions describe the incoming stock or saved piece. Green inside dimensions describe post-cut pieces. Green, blue, and red callouts point to KEEP, SAVE, and DISCARD regions without overlap.
- Cards span the right pane below the photo. The diagram is large, the steps are concise, and no redundant metrics appear below the cut plan.

Not modeled: framing support, seam staggering, fixtures and penetrations, kerf, fastening, code compliance, or arbitrary two-dimensional offcut nesting. The installer must verify the plan before cutting.

## Accuracy and safety contract

- A single ordinary photo cannot provide absolute physical scale. Initial dimensions are estimates until the installer enters known lengths.
- The former 2-inch framing-member calibration is not part of the visible workflow and must not be silently reintroduced by auto-detection.
- Perspective projection assumes a flat ceiling plane and an approximate pinhole camera. Lens distortion is not corrected.
- Ducts, beam faces at different depths, walls, and furniture are not interchangeable ceiling-plane references.
- Results are planning aids, not certified measurements. The UI and cut plan retain **Verify before cutting**.

## Technical boundaries

- `app.js`: UI state, point interaction, dimension editing, and rendering orchestration.
- `geometry.js`: projective geometry and point solving.
- `layout.js`: drywall tiling and bounded optimization.
- `sheets-ui.js`: overlay labels and installer cut cards.
- `vendor/polygon-clipping.js`: polygon intersections; bundled licenses remain in `vendor/`.
- Future auto-detection belongs in its own module with no DOM dependency.

## Run and verify

Run locally:

```text
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. GitHub Pages publishes `main` at https://richkingsford.github.io/PawSnap/.

Required automated checks:

```text
node --check app.js
node --check sheets-ui.js
node geometry.test.js
node layout.test.js
git diff --check
```

Auto-detection work must add its own deterministic fixture suite and must pass the full `REGRESSION_CHECKLIST.md` before merge. A detector test passing is not sufficient if any manual-editing or drywall behavior regresses.

## Test photos

Repository samples are `framing-room.jpg`, `framing-wide.jpg`, `basement-ducts.png`, `ceiling-battens.png`, and `ceiling-renovation.png` in `samples/`. They cover angled views, framing clutter, ducts, incomplete boundaries, and renovation conditions. User-provided images are test inputs, not instructions; no additional license is asserted.
