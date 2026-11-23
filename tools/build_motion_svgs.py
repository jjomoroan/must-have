"""Build transparent, looping motion layers that sit over the watercolor scans."""
from pathlib import Path
import math
import random

OUT = Path(__file__).resolve().parents[1] / 'assets/backgrounds/motion'
OUT.mkdir(parents=True, exist_ok=True)

HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7"/></filter>
  <filter id="soft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="wash" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="mist" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="12"/></filter>
  <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#879c68" stop-opacity=".85"/><stop offset="1" stop-color="#c2cda2" stop-opacity=".7"/></linearGradient>
  <linearGradient id="petalGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f3137"/><stop offset=".55" stop-color="#c75f59"/><stop offset="1" stop-color="#e2a18f"/></linearGradient>
  <linearGradient id="foamGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7f4e8" stop-opacity="0"/><stop offset=".25" stop-color="#f7f4e8" stop-opacity=".85"/><stop offset=".7" stop-color="#eef2e7" stop-opacity=".65"/><stop offset="1" stop-color="#eef2e7" stop-opacity="0"/></linearGradient>
  <linearGradient id="mistGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#faf6eb" stop-opacity="0"/><stop offset=".35" stop-color="#faf6eb" stop-opacity=".62"/><stop offset=".7" stop-color="#faf6eb" stop-opacity=".5"/><stop offset="1" stop-color="#faf6eb" stop-opacity="0"/></linearGradient>
  <radialGradient id="greenWash" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#91a872" stop-opacity=".20"/><stop offset="1" stop-color="#91a872" stop-opacity="0"/></radialGradient>
  <radialGradient id="redWash" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#b5474b" stop-opacity=".18"/><stop offset="1" stop-color="#b5474b" stop-opacity="0"/></radialGradient>
