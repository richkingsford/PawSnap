# CeilingScale regression checklist

Run this checklist after every interaction or geometry change.

## Corner editing — required invariant

- [ ] Drag one green ceiling corner and release it.
- [ ] Confirm the dragged corner moved.
- [ ] Confirm every other green corner retained its exact coordinates.
- [ ] Open **Calculate** on one green corner.
- [ ] Change only the first connected-line length and apply it.
- [ ] Confirm the selected corner moved and the requested line has the entered length.
- [ ] Confirm every other green corner retained its exact coordinates.
- [ ] Confirm the second connected-line field automatically updates to its new measured length.
- [ ] Repeat by changing only the second connected-line length.
- [ ] Upload a new photo and confirm four editable green ceiling corners appear immediately without Trace/Finish controls.
- [ ] Confirm the app opens directly in permanent corner-calibration mode: four green corners and four line inputs are visible with no Mark corners button, no Mark board widths button or purple-width workflow, and no View section.
- [ ] Make the ceiling outline temporarily invalid while all four reference corners and four purple width points remain valid; Calculate/Apply must still move only the selected point by using the reference calibration directly.
- [ ] With incomplete calibration markers, confirm the popup reports exact completion counts instead of a generic “finish calibration” message.
- [ ] Change both connected-line lengths and confirm the selected point moves to the nearest valid intersection while every other point remains fixed.
- [ ] Enter an impossible pair of lengths and confirm Apply is blocked with exact allowable ranges for both fields; no point may move.

## Calibration controls

