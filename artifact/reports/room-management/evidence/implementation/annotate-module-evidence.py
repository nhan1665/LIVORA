"""Annotate real Edge captures with numbered review callouts; never synthesizes UI pixels."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
CASES = {
    'inspiration-list-1317x982.png': [
        (0.52, 0.13, 'Heading and create action'),
        (0.51, 0.21, 'Room and status filters'),
        (0.55, 0.37, 'Concept, room and product columns'),
        (0.91, 0.78, 'Pagination'),
    ],
    'inspiration-create-populated-1317x982.png': [
        (0.50, 0.24, 'Code, title and Room'),
        (0.30, 0.54, 'Actual image preview'),
        (0.33, 0.53, 'Product pin on image'),
        (0.75, 0.52, 'Product and coordinates'),
        (0.80, 0.89, 'Save action'),
    ],
    'space-list-1317x982.png': [
        (0.46, 0.13, 'Space and Design tabs'),
        (0.53, 0.28, 'Search and filters'),
        (0.54, 0.53, 'Room, dimensions and model state'),
        (0.92, 0.93, 'Pagination'),
    ],
    'design-list-1317x982.png': [
        (0.49, 0.14, 'Design List tab'),
        (0.53, 0.21, 'Space and Customer filters'),
        (0.59, 0.48, 'Saved customer design metadata'),
        (0.90, 0.55, 'Read-only detail action'),
        (0.91, 0.95, 'Pagination'),
    ],
    'space-create-populated-1317x1200.png': [
        (0.52, 0.27, 'Space code and Room'),
        (0.53, 0.44, 'Metric dimensions and derived area'),
        (0.53, 0.67, 'Validated GLB file metadata'),
        (0.46, 0.77, 'Active Space eligibility'),
        (0.71, 0.85, 'Save action'),
    ],
}

try:
    FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22)
    SMALL = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 19)
except OSError:
    FONT = ImageFont.load_default()
    SMALL = FONT

for name, points in CASES.items():
    source = Image.open(ROOT / name).convert('RGB')
    width, height = source.size
    footer = 56 + len(points) * 30
    output = Image.new('RGB', (width, height + footer), '#fffaf4')
    output.paste(source, (0, 0))
    draw = ImageDraw.Draw(output)
    for index, (x_ratio, y_ratio, label) in enumerate(points, 1):
        x, y = round(x_ratio * width), round(y_ratio * height)
        draw.ellipse((x - 16, y - 16, x + 16, y + 16), fill='#704b4a', outline='white', width=3)
        box = draw.textbbox((0, 0), str(index), font=FONT)
        draw.text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2 - 2), str(index), fill='white', font=FONT)
        draw.text((20, height + 38 + (index - 1) * 30), f'{index}. {label}', fill='#493635', font=SMALL)
    draw.text((20, height + 10), 'Numbered review points on genuine Edge browser capture', fill='#704b4a', font=SMALL)
    destination = ROOT / name.replace('.png', '-annotated.png')
    output.save(destination)
    print(destination.name, output.size)
