# Remove white backgrounds from the 8 element PNGs -> transparent cutouts.
# alpha matting cleans anti-aliased edges (reduces white halo); then trim to
# content bbox and fit onto a square transparent canvas.
import os
from rembg import remove, new_session
from PIL import Image

SRC = 'assets/elements'
elements = ['pencil', 'atlas', 'star', 'blocks', 'inkdrop', 'ruler', 'plane', 'owl']
session = new_session('u2net')
SIZE = 640

for name in elements:
    inp = Image.open(f'{SRC}/{name}.png').convert('RGBA')
    out = remove(
        inp, session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=245,
        alpha_matting_background_threshold=20,
        alpha_matting_erode_size=4,
    )
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    # fit onto square transparent canvas, centered, with small padding
    w, h = out.size
    scale = (SIZE - 24) / max(w, h)
    out = out.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(out, ((SIZE - out.width) // 2, (SIZE - out.height) // 2), out)
    canvas.save(f'{SRC}/{name}-cut.png')
    print('cut', name, 'bbox', bbox)
print('done')
