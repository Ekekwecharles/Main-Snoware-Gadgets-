"""
Turns the "Price list" sheet into data/price-list.json for import.ts.
Only the selling price is kept: cost price and markup never leave the spreadsheet.

  python scripts/catalog-import/parse_price_list.py [data/snoware_price_list.xlsx]

Sheet layout: an UPPERCASE row starts a section (IPHONES), a plain row with no price
starts a condition group (Brand new, UK used, ...), every other row is an item.
"""
import json
import sys
from pathlib import Path

import openpyxl

src = Path(sys.argv[1] if len(sys.argv) > 1 else "data/snoware_price_list.xlsx")
out = Path("data/price-list.json")

ws = openpyxl.load_workbook(src, data_only=True)["Price list"]
section = group = None
rows = []
for i, (item, spec, cost, _added, sell) in enumerate(ws.iter_rows(min_row=2, max_col=5, values_only=True), start=2):
    if not item:
        continue
    item = str(item).strip()
    if sell in (None, "") and cost in (None, ""):
        if item.isupper():
            section, group = item, None
        else:
            group = item
        continue
    if not isinstance(sell, (int, float)):
        sys.exit(f"Row {i}: selling price is not a number: {sell!r}")
    rows.append({
        "row": i,
        "section": section,
        "group": group,
        "item": item,
        "spec": str(spec).strip() if spec else None,
        "price": int(sell),
    })

out.write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"{len(rows)} priced rows -> {out}")
