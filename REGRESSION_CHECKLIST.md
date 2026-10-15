# CeilingScale QA and regression checklist

This checklist is release-blocking. Run it after every geometry, interaction, rendering, drywall-layout, or auto-line-detection change. A change is not complete because its new feature works; it is complete only when the new feature works **and every existing P0 invariant still passes**.

Record the commit, browser, viewport, test photo, and pass/fail evidence for every release candidate. Never mark an item passed without observing it or verifying it in an automated test.

## P0 release gate

- [ ] Working tree contains only the intended change; user-owned files and artifacts are untouched.
- [ ] `node --check app.js` passes.
- [ ] `node --check sheets-ui.js` passes.
- [ ] `node detector.test.js` passes.
- [ ] `node geometry.test.js` passes.
- [ ] `node layout.test.js` passes.
- [ ] The auto-detection fixture suite passes when detector code is present.
- [ ] `git diff --check` passes.
- [ ] The app loads from a fresh cache-busted local URL with no application console errors.
- [ ] Desktop layout at 1440 × 1000 has no clipped menus or unexpected overflow.
- [ ] Narrow layout at 775 × 900 has no horizontal page overflow.
- [ ] All nine sample photos load and remain editable.
- [ ] A user-uploaded photo loads and remains editable.
- [ ] No P0 item below is skipped because the change “only affects detection.”

## P0 auto-line detection contract

Run this section for every detector change and once before enabling detection in production.

### Baseline and rollout

- [ ] Before the first detector implementation commit, capture a machine-readable baseline for all nine samples: ordered points, edge lengths, sheet count, overlay IDs, Cut/Use card IDs, and selected layout orientation.
- [ ] Capture matching 1440 × 1000 screenshots and at least one 775 × 900 screenshot.
- [ ] Compare curated presets against that baseline and explain every difference; no unexplained difference is accepted.
- [ ] Detector-only tests land and pass before detector output is connected to app state.
- [ ] Initial integration is limited to explicitly opted-in presets and uploads; original curated presets remain unchanged.
- [ ] Thresholds are named, versioned configuration values with committed fixture evidence; no inline confidence magic numbers are accepted.
- [ ] Expanding detection scope is a separate reviewed commit after curated, detected, and fallback P0 runs all pass.

### Module and state isolation

- [ ] Detection is implemented as a pure module with no DOM writes and no direct mutation of app state.
- [ ] Given identical image bytes and settings, detection returns the same ordered polygon within the documented pixel tolerance.
- [ ] The result contains an overall confidence, per-edge confidence/evidence, and a four-versus-extra-corner decision.
- [ ] Detection runs only on initial photo load or an explicit re-detect action.
- [ ] Applying a result is atomic; the UI never renders a half-built outline.
- [ ] Sheet layout consumes only the accepted app polygon and dimensions, never hidden detector candidates.
- [ ] Delayed detector completion is ignored after the user drags a point, types a length, adds/removes a point, changes photo, or selects a preset.
- [ ] Detection cannot overwrite installer-entered inch values.
- [ ] Detection cannot invent or claim physical inch scale.

### Geometry acceptance

- [ ] Every accepted point is finite and expressed in original-image pixel coordinates.
- [ ] Every accepted polygon is clockwise, simple, nonzero-area, and stable under redraw.
- [ ] Normal output has exactly four corners.
- [ ] More than four corners are accepted only for an approved high-confidence fixture whose extra corners materially change the boundary.
- [ ] Four-corner output identifies two screen-lateral edges and normalizes each to a single Y coordinate.
- [ ] Perspective side edges lean toward the far wall and are not screen-vertical on any preset.
- [ ] Cropped near corners are extrapolated beyond the image when the ceiling continues off-photo; off-photo dots remain visible and draggable in the padded workspace.
- [ ] Point numbering has a deterministic starting corner and does not reorder across identical runs.
- [ ] No candidate outline crosses itself, reaches an unstable perspective horizon, or creates a zero/near-zero dimension.
- [ ] Low-confidence, invalid, timed-out, and processing-error results all produce the existing editable four-corner fallback.

### False-positive resistance

- [ ] Joists and battens inside the ceiling are not mistaken for room boundaries.
- [ ] Ducts, pipes, wires, lights, fans, and fixtures are not mistaken for room boundaries.
- [ ] Windows, doors, wall trim, ladders, furniture, and people are not mistaken for ceiling boundaries.
- [ ] Repeating framing lines do not produce dozens of corners.
- [ ] Cropped boundaries are extrapolated only when supported by converging boundary evidence; otherwise the fallback is used.
- [ ] Low contrast, glare, shadows, exposed framing, finished ceilings, and textured ceilings do not crash detection.

