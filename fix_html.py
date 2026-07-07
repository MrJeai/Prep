from pathlib import Path
root = Path(r'C:\Users\jeher\OneDrive\Desktop\Prep 2026\VSCode\Prep2026')
for path in root.glob('*.html'):
    text = path.read_text(encoding='utf-8')
    text = text.replace('`n', '\n')
    path.write_text(text, encoding='utf-8')
