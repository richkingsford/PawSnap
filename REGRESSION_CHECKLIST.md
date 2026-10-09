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
- [ ] Repeat a one-line edit while **Trace outline** is still active and before pressing **Finish**; Apply must move the selected point.
- [ ] Make the ceiling outline temporarily invalid while all four reference corners and four purple width points remain valid; Calculate/Apply must still move only the selected point by using the reference calibration directly.
- [ ] With incomplete calibration markers, confirm the popup reports exact completion counts instead of a generic “finish calibration” message.
- [ ] Change both connected-line lengths and confirm the selected point moves to the nearest valid intersection while every other point remains fixed.
- [ ] Enter an impossible pair of lengths and confirm Apply is blocked with exact allowable ranges for both fields; no point may move.
- [ ] Enter the exact conflicting pair 111″ then 222″ on point 2. Confirm the popup explains why they cannot meet and displays each field's valid range.

## Calibration controls

- [ ] **Mark corners** leaves all four reference handles visible and draggable, including outside the photo.
- [ ] **Mark board widths** immediately shows all four purple handles and allows them to be dragged.
- [ ] Clicking or dragging a green point leaves its **Calculate / Remove** menu visible.
- [ ] Check **90° angles only**. Confirm exactly one length field is editable and the other is visibly grayed.
- [ ] Repeat on every sample corner. If the initially preferred line is too long to be a right-triangle leg, confirm the other valid line becomes active automatically and its partner is calculated.
- [ ] Click the grayed field. Confirm it becomes editable and the previously active field becomes grayed.
- [ ] Enter a valid active-leg length and confirm the other leg calculates automatically; Apply must move only the selected point and produce a 90° angle.
- [ ] Enter a leg length equal to or greater than the fixed neighbor spacing and confirm validation shows the exact valid interval and blocks Apply.

## Workspace and sheet overlay

- [ ] The photo workspace has no nested scrollbar.
- [ ] Point menus remain fully visible at the top, right, bottom, and left edges.
- [ ] Open-photo layouts show only complete drywall sheets, with one centered label per sheet.
- [ ] No cut is shown where the photographed ceiling boundary is incomplete.