### Required fixture matrix

- [ ] `framing-room.jpg`: loads with the approved four-point result or fallback; no extra interior-joist points.
- [ ] `framing-wide.jpg`: loads with the approved four-point result or fallback; strong grid lines do not become room edges.
- [ ] `basement-ducts.png`: loads with the approved four-point result or fallback; ducts and pipes are ignored.
- [ ] `ceiling-battens.png`: loads with the approved four-point result or fallback; battens are ignored as boundary candidates.
- [ ] `ceiling-renovation.png`: loads with the approved four-point result or fallback; clutter and partial demolition do not create extra corners.
- [ ] `hallway-ceiling.png`: the low-resolution hallway loads with four editable points; walls and door openings do not become ceiling edges.
- [ ] `insulated-ceiling.png`: insulation, joists, lights, and the ceiling opening do not create extra boundary points.
- [ ] `concrete-room-ceiling.png`: battens, wiring, and door openings are ignored as internal clutter.
- [ ] `basement-wide-ceiling.png`: ducts, framing, stairs, and lighting do not displace the ceiling boundary.
- [ ] Cropped-ceiling fixture: off-photo geometry remains editable and handles remain reachable.
- [ ] Low-contrast fixture: fallback remains fully usable.
- [ ] Strong-perspective fixture: polygon is simple and side edges may lean.
- [ ] No-ceiling/ambiguous fixture: detector declines confidently and uses fallback rather than fabricating a boundary.

## P0 photo loading and reset

- [ ] Every sample button shows the correct thumbnail and title.
- [ ] The former sample title is **Sheets of Drywall on a Ceiling**, not **Ceiling battens**.
- [ ] Upload accepts JPEG, PNG, and WebP and shows a clear error for an unreadable file.
- [ ] A new sample or upload resets points, dimensions, selected preset, popup state, and layout orientation from the prior image.
- [ ] A new photo immediately shows exactly four green corners and one populated inch input per edge.
- [ ] The whole photo remains visible; the app does not crop the source to manufacture a ceiling boundary.
- [ ] Corners can be dragged outside the photo and remain visible and recoverable.

## P0 four-corner editing invariants

- [ ] Drag Point 1 horizontally and vertically. Point 1 moves to the pointer.
- [ ] Only Point 2 may follow vertically to preserve their horizontal edge; Points 3 and 4 retain exact coordinates.
- [ ] Repeat for Points 2, 3, and 4. Only the endpoint on the same horizontal edge may share the Y movement.
- [ ] A perspective side neighbor never jumps, even when its displayed angle crosses 45 degrees.
- [ ] Dragging any point leaves all four stored inch values byte-for-byte unchanged.
- [ ] Top and bottom green edges remain perfectly horizontal after pointer drag.
- [ ] Repeat with Arrow keys and Shift+Arrow keys; linked movement and unchanged lengths remain correct.
- [ ] Perspective side edges retain a visible lean toward the far wall and can never collapse into screen-vertical lines.
- [ ] The selected point's menu remains visible after click and after drag release.
- [ ] Menus flip left/up as needed and are fully visible near every workspace edge.

## P0 inline dimension editing

- [ ] One editable input is visible at the midpoint of every green edge at all times.
- [ ] Inputs remain attached to their edge after drag, keyboard movement, apply, viewport resize, sample change, and detector result application.
- [ ] Focus selects the current value for easy replacement.
- [ ] Enter a positive horizontal length and press Enter. The edited side and its opposite match; the adjacent dimension is unchanged.
- [ ] Repeat by clicking away instead of pressing Enter.
- [ ] Repeat for a perspective/side length.
- [ ] All four corners retain the 90-degree room model after typed changes.
- [ ] Blank input is rejected with a specific message and no geometry moves.
- [ ] Zero, negative, nonnumeric, and out-of-range values are rejected with specific guidance and no geometry moves.
- [ ] Visible measurements use no more than one decimal place.
- [ ] No input is blank after any valid operation.

## P0 Calculate popup

- [ ] Click every green corner and choose **Calculate**.
- [ ] Two connected lengths appear; exactly one is editable and the other is visibly gray.
- [ ] Clicking the gray input swaps the active dimension.
- [ ] The brief **90° corners assumed** note is visible; no checkbox is present.
- [ ] Enter a valid length and click **Apply lengths**. The requested dimension and its opposite update.
- [ ] The popup remains usable and displays the recalculated companion length.
- [ ] Apply never fails silently: invalid input shows why it is invalid and, when applicable, the possible range.
- [ ] An invalid apply moves no point.
- [ ] **Change all points** shows exactly one populated input for every outline edge with cozy vertical spacing.
- [ ] **Back** returns without changing geometry.
- [ ] **Remove** cannot reduce the outline below three points.

