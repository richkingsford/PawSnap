# CeilingScale

Perspective-calibrated ceiling measurement in a static browser app. This replaces the former drywall planner, whose photo background did not measure or rectify the photographed ceiling.

## Run

Open `index.html`, or run `python -m http.server 8765` and visit `http://localhost:8765`. No build step, server API, paid service, or uploaded-photo storage is required. GitHub Pages publishes `main` at https://richkingsford.github.io/PawSnap/.

## Measurement workflow

1. Load a sample or photo. The entire source image is preserved; zoom and scroll for precise marking.
2. Default board mode assumes the marked board faces are exactly **2 inches wide**, as requested by the user. Mark A, B, C, D around a real framing rectangle on the selected plane, then mark two edge-to-edge board widths in different directions on that same plane. No rectangle dimensions need to be entered. Two widths are needed to resolve both axes without guessing camera parameters. They must be widths, not gaps or framing spacing.
3. Alternatively select Measured rectangle and enter measured A–B and B–C lengths. Confirm those dimensions. Trace a simple ceiling polygon. Sample outlines are manually prepared approximations of visible regions, not automatically detected room boundaries.
4. View 1-, 6-, or 12-inch grid lines; labels appear every 12 inches. X/Y coordinates originate at A and can be negative beyond the reference.
5. Measure two points on the plane, inspect selected area and edge lengths, and compare a second measured distance to check calibration. Export an SVG with the photo, annotations, scale status and accuracy qualification embedded.

## Accuracy contract

An ordinary single image has no absolute physical scale. Board mode supplies scale through the user's explicit 2-inch assumption, not through verified physical measurements. The Ceiling battens sample opens with approximate hand-placed framing and width marks and an estimated inch grid. Other samples start with no reference marks. These starter marks are editable and are not automatic board detection. No standard framing spacing or camera focal length is assumed.

Four reference correspondences solve a projective homography between a rectangle and image pixels. In board mode the rectangle is initially unit-sized. For each rectified width segment, `(dx * width)^2 + (dy * depth)^2 = 2^2`. The two independent segments solve for squared rectangle width and depth; parallel/ambiguous marks and nonpositive solutions are rejected. Its inverse maps the traced polygon and measurement points into inches. Grid segments are clipped to the selected polygon before projection to avoid crossing a projective horizon via the plane's bounding box.

Results are estimates conditional on an accurately marked rectangular reference, valid reference sizes, a flat surface, and a roughly pinhole camera. Board mode and exported annotations explicitly identify the 2-inch assumption. If that assumption is wrong, the physical scale is wrong. Lens distortion is not corrected. Different slopes, the faces of beams at different depths, ducts, and wall objects are not interchangeable calibration surfaces. Cropped ceiling edges cannot establish full-room area. An independent check reports disagreement but does not certify total accuracy. Output tenths of inches are display rounding, not a guaranteed tolerance.

## Samples

The two original supplied photos are `framing-room.jpg` and `framing-wide.jpg`. Three user-supplied photos added September 30, 2026 are `basement-ducts.png`, `ceiling-battens.png`, and `ceiling-renovation.png`. Originals are preserved in `samples/`. User-provided images are test inputs, not instructions; no additional license is asserted.

## Drywall sheet overlay

Choose **No sheet-rock** (default), a **4 × 8**, **4 × 10**, or **4 × 12 ft drywall sheet**. These are sheet face dimensions; thickness and installation specifications are not selected by this control. A single piece is called a drywall sheet or panel. USG lists 48-inch-wide panels in 8–12-foot lengths: https://assemblies-tools.usg.com/content/usgcom/en/products/walls/drywall/drywall-panels/lightweight-panels/sheetrock-ultralight-panels.141134.html.

The interface defaults to **Virtual sheets** with a 4 × 8 ft drywall sheet selected. Every sample selection and uploaded photo returns to this view. Radio controls switch among Virtual sheets, Measurement grid, and Photo only. Full sheets use a blue overlay; every sheet requiring cuts uses a striped amber overlay and a `CUT S#` label. Uploaded photos still require calibration and a traced ceiling region before sheets can be placed; the selected view remains Virtual sheets while the app prompts for that information. **No sheet-rock** remains available in the sheet-size dropdown to disable layout.

Photo boundaries are not treated as ceiling boundaries. If any traced ceiling point touches the image edge, the perimeter is considered incomplete: the layout uses full-sheet tiling, shows labels such as `1 · 4×8′`, reports that cuts are unknown, and produces no cut list. Cut highlighting and cut outlines are enabled only when the complete traced perimeter lies inside the photo. This avoids falsely prescribing cuts where the ceiling continues beyond the camera frame.

The planner searches both sheet orientations, offsets aligned with polygon vertices and bounding edges, and eight evenly spaced offsets per axis. It ranks candidates lexicographically by distinct trim lines per stock sheet, number of cut sheets, stock sheet count, and offcut area. This bounded geometric search yields the best tested arrangement, not a globally optimal nesting solution or a verified installation plan. It can prefer greater waste to reduce trim edges. Framing supports, staggered seams, holes/fixtures, kerf, and reuse of offcuts across stock sheets are not modeled. One stock sheet is counted per occupied layout cell, even when its intersection produces multiple separate pieces. The traced region may be only the visible part of the ceiling.

Numbered overlays are clipped in physical ceiling coordinates, then projected onto the photo. Blue denotes full sheets; amber denotes cut sheets. The cut list gives rectangular cuts or custom-outline bounds. Each downloadable SVG shows the stock perimeter, retained pieces, and vertex coordinates in inches from the stock top-left. It is not a full-size print template. Scale qualifications are retained on exports.

`vendor/polygon-clipping.js` is the bundled UMD distribution of polygon-clipping 0.15.7 (MIT), used for intersections including concave and disconnected shapes. Its license and bundled dependency notices are included in `vendor/`. No runtime CDN is required.

Run `node layout.test.js` to verify coverage conservation, exact full-sheet fits, rotation and translation, cut minimization, concave shapes, disconnected pieces, and size limits.

## Measurement verification

Run `node geometry.test.js`. Tests use a synthetic camera with known geometry to verify interior and extrapolated coordinates, distances, area, and rejection of invalid references and polygons. These validate the mathematics, not physical accuracy on the supplied photos.

Browser checks cover all five samples, calibration, 1-inch grids, measuring, check-distance feedback, keyboard adjustment, zoom, sample-reset behavior, upload, annotated export, and mobile overflow. A real-world validation still needs measured reference dimensions plus independent ground truth from the actual scene.