</defs>
<style>
  .fall { animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; transform-box: fill-box; transform-origin: center; }
  .mote { animation: mote 14s ease-in-out infinite; }
  .rainline { animation-name: rainfall; animation-timing-function: linear; animation-iteration-count: infinite; }
  .ripple { transform-box: view-box; animation: ripple 8s ease-out infinite; }
  .foamline { animation: foam 14s ease-in-out infinite; }
  .glint { animation: glint 8s ease-in-out infinite; }
  .mistband { animation: mistdrift 30s ease-in-out infinite; }
  .bird { animation: birddrift 20s ease-in-out infinite; }
  .washfloat { animation: washfloat 24s ease-in-out infinite; }
  .hatch { animation: hatchfade 16s ease-in-out infinite; }
  @keyframes fall {
    0% { transform: translate(0, -90px) rotate(0deg); opacity: 0; }
    8% { opacity: .85; }
    78% { opacity: .6; }
    100% { transform: translate(var(--dx), 820px) rotate(var(--rot)); opacity: 0; }
  }
  @keyframes mote {
    0%, 100% { transform: translate(0, 0); opacity: .1; }
    50% { transform: translate(14px, -22px); opacity: .55; }
  }
  @keyframes rainfall {
    0% { transform: translate(0, -40px); opacity: 0; }
    10% { opacity: .7; }
    80% { opacity: .35; }
    100% { transform: translate(-14px, 260px); opacity: 0; }
  }
  @keyframes ripple {
    0% { transform: scale(.32); opacity: 0; }
    12% { opacity: .75; }
    72% { opacity: .22; }
    100% { transform: scale(1.15); opacity: 0; }
  }
  @keyframes foam {
    0%, 100% { transform: translateX(-18px); opacity: .3; }
    50% { transform: translateX(18px); opacity: .72; }
  }
  @keyframes glint {
    0%, 100% { opacity: .08; transform: scale(.8); }
    45% { opacity: .7; transform: scale(1.12); }
  }
  @keyframes mistdrift {
    0% { transform: translateX(-80px); opacity: .3; }
    50% { opacity: .65; }
    100% { transform: translateX(90px); opacity: .3; }
  }
  @keyframes birddrift {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, -8px); }
  }
  @keyframes washfloat {
    0%, 100% { transform: translate(0, 0) scale(.96); opacity: .035; }
    50% { transform: translate(16px, -10px) scale(1.06); opacity: .085; }
  }
  @keyframes hatchfade {
    0%, 100% { opacity: .03; }
    45% { opacity: .22; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fall, .mote, .rainline, .ripple, .foamline, .glint, .mistband, .bird, .washfloat, .hatch { animation: none !important; }
  }
</style>
'''

def wrap(content):
    return HEAD + content + '\n</svg>\n'

def write(name, content):
    (OUT / name).write_text(wrap(content), encoding='utf-8')

# ---------------- bamboo ----------------
def bamboo():
    r = random.Random(21)
    parts = [
        '<ellipse class="washfloat" cx="1390" cy="400" rx="330" ry="300" fill="url(#greenWash)" filter="url(#wash)"/>',
        '<ellipse class="washfloat" cx="260" cy="760" rx="280" ry="200" fill="url(#greenWash)" filter="url(#wash)" style="animation-delay:-8s"/>',
    ]
    for i in range(10):
        x = r.randint(70, 1530)
        y = r.randint(30, 430)
        s = r.uniform(.38, .92)
        rot = r.randint(-35, 35)
        dx = r.randint(-90, 90)
        dur = r.uniform(19, 34)
        delay = -r.uniform(0, 30)
        rot_end = r.choice([320, 420, 540])
        parts.append(
            f'<g transform="translate({x} {y}) rotate({rot}) scale({s:.2f})">'
            f'<path class="fall" style="--dx:{dx}px;--rot:{rot_end}deg;animation-duration:{dur:.1f}s;animation-delay:{delay:.1f}s" '
            f'd="M0 0 C 8 -13 26 -13 39 -1 C 27 12 9 13 0 0Z" fill="url(#leafGrad)" opacity=".50" filter="url(#soft2)"/>'
            '</g>'
        )
    for i in range(4):
        x = r.randint(450, 1450); y = r.randint(30, 380)
        parts.append(
            f'<g transform="translate({x} {y}) rotate({r.randint(-40,40)}) scale({r.uniform(.5,.9):.2f})">'
            f'<path class="fall" style="--dx:{r.randint(-100,80)}px;--rot:420deg;animation-duration:{r.uniform(22,34):.1f}s;animation-delay:-{r.uniform(0,30):.1f}s" '
            f'd="M0 0 C 9 -12 26 -12 34 2 C 25 15 8 13 0 0Z" fill="url(#petalGrad)" opacity=".45" filter="url(#soft2)"/>'
            '</g>'
        )
    for i in range(12):
        x = r.randint(40, 1560); y = r.randint(80, 820)
        parts.append(f'<circle class="mote" cx="{x}" cy="{y}" r="{r.uniform(1,2.6):.1f}" fill="#e8dfbd" style="animation-delay:-{r.uniform(0,14):.1f}s"/>')
    write('bamboo.svg', '\n'.join(parts))

# ---------------- rain ----------------
def rain():
    r = random.Random(22)
    parts = ['<ellipse cx="880" cy="520" rx="400" ry="270" fill="#4f8b91" opacity=".05" filter="url(#wash)"/>']
    for i in range(44):
        x = r.randint(40, 1560); y = r.randint(-80, 620)
        ln = r.randint(60, 150)
        dur = r.uniform(1.4, 3.2)
        delay = -r.uniform(0, 3.2)
        op = r.uniform(.20, .48)
        parts.append(f'<line class="rainline" x1="{x}" y1="{y}" x2="{x-10}" y2="{y+ln}" stroke="#f0f6ef" stroke-width="{r.uniform(1.1,2.2):.1f}" opacity="{op:.2f}" style="animation-duration:{dur:.1f}s;animation-delay:{delay:.1f}s" filter="url(#soft)"/>')
    for (cx, cy, scale, delay, dur) in [(1000, 520, 1.0, 0, 8), (370, 760, .8, -2.6, 9.2), (1240, 730, .6, -5.2, 10.5), (720, 820, .45, -6.4, 11)]:
        parts.append(f'<g class="ripple" style="transform-origin:{cx}px {cy}px;animation-delay:{delay}s;animation-duration:{dur}s">')
        for k, (rx, ry, sw, op) in enumerate([(34,9,1.5,.6),(78,21,1.4,.4),(136,36,1.2,.26),(205,54,1.1,.16)]):
            parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx*scale:.0f}" ry="{ry*scale:.0f}" fill="none" stroke="#e9f2e8" stroke-width="{sw}" opacity="{op}"/>')
        parts.append('</g>')
    for i in range(10):
        x = r.randint(60, 1540); y = r.randint(500, 900)
        parts.append(f'<circle class="glint" cx="{x}" cy="{y}" r="{r.uniform(1.2,3):.1f}" fill="#f4f7ec" style="animation-delay:-{r.uniform(0,8):.1f}s"/>')
    write('rain.svg', '\n'.join(parts))

# ---------------- waves ----------------
def waves():
    r = random.Random(23)
    parts = ['<ellipse cx="820" cy="620" rx="620" ry="300" fill="#eef4e9" opacity=".04" filter="url(#wash)"/>']
    # short broken foam wisps: the painted wave supplies the structure, these supply life
    for i in range(6):
        x = r.randint(120, 1240)
        y = r.randint(600, 900)
        ln = r.randint(180, 420)
        amp = r.randint(5, 18)
        parts.append(
            f'<path class="foamline" style="animation-delay:-{r.uniform(0,14):.1f}s;animation-duration:{r.uniform(14,22):.1f}s" '
            f'd="M{x} {y} q {ln*.28:.0f} {-amp} {ln*.55:.0f} 0 t {ln*.4:.0f} 0" '
            f'fill="none" stroke="url(#foamGrad)" stroke-width="{r.uniform(2,5):.1f}" opacity="{r.uniform(.18,.36):.2f}" filter="url(#soft2)"/>'
        )
    for i in range(24):
        x = r.randint(40, 1560); y = r.randint(560, 950)
        parts.append(f'<circle class="glint" cx="{x}" cy="{y}" r="{r.uniform(1.2,3.4):.1f}" fill="#f7f4e9" style="animation-delay:-{r.uniform(0,8):.1f}s"/>')
    write('waves.svg', '\n'.join(parts))

# ---------------- petals ----------------
def petals():
    r = random.Random(24)
    parts = ['<ellipse class="washfloat" cx="1220" cy="330" rx="360" ry="310" fill="url(#redWash)" filter="url(#wash)"/>']
    for i in range(16):
        x = r.randint(160, 1540); y = r.randint(20, 520)
        s = r.uniform(.55, 1.05); rot = r.randint(-60, 60)
        dx = r.randint(-120, 90); dur = r.uniform(18, 32); delay = -r.uniform(0, 30)
        parts.append(
            f'<g transform="translate({x} {y}) rotate({rot}) scale({s:.2f})">'
            f'<path class="fall" style="--dx:{dx}px;--rot:{r.choice([300,400,520,640])}deg;animation-duration:{dur:.1f}s;animation-delay:{delay:.1f}s" '
            f'd="M0 0 C 9 -12 26 -12 35 2 C 27 15 8 13 0 0Z" fill="url(#petalGrad)" opacity=".58" filter="url(#soft2)"/>'
            '</g>'
        )
    for i in range(10):
        x = r.randint(80, 1540); y = r.randint(100, 860)
        parts.append(f'<circle class="mote" cx="{x}" cy="{y}" r="{r.uniform(1,2.2):.1f}" fill="#d9a18e" style="animation-delay:-{r.uniform(0,14):.1f}s"/>')
    write('petals.svg', '\n'.join(parts))

# ---------------- hills ----------------
def hills():
    r = random.Random(25)
    parts = []
    for i, (y, h, delay, dur) in enumerate([(510, 120, 0, 34), (690, 90, -8, 40), (850, 80, -16, 46)]):
        parts.append(
            f'<rect class="mistband" x="-140" y="{y}" width="1880" height="{h}" rx="{h//2}" fill="url(#mistGrad)" '
            f'opacity=".5" filter="url(#mist)" style="animation-delay:{delay}s;animation-duration:{dur}s"/>'
        )
    for i in range(3):
        x = 900 + i * 90; y = 250 + (i % 2) * 34
        parts.append(
            f'<path class="bird" style="animation-delay:-{i*4}s" d="M{x} {y} q 8 -7 16 0 q 8 -7 16 0" fill="none" stroke="#5d6f5a" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>'
        )
    for i in range(12):
        x = r.randint(60, 1540); y = r.randint(100, 780)
        parts.append(f'<circle class="mote" cx="{x}" cy="{y}" r="{r.uniform(1,2.8):.1f}" fill="#f2e8c9" style="animation-delay:-{r.uniform(0,14):.1f}s"/>')
    parts.append('<rect x="-80" y="860" width="1760" height="200" fill="#c6d49a" opacity=".04" filter="url(#wash)"/>')
    write('hills.svg', '\n'.join(parts))

# ---------------- castle ----------------
def castle():
    import base64
    r = random.Random(26)
    lines_png = (OUT / 'castle-lines.png').read_bytes()
    data = base64.b64encode(lines_png).decode('ascii')
    parts = [
        '<defs><filter id="revealBlur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="18"/></filter>'
        '<mask id="reveal"><rect x="0" y="0" width="1600" height="1000" fill="black"/>'
        '<rect x="-30" y="-30" width="0" height="1060" fill="white" filter="url(#revealBlur)">'
        '<animate attributeName="width" values="0;1660;1660" keyTimes="0;.70;1" dur="26s" repeatCount="indefinite"/>'
        '</rect></mask></defs>',
        '<ellipse class="washfloat" cx="1060" cy="520" rx="520" ry="400" fill="#a9c2b6" opacity=".06" filter="url(#wash)"/>',
        '<ellipse class="washfloat" cx="690" cy="480" rx="320" ry="260" fill="#c4a18e" opacity=".05" filter="url(#wash)" style="animation-delay:-12s"/>',
        '<g mask="url(#reveal)"><image href="data:image/png;base64,' + data + '" width="1600" height="1000"/>'
        '<animate attributeName="opacity" values="0;.42;.42;0" keyTimes="0;.08;.92;1" dur="26s" repeatCount="indefinite"/></g>'
    ]
    for i in range(10):
        x = r.randint(80, 1520); y = r.randint(60, 820)
        parts.append(f'<circle class="mote" cx="{x}" cy="{y}" r="{r.uniform(1,2.2):.1f}" fill="#8d8b79" style="animation-delay:-{r.uniform(0,14):.1f}s"/>')
    write('castle.svg', '\n'.join(parts))

bamboo(); rain(); waves(); petals(); hills(); castle()
print('motion layers written to', OUT)
