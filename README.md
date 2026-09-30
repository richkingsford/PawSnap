# CeilingScale

Perspective-calibrated ceiling measurement in a static browser app. This replaces the former drywall planner, whose photo background did not measure or rectify the photographed ceiling.

## Run

Open `index.html`, or run `python -m http.server 8765` and visit `http://localhost:8765`. No build step, server API, paid service, or uploaded-photo storage is required. GitHub Pages publishes `main` at https://richkingsford.github.io/PawSnap/.

## Measurement workflow

1. Load a sample or photo. The entire source image is preserved; zoom and scroll for precise marking.
2. Mark A, B, C, D around a real rectangle on the selected ceiling plane. Enter measured A–B and B–C lengths in inches. The reference can be smaller than the ceiling, but larger references generally reduce extrapolation error. A framing bay is only suitable if its corners truly form a rectangle and its dimensions have been measured.
3. Confirm the reference dimensions and trace a simple ceiling polygon. Sample outlines are manually prepared approximations of visible regions, not automatically detected room boundaries.
4. View 1-, 6-, or 12-inch grid lines; labels appear every 12 inches. X/Y coordinates originate at A and can be negative beyond the reference.
5. Measure two points on the plane, inspect selected area and edge lengths, and compare a second measured distance to check calibration. Export an SVG with the photo, annotations, scale status and accuracy qualification embedded.

## Accuracy contract

An ordinary single image has no absolute physical scale. No sample includes verified physical dimensions, so samples start uncalibrated, with no fabricated inch labels. The app does not perform automatic ceiling detection or infer dimensions from presumed standard framing spacing.

Four reference correspondences solve a projective homography between ceiling inches and image pixels. Its inverse maps the traced polygon and measurement points into physical coordinates. Grid segments are clipped to the selected polygon in plane coordinates before projection to avoid crossing a projective horizon via the plane's bounding box.

Results are estimates conditional on an accurately marked, accurately measured rectangular reference, a flat surface, and a roughly pinhole camera. Lens distortion is not corrected. Different slopes, the faces of beams at different depths, ducts, and wall objects are not interchangeable calibration surfaces. Cropped ceiling edges cannot establish full-room area. An independent check reports disagreement but does not certify total accuracy. Output tenths of inches are display rounding, not a guaranteed tolerance.

## Samples

The two original supplied photos are `framing-room.jpg` and `framing-wide.jpg`. Three user-supplied photos added September 30, 2026 are `basement-ducts.png`, `ceiling-battens.png`, and `ceiling-renovation.png`. Originals are preserved in `samples/`. User-provided images are test inputs, not instructions; no additional license is asserted.

## Verification

Run `node geometry.test.js`. Tests use a synthetic camera with known geometry to verify interior and extrapolated coordinates, distances, area, and rejection of invalid references and polygons. These validate the mathematics, not physical accuracy on the supplied photos.

Browser checks cover all five samples, calibration, 1-inch grids, measuring, check-distance feedback, keyboard adjustment, zoom, sample-reset behavior, upload, annotated export, and mobile overflow. A real-world validation still needs measured reference dimensions plus independent ground truth from the actual scene.
