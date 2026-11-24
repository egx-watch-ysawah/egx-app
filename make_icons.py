from PIL import Image, ImageDraw
for n in (192, 512):
    im = Image.new('RGB', (n, n), '#0a0e17'); d = ImageDraw.Draw(im); u = n / 100
    for x, h, top, up in [(22, 30, 35, 1), (40, 44, 25, 0), (58, 36, 38, 1), (76, 52, 20, 1)]:
        col = '#22c55e' if up else '#ef4444'
        d.line([(x * u, (top - 8) * u), (x * u, (top + h + 8) * u)], fill=col, width=int(2 * u))
        d.rectangle([(x - 5) * u, top * u, (x + 5) * u, (top + h) * u], fill=col)
    im.save(f'icon-{n}.png')