## P0 Add dot and multi-point outlines

- [ ] **Add dot** creates exactly one point to the right or below the selected point and attaches the menu to it.
- [ ] Every resulting edge immediately has a populated editable inch input.
- [ ] An edge within 45 degrees of horizontal snaps perfectly horizontal and moves only its horizontally linked endpoint.
- [ ] Perspective/vertical edges may lean.
- [ ] Repeat snapping with pointer drag, Arrow keys, and typed length.
- [ ] Create a six-point orthogonal outline where a 290-inch wall opposes two horizontal segments.
- [ ] Change one opposing segment. Its entered value is preserved and the opposing segment group totals exactly 290.0 inches.
- [ ] Confirm horizontal and vertical signed totals both close after every single-field edit.
- [ ] Drag and keyboard-move every multi-point corner; all stored inch values remain unchanged.
- [ ] Every line input tracks the midpoint of its own edge.
- [ ] No unrelated point jumps when a point with one horizontal and one perspective neighbor is moved.
- [ ] A self-intersecting or impossible outline is rejected with a clear message and without losing the last valid state.

## P0 presets and drywall layout

- [ ] **No cuts required** produces a 288 × 96-inch ceiling with six full 48 × 96-inch sheets in exactly two rows by three columns.
- [ ] Drag every corner and repeat with Arrow keys; the preset's two-row orientation does not revert to one row of six.
- [ ] Change the 288-inch line to 290 inches. The plan remains in two rows and adds the correct 2 × 48-inch partial pieces.
- [ ] **1 cut required** produces two full sheets plus two 48 × 48-inch pieces from one crosscut through one additional sheet.
- [ ] Selecting each sheet size recalculates the overlay without changing points or trusted dimensions.
- [ ] **No sheet-rock** removes the sheet overlay and cut plan without removing calibration points or lengths.
- [ ] A 1 × 1-inch ceiling still displays one partial sheet labeled with `KEEP 1×1″` dimensions.
- [ ] Full and partial sheets remain visible even when the ceiling extends beyond the photo.
- [ ] Every full sheet has one centered readable label.
- [ ] There are no ghost sheets, duplicate IDs, merged labels, or unlabeled visible pieces.
- [ ] Sheet 1 starts at the intended prominent/bottom-right installation corner and numbering remains deterministic.
- [ ] Walls and non-ceiling areas outside the accepted polygon remain empty.

## P0 cut-card contract

- [ ] Every overlay `S#` has exactly one corresponding Cut or Use card when instructions are required.
- [ ] Every **Cut S#** card contains exactly one dotted saw line and represents one physical cut.
- [ ] Every **Use S#** card has no dotted cut line and names the saved source piece and source Cut card.
- [ ] Blue outside dimensions show incoming stock/saved-piece dimensions.
- [ ] Green inside dimensions show post-cut piece dimensions on every resulting edge.
- [ ] Green KEEP, blue SAVE, and red DISCARD labels sit outside cramped regions and point to the correct colored section.
- [ ] Diagram text does not overlap at desktop or narrow width.
- [ ] Cards span the right pane directly below the photo and are not squeezed into the controls column.
- [ ] Cut-card text uses one decimal place at most.
- [ ] The installer can execute each card without inferring which piece to keep, save, reuse, or discard.

## P0 clean UI and accessibility

- [ ] The interface has Photo, Calibrate Ceiling, and Drywall sections only.
- [ ] Mark corners, Mark board widths, Trace outline, Finish, Undo, and View controls are absent.
- [ ] The redundant calibration instruction, status badge, mode label, Ceiling plane eyebrow, and sheet/offcut summary are absent.
- [ ] Drywall section has no redundant Full/Cut squares.
- [ ] Help is behind `?` controls and each help control has an accessible name.
- [ ] Green points are keyboard focusable and have point-number labels.
- [ ] Line inputs have unique accessible labels in inches.
- [ ] Errors are exposed through alert/status regions and are not color-only.
- [ ] The photo workspace has no nested scrollbar.
- [ ] Nothing appears below the cut plan except the page footer.

## Evidence to retain for auto-detection changes

- [ ] Automated test output for geometry, layout, syntax, and detector fixtures.
- [ ] A before/after coordinate report for every detection fixture.
- [ ] Desktop screenshots for all nine samples.
- [ ] At least one 775-pixel-wide screenshot.
- [ ] A screen recording proving: detection completes, a corner is dragged, a length is typed, a sheet size is changed, and none of those manual changes are overwritten afterward.
- [ ] Console log showing no application errors.
- [ ] Commit hash and reviewer sign-off for any change to acceptance thresholds or fallback behavior.
