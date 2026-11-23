from pathlib import Path
import shutil
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
AI = Path('/tmp/ai-scenes')
OUT = ROOT / 'assets/backgrounds'
THUMBS = OUT / 'thumbs'
THUMBS.mkdir(exist_ok=True)

def clone_patch(im, box, source):
    """Paste a paper patch with a soft oval mask to remove a small signature/logo."""
    x0, y0, x1, y1 = box
    sx, sy = source
    w, h = x1 - x0, y1 - y0
    patch = im.crop((sx, sy, sx + w, sy + h)).convert('RGB')
    # match the paper tone around the target so the patch disappears
    ring = im.crop((max(0, x0 - 24), max(0, y0 - 24), min(im.width, x1 + 24), min(im.height, y1 + 24))).convert('RGB')
    ra = np.asarray(ring, dtype=np.float32)
    pa = np.asarray(patch, dtype=np.float32)
    offset = ra.reshape(-1, 3).mean(axis=0) - pa.reshape(-1, 3).mean(axis=0)
    patch = Image.fromarray(np.clip(pa + offset, 0, 255).astype(np.uint8), 'RGB')
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((10, 8, w - 11, h - 9), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(22))
    im.paste(patch, (x0, y0), mask)

def painterly(im, blur=0.7, median=0, paper_mix=0.035, edge=0.06):
    if median:
        im = im.filter(ImageFilter.MedianFilter(median))
    im = im.filter(ImageFilter.GaussianBlur(blur))
    arr = np.asarray(im, dtype=np.float32) / 255.0
    paper = np.array([0.969, 0.945, 0.894], dtype=np.float32)
    arr = arr * (1 - paper_mix) + paper.reshape(1, 1, 3) * paper_mix
    gray = np.asarray(im.convert('L').filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.0)), dtype=np.float32) / 255.0
    edge = np.clip(gray * 1.7, 0, 1)[:, :, None] * edge
    arr = arr * (1 - edge) + np.array([0.28, 0.27, 0.22], dtype=np.float32).reshape(1, 1, 3) * edge
    im = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8), 'RGB')
    return im

def finish(im, label, clone=None):
    if clone:
        clone_patch(im, clone['box'], clone['source'])
    # a touch of paper grain and a very soft warm grade
    arr = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    h, w = arr.shape[:2]
    rng = np.random.default_rng(abs(hash(label)) % (2**32))
    fine = rng.normal(0, 0.011, (h, w)).astype(np.float32)
    arr = np.clip(arr + fine[:, :, None], 0, 1)
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 1.005, 0, 1)
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 0.995, 0, 1)
    im = Image.fromarray((arr * 255).astype(np.uint8), 'RGB')
    final = ImageOps.fit(im, (1600, 1000), method=Image.LANCZOS, centering=(0.5, 0.48))
    final.save(OUT / f'{label}-base.webp', 'WEBP', quality=92, method=6)
    final.resize((800, 500), Image.LANCZOS).save(THUMBS / f'{label}.jpg', quality=87, optimize=True, progressive=True)
    final.resize((900, 563), Image.LANCZOS).save(f'/tmp/{label}-preview.jpg', quality=91)
    print(label, final.size, (OUT / f'{label}-base.webp').stat().st_size)

# bamboo: the successful loose painting with blossom sprays
bamboo_src = Path('/tmp/ai-bamboo-flux2.jpg')
if bamboo_src.exists():
    shutil.copyfile(bamboo_src, AI / 'bamboo-good.jpg')
    im = Image.open(bamboo_src).convert('RGB')
    # remove the thin mock-paper edge and the service logo at the lower right
    im = im.crop((8, 8, im.width - 8, im.height - 44))
    finish(im, 'bamboo')

# waves: lift the painted canvas out of the mock-up, removing its wall and logo
waves = Image.open(AI / 'waves.jpg').convert('RGB')
waves = waves.crop((67, 69, min(918, waves.width - 10), min(531, waves.height - 12)))
waves = painterly(waves, blur=0.8, median=3, paper_mix=0.05, edge=0.07)
finish(waves, 'waves')

