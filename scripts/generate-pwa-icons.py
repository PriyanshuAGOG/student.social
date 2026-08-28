from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "brand" / "student-social-icon.webp"


def render_icon(size: int, output: Path, *, maskable: bool = False) -> None:
    background = (39, 37, 33, 255) if maskable else (253, 250, 249, 255)
    padding_ratio = 0.22 if maskable else 0.14
    canvas = Image.new("RGBA", (size, size), background)
    logo = Image.open(SOURCE).convert("RGBA")
    available = round(size * (1 - padding_ratio * 2))
    logo.thumbnail((available, available), Image.Resampling.LANCZOS)
    left = (size - logo.width) // 2
    top = (size - logo.height) // 2
    canvas.alpha_composite(logo, (left, top))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, "PNG", optimize=True)


render_icon(192, ROOT / "public" / "icons" / "icon-192.png")
render_icon(512, ROOT / "public" / "icons" / "icon-512.png")
render_icon(512, ROOT / "public" / "icons" / "maskable-512.png", maskable=True)
render_icon(180, ROOT / "public" / "apple-touch-icon.png")
render_icon(96, ROOT / "public" / "icons" / "badge-96.png", maskable=True)
