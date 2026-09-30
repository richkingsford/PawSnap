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

## Verification

Run `node geometry.test.js`. Tests use a synthetic camera with known geometry to verify interior and extrapolated coordinates, distances, area, and rejection of invalid references and polygons. These validate the mathematics, not physical accuracy on the supplied photos.

Browser checks cover all five samples, calibration, 1-inch grids, measuring, check-distance feedback, keyboard adjustment, zoom, sample-reset behavior, upload, annotated export, and mobile overflow. A real-world validation still needs measured reference dimensions plus independent ground truth from the actual scene.
