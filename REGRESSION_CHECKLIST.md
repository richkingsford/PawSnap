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
- [ ] Click **No cuts required** and confirm a 24 × 8 ft ceiling displays six full 4 × 8 ft sheets in two rows of three with no cuts.
- [ ] Click **2 cuts required** and confirm a 12 × 8 ft ceiling displays two full sheets plus two half-sheet pieces, exactly two cuts, and three purchased sheets total.
- [ ] In Mark corners, drag each green endpoint vertically. Confirm its partner on the same horizontal edge moves to the identical Y position, while the other horizontal edge does not move.
- [ ] Confirm Trace outline, Finish, Undo, and the width-point count are absent; calibration marking and point editing still work.
- [ ] Confirm cut sheets use a solid amber fill with no yellow interior stripes.
- [ ] Click **Add dot** and confirm exactly one point is inserted to the right or below the selected point, with the popup attached to the new point.
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
