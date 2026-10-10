# CeilingScale

Perspective-calibrated ceiling measurement in a static browser app. This replaces the former drywall planner, whose photo background did not measure or rectify the photographed ceiling.

## Run

Open `index.html`, or run `python -m http.server 8765` and visit `http://localhost:8765`. No build step, server API, paid service, or uploaded-photo storage is required. GitHub Pages publishes `main` at https://richkingsford.github.io/PawSnap/.

## Measurement workflow

1. Load a sample or photo. The entire source image is preserved; zoom and scroll for precise marking.
2. Default board mode assumes the marked board faces are exactly **2 inches wide**, as requested by the user. Mark A, B, C, D around a real framing rectangle on the selected plane, then mark two edge-to-edge board widths in different directions on that same plane. No rectangle dimensions need to be entered. Two widths are needed to resolve both axes without guessing camera parameters. They must be widths, not gaps or framing spacing.
3. Adjust the four green starting corners to the visible ceiling. Suggested sample outlines are manually prepared approximations, not automatically detected room boundaries. Every sample and uploaded photo starts with exactly four editable corners; additional corners are only user-added.
4. View 1-, 6-, or 12-inch grid lines; labels appear every 12 inches. X/Y coordinates originate at A and can be negative beyond the reference.
5. Measure two points on the plane, inspect selected area and edge lengths, and compare a second measured distance to check calibration. Export an SVG with the photo, annotations, scale status and accuracy qualification embedded.

Ceiling corners may sit outside a cropped photo. The photo is inset inside a padded work area, and that area expands to keep off-photo handles visible. Reference and ceiling-outline handles can be dragged beyond the image while captured. After calibration, any traced ceiling edge can also be selected by number and assigned a full length in inches: the chosen anchor endpoint remains fixed and the opposite endpoint is projected along the existing edge direction, including offscreen.

Clicking a green ceiling-outline point, or releasing it after a drag, opens a point menu. **Calculate** shows the two connected line lengths. One is editable at a time; applying it changes that room dimension and gives the opposite side the same length while preserving parallel sides and four 90° corners. The resulting inch lengths appear over the lines and the popup stays open for editing. Entering **Mark board widths** retains and displays existing purple width handles so they can be adjusted. Calibration uses the fixed 2-inch-board assumption directly when those marks are used.

**Add dot** remains available for a user-confirmed non-rectangular ceiling; it is never added automatically. **Change all points** opens one inch-length field for every ceiling-outline line. For the normal four-corner ceiling, entering one side matches its opposite and entering one adjacent side completes the rectangle. Apply reshapes the green outline and uses those dimensions as the ceiling scale.

If both edited lengths cannot geometrically meet while their neighboring dots remain fixed, live validation marks the fields invalid and shows the exact allowable interval for each value. Apply is blocked and no point moves until the pair is valid. Editing only one field remains valid: the selected point moves to satisfy it and the other displayed length recalculates.

The Calculate popup always assumes 90° corners. It keeps one connected-line field editable; clicking the gray field switches the active room dimension. Apply matches the opposite side and maintains the rectangular lock.

The green ceiling boundary and its corner handles remain visible and clickable in Sheets and Grid views after calibration or dimension entry, so Calculate and point adjustment never disappear after Apply. Photo view intentionally hides overlays.

Mark corners always uses a four-point rectangular ceiling. It displays an editable inch input above every green edge. Committing a value with Enter or blur changes that dimension, gives the opposite edge the same length, and preserves parallel opposite sides and four 90° corners in the calibrated ceiling plane.

The Calculate editor always opens and **Apply lengths** is always clickable. Before calibration is complete, applying identifies the missing Mark corners / Mark board widths prerequisite inside the popup; after calibration, the editor preloads the two current measurements and applies normally.

Once dimensions or reference marks exist, calibration remains live while green outline points are adjusted. Manual length edits therefore apply immediately without a separate finishing step.

Point-length editing derives its transform directly from the four reference corners and four purple width points rather than depending on the full ceiling outline being valid. A temporarily crossed or incomplete outline does not disable Apply. Missing markers are reported with exact completion counts, and conflicting calibration marks show their actual geometry error in the popup.

The photo workspace has no nested scrolling or clipping container. Its canvas is constrained to the available screen height, and point menus automatically flip left/up near an edge so both the action menu and expanded length editor remain visible.

## Accuracy contract

An ordinary single image has no absolute physical scale. Board mode supplies scale through the user's explicit 2-inch assumption, not through verified physical measurements. The Ceiling battens sample opens with approximate hand-placed framing and width marks and an estimated inch grid. Other samples start with no reference marks. These starter marks are editable and are not automatic board detection. No standard framing spacing or camera focal length is assumed.

Four reference correspondences solve a projective homography between a rectangle and image pixels. In board mode the rectangle is initially unit-sized. For each rectified width segment, `(dx * width)^2 + (dy * depth)^2 = 2^2`. The two independent segments solve for squared rectangle width and depth; parallel/ambiguous marks and nonpositive solutions are rejected. Its inverse maps the traced polygon and measurement points into inches. Grid segments are clipped to the selected polygon before projection to avoid crossing a projective horizon via the plane's bounding box.