- [ ] **Mark corners** leaves all four green ceiling handles visible and draggable, including outside the photo.
- [ ] **Mark board widths** immediately shows all four purple handles and allows them to be dragged.
- [ ] Clicking or dragging a green point leaves its **Calculate / Remove** menu visible.
- [ ] Open every sample and confirm exactly four green corners; there are no automatic extra-corner exceptions.
- [ ] Enter Mark corners and confirm one editable inch input appears above each of the four green edges. Change each orientation in turn and confirm the opposite edge matches, both opposite edges remain parallel, and all four corners remain 90°.
- [ ] Focus each inline line input, type a positive inch value, and press Enter. Repeat by clicking away instead. Confirm both commit paths reshape that dimension, mirror the opposite input, preserve the adjacent dimension, and reject blank, zero, or negative values with a clear inches-specific message.
- [ ] Click **No cuts required** and confirm a 24 × 8 ft ceiling displays six full 4 × 8 ft sheets in exactly two rows and three columns with no cuts; the optimizer must not rotate this preset into one row of six.
- [ ] After selecting **No cuts required**, drag every green corner horizontally and vertically and repeat with arrow keys. Confirm the preset remains selected and the layout remains exactly two rows by three columns after every resize.
- [ ] Select **No cuts required**, change the 288-inch horizontal line to 290 inches, and apply. Confirm the two-row orientation remains: six full 96×48-inch pieces plus two orange 2×48-inch strips. Overlay labels must identify the two pieces and read `KEEP 2×48″`; the Drywall panel must show one **Cut** card and one **Use** card for the saved strip; the summary must report seven stock sheets.
- [ ] Click **1 cut required** and confirm a 12 × 8 ft ceiling displays two full sheets plus two half-sheet pieces produced by exactly one physical crosscut, with three purchased sheets total.
- [ ] With **1 cut required**, confirm orange overlay labels identify `S1` and `S2` without calling both pieces cuts. Confirm **Cut S1** shows one 48 × 96-inch sheet, blue original dimensions outside, green 48-inch post-cut dimensions inside, and one unlabeled dotted line. Confirm **Use S2** has no dotted line and says `Use the 48″ × 48″ piece from Cut S1.`
- [ ] Confirm cut cards use the approved compact installer-ticket layout: sheet diagram on the left, numbered steps on the right, and a green save/reuse reminder.
- [ ] Confirm the cut plan appears at full width in the right pane directly below the ceiling photo, never inside the narrow controls column.
- [ ] Confirm cut diagrams have no overlapping section labels: green **KEEP**, blue **SAVE**, and red **DISCARD** callouts sit outside the sheet and point to their matching sections.
- [ ] Confirm Cut cards do not repeat the diagram's save instruction in a separate green reminder box.
- [ ] Confirm every **Cut S#** card contains exactly one dotted cut line. Plans needing multiple cuts must create a sequence of single-cut cards and carry the saved remainder forward explicitly.
- [ ] Confirm sheet IDs and dimensions remain readable when the full photo is scaled down in the workspace.
- [ ] On a fresh photo, confirm a sheet layout appears immediately from the populated dimension estimates. Enter 1 inch for both room dimensions and confirm one orange partial sheet remains visible, labeled `KEEP 1×1″`; partial sheets must never be hidden because an outline touches or extends beyond the photo.
- [ ] In Mark corners, drag each green endpoint vertically. Confirm its partner on the same horizontal edge moves to the identical Y position, while the other horizontal edge does not move.
- [ ] Repeat every four-corner vertical drag in Sheets/Grid Adjust mode and with Up/Down arrow keys. The linked endpoint must move to the identical Y coordinate; a horizontal green edge must never become diagonal in any editable mode.
- [ ] Confirm Trace outline, Finish, Undo, and the width-point count are absent; calibration marking and point editing still work.
- [ ] Confirm cut sheets use a solid amber fill with no yellow interior stripes.
- [ ] Click **Add dot** and confirm exactly one point is inserted to the right or below the selected point, with the popup attached to the new point.
- [ ] After **Add dot**, confirm there is still exactly one editable inch input for every outline edge. Drag the new point until either adjacent edge reaches 45° or less from horizontal; confirm that edge immediately becomes exactly horizontal and its connected endpoint follows. Repeat with arrow keys and a typed edge length.
- [ ] Create a 6-point orthogonal outline where one 290-inch horizontal wall opposes two horizontal segments. Change any one line input and apply. Confirm no input is blank, all edges remain horizontal or vertical, the two opposing horizontal segments total exactly 290 inches, vertical signed totals also match, and the edited value itself is preserved.
- [ ] On the same multi-point outline, drag and keyboard-move every point horizontally and vertically. Confirm every displayed inch value remains byte-for-byte unchanged, horizontal screen edges remain horizontal, vertical edges may lean with photo perspective, and every line input follows the midpoint of its own green edge.
- [ ] Grab a point with one horizontal neighbor and one perspective/vertical neighbor, then drag it until the perspective edge crosses 45°. Confirm only the neighbor that was horizontal at drag start follows vertically; the perspective neighbor must retain both original coordinates and never jump.
- [ ] On the normal four-corner outline, drag Dot 3 lower and sideways. Confirm Dot 4 follows vertically to preserve the true bottom horizontal wall, while Dot 2 retains both exact coordinates even if the perspective side wall looks shallower than 45°.
- [ ] Open **Change all points** with and without completed scale marks. Confirm there is exactly one inch-length input for every outline line and no missing-corners message replaces the fields.
- [ ] On a calibrated photo, change one line and Apply. Confirm its opposite line matches, opposite lines stay parallel, and every corner remains 90°.
- [ ] On an uncalibrated four-corner photo, enter Line 1 and confirm Line 3 matches automatically; enter Line 2 and confirm Line 4 matches. Apply without scale marks and confirm area, grid, and sheets become calibrated from those dimensions.
- [ ] After applying dimensions in Sheets view, confirm the green boundary and every green corner remain visible and clickable. Reopen the two-box Calculate editor, change its editable line, and confirm the opposite side matches while the rectangle remains locked.
- [ ] Clear a changed all-lines value or enter an impossible 90° length and confirm specific validation appears and no point moves.
- [ ] Confirm the popup shows the brief **90° corners assumed** note, with no checkbox. Exactly one connected-line field is editable and the other is visibly grayed.
- [ ] Repeat on every sample corner. If the initially preferred line is too long to be a right-triangle leg, confirm the other valid line becomes active automatically and its partner is calculated.
- [ ] Click the grayed field. Confirm it becomes editable and the previously active field becomes grayed.
- [ ] Enter a valid active-leg length and confirm the other leg calculates automatically; Apply must move only the selected point and produce a 90° angle.
- [ ] Enter a leg length equal to or greater than the fixed neighbor spacing and confirm validation shows the exact valid interval and blocks Apply.

## Workspace and sheet overlay

- [ ] The photo workspace has no nested scrollbar.
- [ ] Point menus remain fully visible at the top, right, bottom, and left edges.
- [ ] Open-photo layouts show only complete drywall sheets, with one centered label per sheet.
- [ ] No cut is shown where the photographed ceiling boundary is incomplete.