# rain: trim the dark band, paper edge and service logo
rain = Image.open(AI / 'rain.jpg').convert('RGB')
rain = rain.crop((22, 30, rain.width - 20, rain.height - 42))
finish(rain, 'rain')

# petals: crop the frame and the lower-right logo, clone out the pencil signature
petals = Image.open(AI / 'petals.jpg').convert('RGB')
petals = petals.crop((14, 14, petals.width - 14, petals.height - 40))
# signature sits low-right; replace with clean paper from the upper left
finish(petals, 'petals')

# hills: trim the paper border and soften the photograph into a watercolour landscape
hills = Image.open(AI / 'hills.jpg').convert('RGB')
hills = hills.crop((27, 24, min(944, hills.width - 14), min(570, hills.height - 20)))
hills = painterly(hills, blur=1.0, median=5, paper_mix=0.075, edge=0.06)
finish(hills, 'hills')

# castle: light ghost underpainting on the left, colour on the right.
# Clean architectural lines are drawn on top by the motion layer.
castle = Image.open(AI / 'castle-alt.jpg').convert('RGB')
castle = castle.crop((60, 70, min(910, castle.width - 12), min(536, castle.height - 18)))
# remove the small painted signature on the ground
clone_patch(castle, (752, 425, 855, 462), (55, 400))
castle = ImageOps.fit(castle, (1600, 1000), method=Image.LANCZOS, centering=(0.5, 0.5))
paper = Image.new('RGB', castle.size, (247, 241, 229))
# aligned pencil contour layer, extracted from this very building
lg = castle.convert('L').filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
le = lg.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(1.0))
le = ImageOps.autocontrast(le, cutoff=6).point(lambda p: 255 if p > 118 else 0)
le = le.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.45))
li = ImageOps.invert(le)
la = np.asarray(li, dtype=np.float32)
alpha = np.where(la > 242, 0, 255 - la).astype(np.uint8)
lines = np.zeros((castle.height, castle.width, 4), dtype=np.uint8)
lines[:, :, 0] = 92
lines[:, :, 1] = 87
lines[:, :, 2] = 73
lines[:, :, 3] = alpha
Image.fromarray(lines, 'RGBA').save(ROOT / 'assets/backgrounds/motion/castle-lines.png', optimize=True)
colored = ImageEnhance.Color(castle).enhance(1.10)
colored = ImageEnhance.Contrast(colored).enhance(1.03)
gray = castle.convert('L').filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(2.6))
ghost = ImageOps.colorize(ImageOps.autocontrast(gray), black=(183, 176, 158), white=(249, 243, 231))
ghost = Image.blend(ghost, paper, 0.48)
mask = Image.new('L', castle.size, 0)
md = ImageDraw.Draw(mask)
w, h = castle.size
md.rectangle((0, 0, int(w * 0.40), h), fill=255)
md.rectangle((int(w * 0.40), 0, int(w * 0.55), h), fill=145)
mask = mask.filter(ImageFilter.GaussianBlur(48))
half = Image.composite(ghost, colored, mask)
arr = np.asarray(half, dtype=np.float32) / 255.0
h2, w2 = arr.shape[:2]
rng = np.random.default_rng(991)
arr = np.clip(arr + rng.normal(0, 0.009, (h2, w2))[:, :, None], 0, 1)
half = Image.fromarray((arr * 255).astype(np.uint8), 'RGB')
half.save(OUT / 'castle-base.webp', 'WEBP', quality=92, method=6)
half.resize((800, 500), Image.LANCZOS).save(THUMBS / 'castle.jpg', quality=87, optimize=True, progressive=True)
half.resize((900, 563), Image.LANCZOS).save('/tmp/castle-preview.jpg', quality=91)
print('castle', half.size, (OUT / 'castle-base.webp').stat().st_size)
