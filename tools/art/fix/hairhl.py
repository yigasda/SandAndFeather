# python3 hairhl.py <in> <out> <reference png>
# Puts the bright blue hair highlight streaks (Horus) on the reference's highlight colour: the streak pixels of both
# pictures (blue well above red and green, saturated) give a median colour each, and every pixel is shifted by that
# difference weighted by how blue it is (full on the streaks, fading out at their edges, nothing elsewhere).
# Run after tonematch.py (which moves the hair's dark / middle / light tones but leaves the streaks brighter).
import sys, numpy as np
from PIL import Image
src, out, ref = sys.argv[1:4]
def streaks(a):
    r, g, b, A = [a[..., i].astype(float) for i in range(4)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); sat = (mx - mn) / np.maximum(mx, 1)
    return (A >= 200) & (b > r + 60) & (b > g + 60) & (sat > 0.55) & (b > 110)
R = np.asarray(Image.open(ref).convert('RGBA')); a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
d = np.median(R[streaks(R)][:, :3], 0) - np.median(a[streaks(a)][:, :3], 0)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
w = np.clip((b - np.maximum(r, g) - 50) / 40, 0, 1) * (a[..., 3] > 0)
a[..., :3] = np.clip(a[..., :3] + w[..., None] * d, 0, 255)
Image.fromarray(a.round().astype(np.uint8)).save(out)
print('streak colour shift', d)
