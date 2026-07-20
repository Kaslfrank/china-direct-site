import re, json, urllib.request, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
projects = json.load(open(os.path.join(ROOT, 'scripts', 'ra-projects.json'), encoding='utf-8'))
manifest_path = os.path.join(ROOT, 'assets', 'projects', 'download-manifest.csv')

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', errors='replace')

def images(html):
    urls = []
    seen = set()
    for u in re.findall(r'data-original="(https://static\.tildacdn\.com/[^"]+)"', html):
        if u.endswith('noroot.png'):
            continue
        if u not in seen:
            seen.add(u)
            urls.append(u)
    return urls

home = fetch('https://ra-designe.ru/')
start = home.find('rec313030359')
end = home.find('rec313032026', start)
realized = home[start:end] if start >= 0 else ''
realized_imgs = set(images(realized))

res_start = home.find('rec313016845')
res_end = home.find('rec365857027', res_start)
residential = home[res_start:res_end] if res_start >= 0 else ''

print(f'REALIZED_SECTION_IMAGES={len(realized_imgs)}')
print(f'RESIDENTIAL_SECTION_PRESENT={res_start >= 0}')

# load our imported source URLs by project
import csv
imported = {}
if os.path.exists(manifest_path):
    with open(manifest_path, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            imported.setdefault(row['Project'], []).append(row['Source'])

rows = []
for p in projects:
    slug = p['url'].rstrip('/').split('/')[-1]
    html = fetch(p['url'])
    time.sleep(0.3)
    page_imgs = images(html)
    overlap = [u for u in page_imgs if u in realized_imgs]
    imported_urls = imported.get(f"project-{p['num']}", [])
    imported_overlap = [u for u in imported_urls if u in realized_imgs]

    title = re.search(r'<title>([^<]+)</title>', html)
    desc = re.search(r'meta name="description" content="([^"]*)"', html)
    in_res_cards = f'/{slug}' in residential

    # explicit text signals from RA Design page copy
    plain = re.sub(r'<[^>]+>', ' ', html)
    has_viz = bool(re.search(r'визуализац|3D|рендер|фотореалист', plain, re.I))
    has_realized_label = bool(re.search(r'реализован|фото реализован', plain, re.I))
    desc_text = desc.group(1) if desc else ''

    if len(overlap) > 0 or len(imported_overlap) > 0:
        cls = 'REAL PHOTOGRAPHY'
        confirmed = max(len(overlap), len(imported_overlap))
        reason = 'Shares image URLs with homepage section FOTO REALIZOVANNYKH OB EKTOV (rec313030359)'
    elif in_res_cards and desc_text.startswith('Оформление интерьера'):
        cls = '3D VISUALIZATION'
        confirmed = 0
        reason = 'Listed under PROEKTY zhilykh intererov; page describes interior design (Оформление интерьера), not realized photography; zero overlap with FOTO REALIZOVANNYKH section'
    elif has_viz and not has_realized_label:
        cls = '3D VISUALIZATION'
        confirmed = 0
        reason = 'Page text references visualization; no realized-photo labeling'
    else:
        cls = 'UNCERTAIN'
        confirmed = 0
        reason = 'No overlap with FOTO REALIZOVANNYKH section and no explicit realized-photo label on project page'

    rows.append({
        'title': p['title'],
        'url': p['url'],
        'classification': cls,
        'confirmed_real_photos': confirmed,
        'page_images': len(page_imgs),
        'realized_overlap': len(overlap),
        'imported_overlap': len(imported_overlap),
        'in_residential_cards': in_res_cards,
        'description': desc_text,
        'reason': reason,
    })

print('\nAUDIT_JSON_START')
print(json.dumps(rows, ensure_ascii=False, indent=2))
print('AUDIT_JSON_END')
