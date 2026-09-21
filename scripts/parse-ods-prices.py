import zipfile, csv
from xml.etree import ElementTree as ET
from pathlib import Path

p = Path(r"c:\Users\Admin\Downloads\Список.ods")
out = Path(r"C:\Users\Admin\websitedompola\laminate-prices-source.csv")

TABLE = "{urn:oasis:names:tc:opendocument:xmlns:table:1.0}"
TEXT = "{urn:oasis:names:tc:opendocument:xmlns:text:1.0}"
OFFICE = "{urn:oasis:names:tc:opendocument:xmlns:office:1.0}"


def cell_text(cell):
    parts = []
    for t in cell.iter(f"{TEXT}p"):
        parts.append("".join(t.itertext()))
    return " ".join(parts).strip()


with zipfile.ZipFile(p) as z:
    root = ET.fromstring(z.read("content.xml"))

rows = []
for table in root.findall(f".//{TABLE}table"):
    name = table.get(f"{TABLE}name")
    print("TABLE", name)
    for tr in table.findall(f"{TABLE}table-row"):
        cells = []
        for cell in tr.findall(f"{TABLE}table-cell"):
            rpt = int(cell.get(f"{TABLE}number-columns-repeated") or 1)
            val = cell.get(f"{OFFICE}value")
            txt = cell_text(cell)
            if val is not None and not txt:
                txt = val
            for _ in range(min(rpt, 30)):
                cells.append(txt)
        while cells and cells[-1] == "":
            cells.pop()
        if any(cells):
            rows.append(cells)

print("ROWS", len(rows))
for i, r in enumerate(rows[:30]):
    print(i, "|", " || ".join(r[:14]))
print("--- last ---")
for i, r in enumerate(rows[-5:], start=max(0, len(rows) - 5)):
    print(i, "|", " || ".join(r[:14]))

with out.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f, delimiter=";")
    for r in rows:
        w.writerow(r)
print("wrote", out, "maxcols", max(len(r) for r in rows) if rows else 0)
