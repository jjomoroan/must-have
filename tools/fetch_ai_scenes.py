import time, urllib.parse, subprocess, json
from pathlib import Path

OUT = Path('/tmp/ai-scenes'); OUT.mkdir(exist_ok=True)
scenes = [
    ('bamboo', 9401,
     "full-bleed original East Asian watercolor painting, flat scan, edge-to-edge, no desk, no frame, "
     "bamboo branches and long leaves at the left and right edges, large quiet empty cream paper in the center, "
     "translucent sage and olive washes, no flowers, wet pigment blooms, visible rice paper grain, soft sunlight, "
     "hand-painted, calm, no text, no signature, no watermark, no people, no border"),
    ('petals', 9402,
     "full-bleed original East Asian watercolor painting, flat scan, edge-to-edge, no desk, no frame, "
     "tall deep crimson and coral celosia flowers with sage leaves and grass, loose wet-on-wet washes, "
     "a few petals falling, warm cream rice paper, large quiet negative space on the left, elegant, "
     "hand-painted, no text, no signature, no watermark, no people, no border"),
    ('rain', 9403,
     "full-bleed original East Asian watercolor painting, flat scan, edge-to-edge, no desk, no frame, "
     "quiet pond in rain, concentric ripples spreading on dark teal water, thin ink reeds, pale mist, "
     "loose translucent watercolor washes, visible rice paper grain, meditative, "
     "no text, no signature, no watermark, no people, no border"),
    ('waves', 9404,
     "full-bleed original East Asian watercolor painting, flat scan, edge-to-edge, no desk, no frame, "
     "abstract layered indigo and teal ocean waves with cream foam and a pale ochre sun, "
     "loose wet-on-wet brushwork, visible rice paper grain, spacious calm composition, "
     "no text, no signature, no watermark, no people, no boat, no border"),
    ('castle', 9405,
     "full-bleed original East Asian watercolor painting, flat scan, edge-to-edge, no desk, no frame, "
     "half-finished Chinese pagoda, left side bare ink construction lines, right side softly painted with muted terracotta, "
     "sage and teal washes, unfinished watercolor blooms, warm cream rice paper, architectural sketch, "
     "no text, no signature, no watermark, no people, no border"),
    ('hills', 9406,
     "full-bleed original East Asian watercolor painting, flat scan, edge-to-edge, no desk, no frame, "
     "misty pale green tea terraces and soft hills, pale ochre sunlight, drifting fog, tiny distant pavilion, "
     "loose translucent washes, visible rice paper grain, serene, "
     "no text, no signature, no watermark, no people, no border"),
]

def fetch(scene, seed, prompt, label):
    url = ('https://image.pollinations.ai/prompt/' + urllib.parse.quote(prompt, safe='') +
           f'?width=1600&height=1000&seed={seed}&nologo=true&enhance=true')
    dest = OUT / f'{label}.jpg'
    for attempt in range(5):
        res = subprocess.run(['curl','-L','--max-time','180','-sS','-o',str(dest),'-w','%{http_code}',url],
                             capture_output=True, text=True)
        code = res.stdout.strip()[-3:]
        size = dest.stat().st_size if dest.exists() else 0
        print(label, 'attempt', attempt+1, 'http', code, 'bytes', size, flush=True)
        if code == '200' and size > 20000:
            return True
        time.sleep(55)
    return False

for idx, (label, seed, prompt) in enumerate(scenes):
    if idx > 0 or not (OUT / 'bamboo.jpg').exists():
        time.sleep(50)
    ok = fetch(scene=label, seed=seed, prompt=prompt, label=label)
    print(label, 'ok' if ok else 'FAILED', flush=True)
