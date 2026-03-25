"""
Generate Focus Prayer icons at 16, 48, and 128px.
A stylised flame: gold on dark, minimal, readable at all sizes.
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import os

BG     = (13, 13, 13, 255)
GOLD   = (200, 169, 110, 255)
GOLD_D = (150, 120, 72, 255)   # darker base of flame
TRANS  = (0, 0, 0, 0)

def lerp(a, b, t):
    return a + (b - a) * t

def flame_points(cx, cy, w, h):
    """
    Returns a list of (x, y) polygon points forming a teardrop/flame shape.
    cx, cy = center-bottom of the flame
    w = total width, h = total height
    """
    pts = []
    steps = 120
    for i in range(steps):
        angle = (i / steps) * math.tau
        # Flame silhouette: narrow at top, wide in the middle, pointed bottom
        # Use a polar equation: r = base * (1 - cos) shape modified
        t = i / steps  # 0..1

        # Parametric flame: x wiggles, y rises
        # We'll trace the outline: left side going up, right side coming down
        if i < steps // 2:
            # left side, bottom to top
            frac = (i / (steps // 2))  # 0 at bottom, 1 at top
            x_off = -math.sin(frac * math.pi) * w * 0.5
            # Lean the tip slightly
            x_off += math.sin(frac * math.pi * 2) * w * 0.06
            y_off = -frac * h
        else:
            # right side, top to bottom
            frac = ((i - steps // 2) / (steps // 2))  # 0 at top, 1 at bottom
            x_off = math.sin((1 - frac) * math.pi) * w * 0.5
            x_off += math.sin((1 - frac) * math.pi * 2) * w * 0.06
            y_off = -(1 - frac) * h

        pts.append((cx + x_off, cy + y_off))
    return pts


def make_icon(size):
    scale = 4  # render at 4x, then downscale for anti-aliasing
    s = size * scale

    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded square background
    radius = int(s * 0.22)
    pad = int(s * 0.02)
    draw.rounded_rectangle([pad, pad, s - pad, s - pad], radius=radius, fill=BG)

    # Flame
    flame_h = s * 0.65
    flame_w = s * 0.48
    cx = s * 0.5
    cy = s * 0.80

    pts = flame_points(cx, cy, flame_w, flame_h)

    # Draw outer flame (gold)
    draw.polygon(pts, fill=GOLD)

    # Inner flame (lighter, smaller) — gives depth
    inner_h = flame_h * 0.52
    inner_w = flame_w * 0.48
    inner_cx = cx
    inner_cy = cy - flame_h * 0.04
    inner_pts = flame_points(inner_cx, inner_cy, inner_w, inner_h)
    inner_color = (220, 200, 155, 255)
    draw.polygon(inner_pts, fill=inner_color)

    # Tiny bright core
    core_r = s * 0.04
    core_cx = cx
    core_cy = cy - flame_h * 0.18
    draw.ellipse(
        [core_cx - core_r, core_cy - core_r, core_cx + core_r, core_cy + core_r],
        fill=(240, 230, 200, 255)
    )

    # Downscale with LANCZOS for crisp anti-aliasing
    img = img.resize((size, size), Image.LANCZOS)
    return img


os.makedirs('icons', exist_ok=True)

for size in [16, 48, 128]:
    icon = make_icon(size)
    path = f'icons/icon{size}.png'
    icon.save(path)
    print(f'Saved {path}')

print('Done.')
