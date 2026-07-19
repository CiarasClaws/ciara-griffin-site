"""Extract Ciara's designed glyphs: strip guide lines + labels, register by
baseline/cap from the guides themselves, compose 'Ciara' and 'Griffin'."""
import sys, json
from PIL import Image
import numpy as np

SRC = sys.argv[1]; OUT = sys.argv[2]
CREAM = (243, 239, 231)
THRESH = 60

def load(name):
    im = Image.open(f"{SRC}/{name}.png").convert("L")
    a = np.array(im, dtype=np.uint8)
    return a

def guide_bands(a):
    """Rows where brightness spans ~the full width = guide lines."""
    W = a.shape[1]
    cover = (a > THRESH).sum(axis=1) / W
    rows = np.where(cover > 0.85)[0]
    bands = []
    for y in rows:
        if bands and y <= bands[-1][1] + 2: bands[-1][1] = y
        else: bands.append([y, y])
    return bands

def clean(a):
    bands = guide_bands(a)
    H, W = a.shape
    x0, x1 = int(W * 0.16), int(W * 0.87)
    out = a.copy()
    out[:, :x0] = 0
    out[:, x1:] = 0
    for y0, y1 in bands:
        for x in range(x0, x1):
            above = out[max(0, y0-4):y0, x].max(initial=0) > THRESH
            below = out[y1+1:min(H, y1+5), x].max(initial=0) > THRESH
            if not (above and below):
                out[y0:y1+1, x] = 0
    return out, bands

def hthin(a, k=2):
    # horizontal erosion: min over x-window (2k+1) — thins vertical stems,
    # leaves horizontal hairline THICKNESS untouched
    out = a.copy()
    for sh in range(1, k + 1):
        out[:, sh:] = np.minimum(out[:, sh:], a[:, :-sh])
        out[:, :-sh] = np.minimum(out[:, :-sh], a[:, sh:])
    return out

def glyph(name):
    a = load(name)
    out, bands = clean(a)
    out = hthin(out, 2)
    if len(bands) < 4:
        raise SystemExit(f"{name}: only {len(bands)} guide bands found")
    cap = (bands[1][0] + bands[1][1]) / 2      # 2nd line = cap height
    base = (bands[3][0] + bands[3][1]) / 2     # 4th line = baseline
    ys, xs = np.where(out > 24)
    bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    crop = out[bb[1]:bb[3], bb[0]:bb[2]]
    return crop, cap - bb[1], base - bb[1]   # alpha, capY, baseY in crop coords

CAP = 300.0  # composed cap-height in px
def scaled(name):
    crop, capY, baseY = glyph(name)
    unit = baseY - capY
    s = CAP / unit
    h = int(round(crop.shape[0] * s)); w = int(round(crop.shape[1] * s))
    im = Image.fromarray(crop).resize((w, h), Image.LANCZOS)
    return np.array(im), capY * s, baseY * s

def compose(letters, gap_frac=0.03):
    gap = int(CAP * gap_frac)
    parts = [scaled(n) for n in letters]
    W = sum(p[0].shape[1] for p in parts) + gap * (len(parts) - 1)
    top = max(p[2] for p in parts)            # max baseY above crop-top
    bot = max(p[0].shape[0] - p[2] for p in parts)
    H = int(np.ceil(top + bot)) + 2
    canvas = np.zeros((H, int(W)), dtype=np.uint8)
    x = 0
    baseline = top
    for arr, capY, baseY in parts:
        y = int(round(baseline - baseY))
        h, w = arr.shape
        region = canvas[y:y+h, x:x+w]
        np.maximum(region, arr, out=region)
        x += w + gap
    rgba = np.zeros((H, int(W), 4), dtype=np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = CREAM
    rgba[..., 3] = canvas
    return Image.fromarray(rgba, "RGBA"), baseline

img1, b1 = compose(["C", "i1", "a1", "r1", "a2"])
img2, b2 = compose(["G", "r2", "i2", "f", "f", "i1", "n"])
img1.save(f"{OUT}/name-ciara.png")
img2.save(f"{OUT}/name-griffin.png")
meta = {"cap": CAP,
        "ciara": {"w": img1.width, "h": img1.height, "baseline": round(b1, 1)},
        "griffin": {"w": img2.width, "h": img2.height, "baseline": round(b2, 1)}}
print(json.dumps(meta))