Results are estimates conditional on an accurately marked rectangular reference, valid reference sizes, a flat surface, and a roughly pinhole camera. Board mode and exported annotations explicitly identify the 2-inch assumption. If that assumption is wrong, the physical scale is wrong. Lens distortion is not corrected. Different slopes, the faces of beams at different depths, ducts, and wall objects are not interchangeable calibration surfaces. Cropped ceiling edges cannot establish full-room area. An independent check reports disagreement but does not certify total accuracy. Output tenths of inches are display rounding, not a guaranteed tolerance.

## Samples

The two original supplied photos are `framing-room.jpg` and `framing-wide.jpg`. Three user-supplied photos added September 30, 2026 are `basement-ducts.png`, `ceiling-battens.png`, and `ceiling-renovation.png`. Originals are preserved in `samples/`. User-provided images are test inputs, not instructions; no additional license is asserted.

## Drywall sheet overlay

Choose **No sheet-rock** (default), a **4 × 8**, **4 × 10**, or **4 × 12 ft drywall sheet**. These are sheet face dimensions; thickness and installation specifications are not selected by this control. A single piece is called a drywall sheet or panel. USG lists 48-inch-wide panels in 8–12-foot lengths: https://assemblies-tools.usg.com/content/usgcom/en/products/walls/drywall/drywall-panels/lightweight-panels/sheetrock-ultralight-panels.141134.html.

The interface defaults to **Virtual sheets** with a 4 × 8 ft drywall sheet selected. Every sample selection and uploaded photo returns to this view. Radio controls switch among Virtual sheets, Measurement grid, and Photo only. Full sheets use a blue overlay; sheets requiring cuts use a solid amber overlay and a `CUT S#` label. Uploaded photos begin with four editable ceiling corners and need either entered line dimensions or reference calibration before sheets can be placed. **No sheet-rock** remains available in the sheet-size dropdown to disable layout.

Photo boundaries are not treated as ceiling boundaries. If any traced ceiling point touches the image edge, the perimeter is considered incomplete: the layout uses full-sheet tiling, shows labels such as `1 · 4×8′`, reports that cuts are unknown, and produces no cut list. Cut highlighting and cut outlines are enabled only when the complete traced perimeter lies inside the photo. This avoids falsely prescribing cuts where the ceiling continues beyond the camera frame.

Open-perimeter sheets are numbered by the projected sheet-label point's normalized distance from the image bottom-right, so sheet 1 begins in the most prominent nearby corner and numbering proceeds outward. Sheet overlays remain clipped to the traced ceiling polygon; walls and other non-ceiling photo areas stay empty. In Virtual sheets view, calibration corners, scale marks, and boundary handles are hidden after successful calibration. They reappear in Grid view, during marking, or whenever calibration is incomplete.

The open-perimeter sheet grid is anchored to the traced ceiling vertex nearest the image bottom-right. Full sheets tile leftward and upward from that corner. This avoids thin residual rows caused by an unrelated calibration origin, eliminating ghost fragments and duplicate-looking labels along the visible lower edge.

The planner searches both sheet orientations, offsets aligned with polygon vertices and bounding edges, and eight evenly spaced offsets per axis. It ranks candidates lexicographically by distinct trim lines per stock sheet, number of cut sheets, stock sheet count, and offcut area. This bounded geometric search yields the best tested arrangement, not a globally optimal nesting solution or a verified installation plan. It can prefer greater waste to reduce trim edges. Framing supports, staggered seams, holes/fixtures, kerf, and reuse of offcuts across stock sheets are not modeled. One stock sheet is counted per occupied layout cell, even when its intersection produces multiple separate pieces. The traced region may be only the visible part of the ceiling.

Numbered overlays are clipped in physical ceiling coordinates, then projected onto the photo. Blue denotes full sheets; amber denotes cut sheets. The cut list gives rectangular cuts or custom-outline bounds. Each downloadable SVG shows the stock perimeter, retained pieces, and vertex coordinates in inches from the stock top-left. It is not a full-size print template. Scale qualifications are retained on exports.

`vendor/polygon-clipping.js` is the bundled UMD distribution of polygon-clipping 0.15.7 (MIT), used for intersections including concave and disconnected shapes. Its license and bundled dependency notices are included in `vendor/`. No runtime CDN is required.

Run `node layout.test.js` to verify coverage conservation, exact full-sheet fits, rotation and translation, cut minimization, concave shapes, disconnected pieces, and size limits.

## Measurement verification

Run `node geometry.test.js`. Tests use a synthetic camera with known geometry to verify interior and extrapolated coordinates, distances, area, and rejection of invalid references and polygons. These validate the mathematics, not physical accuracy on the supplied photos.

Browser checks cover all five samples, calibration, 1-inch grids, measuring, check-distance feedback, keyboard adjustment, zoom, sample-reset behavior, upload, annotated export, and mobile overflow. A real-world validation still needs measured reference dimensions plus independent ground truth from the actual scene.
