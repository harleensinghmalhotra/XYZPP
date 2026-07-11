PLAQUE FACE — CANVA TEMPLATE KIT  (Quantum Fusion Prints conveyor)
================================================================

WHAT THIS IS
  The "Print / Quality / …" signs floating above each conveyor arch are a live
  canvas texture. This kit lets you redesign that face in Canva and drop the PNGs
  straight into the site — no code change. Until you add files, the site keeps
  drawing the text itself, unchanged.

CANVAS / EXPORT SPEC
  Size        1280 × 964 px  (EXACT — export at this size, do not scale)
  Aspect      1.3278 : 1  (=862:649, the plate's own ratio)
  Format      PNG, 32-bit WITH TRANSPARENCY (the plaque is a floating sign — the
              area OUTSIDE the cream plate must stay transparent, exactly like
              plaque-template-blank.png).
  DPI/DPR     Native 1:1. The site already renders crisp at high-DPR; just match
              1280 × 964.

SAFE ZONE  (keep all text inside)
  Width       845 px centred  →  x 218 … 1062
  Index "0N"  centred on  y = 289 px
  Station name centred on y = 564 px, max height 384 px
  Centre      x = 640 px  (everything is centre-aligned)
  See plaque-guide.png for these lines drawn over the blank plate.

THE FILES IN THIS KIT
  plaque-current-<stage>.png       what the site draws NOW (English) — your before
  plaque-current-<stage>-fr.png    the French face
  plaque-template-blank.png        the cream plate + gold frame, NO text
  plaque-guide.png                 the blank with safe-zone / centre / baseline guides

  <stage> is one of:  print  quality  fulfillment  warehouse  ship  covered
  (display names: Print · Quality · Fulfillment · Warehouse · Shipping · You're Covered)

NAME YOUR VERSIONS EXACTLY LIKE THIS, then drop them in
  public/qfp/conveyor/plaques/ :

  plaque-print.png        plaque-print-fr.png
  plaque-quality.png      plaque-quality-fr.png
  plaque-fulfillment.png  plaque-fulfillment-fr.png
  plaque-warehouse.png    plaque-warehouse-fr.png
  plaque-ship.png         plaque-ship-fr.png        (this is the "Shipping" sign)
  plaque-covered.png      plaque-covered-fr.png

  The English (no -fr) file shows in English; the -fr file shows in French. You can
  add just some stages — any stage without a file keeps the current drawn text.
  Filename must match the stage key above exactly (lowercase, "ship" not "shipping").
