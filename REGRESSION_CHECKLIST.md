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
- [ ] Change both connected-line lengths and confirm the selected point moves to the nearest valid intersection while every other point remains fixed.
- [ ] Enter an impossible pair of lengths and confirm an inline error appears without moving any point.

## Calibration controls

- [ ] **Mark corners** leaves all four reference handles visible and draggable, including outside the photo.
- [ ] **Mark board widths** immediately shows all four purple handles and allows them to be dragged.
- [ ] Clicking or dragging a green point leaves its **Calculate / Remove** menu visible.

## Workspace and sheet overlay

- [ ] The photo workspace has no nested scrollbar.
- [ ] Point menus remain fully visible at the top, right, bottom, and left edges.
- [ ] Open-photo layouts show only complete drywall sheets, with one centered label per sheet.
- [ ] No cut is shown where the photographed ceiling boundary is incomplete.
