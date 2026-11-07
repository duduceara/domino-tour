"""Compare captured screenshots to explicitly approved captures; never creates references.
Usage: python scripts/compare-premium-screenshots.py approved.png candidate.png
Requires Pillow. Images must use the same viewport, browser and game state.
"""
import sys,json
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
baseline,candidate=map(Path,sys.argv[1:3])
if not baseline.is_file():
    raise SystemExit('Missing approved screenshot. Obtain explicit visual approval; baseline generation is forbidden.')
a,b=Image.open(baseline).convert('RGB'),Image.open(candidate).convert('RGB')
if a.size!=b.size:raise SystemExit('Viewport mismatch')
diff=ImageChops.difference(a,b)
changed=sum(max(pixel)>16 for pixel in diff.getdata())/(a.width*a.height)
print(json.dumps({'baseline':str(baseline),'candidate':str(candidate),'changed_fraction':changed,'mean_channel_error':ImageStat.Stat(diff).mean}))
diff.save(candidate.with_suffix('.diff.png'))
raise SystemExit(0 if changed<=.001 else 1)
