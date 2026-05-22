import os
import re

pages_dir = r"d:\web_develop_project\QAISFOODS\src\pages"
files = [f for f in os.listdir(pages_dir) if f.endswith(".tsx")]

for file in files:
    path = os.path.join(pages_dir, file)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # search for <h1> or similar that has text-2xl font-bold and a <p> tag right after
    # Let's print out the matches
    matches = re.finditer(r'(<h1.*?/h1>\s*(?:{.*?}\s*)*<p className=".*text-muted-foreground.*">.*?</p>)', content, re.DOTALL | re.IGNORECASE)
    for m in matches:
        print(f"File: {file}")
        print(m.group(0))
        print("-" * 40)
