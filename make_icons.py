from PIL import Image, ImageDraw
def art(n, scale):
    im = Image.new('RGB', (n, n), '#0a0e17'); d = ImageDraw.Draw(im); u = n / 100 * scale; o = n * (1 - scale) / 2
    for x, h, top, up in [(22, 30, 35, 1), (40, 44, 25, 0), (58, 36, 38, 1), (76, 52, 20, 1)]:
        col = '#22c55e' if up else '#ef4444'
        d.line([(o + x * u, o + (top - 8) * u), (o + x * u, o + (top + h + 8) * u)], fill=col, width=max(1, int(2 * u)))
        d.rectangle([o + (x - 5) * u, o + top * u, o + (x + 5) * u, o + (top + h) * u], fill=col)
    return im
for n in (192, 512):
    art(n, 1).save(f'icon-{n}.png')
# maskable: art kept inside the central safe zone so round/squircle masks never cut it
art(512, 0.62).save('icon-maskable-512.png')
