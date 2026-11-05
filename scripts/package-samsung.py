"""Build an Android-testable local web distribution without publishing anything."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def build_package(output, ref='HEAD'):
    commit = git('rev-parse', '--verify', ref + '^{commit}').decode().strip()
    paths = git('ls-tree', '-r', '--name-only', commit, '--', 'web', 'dist/src', 'index.html').decode().splitlines()
    payload = {'site/' + path: git('show', commit + ':' + path) for path in paths}
    required = ['site/web/index.html', 'site/web/avatar-catalog.json', 'site/dist/src/engine.js', 'site/dist/src/hand.js']
    if any(path not in payload for path in required):
        raise ValueError('Runtime incomplete')
    manifest = {'application': 'DOMINÓ TOUR', 'source_commit': commit,
                'runtime_file_count': len(payload),
                'files': {path: hashlib.sha256(data).hexdigest() for path, data in sorted(payload.items())}}
    for name in ['iniciar_teste.py', 'INICIAR_WINDOWS.bat', 'LEIA_PRIMEIRO.txt']:
        payload[name] = (ROOT / 'tools/samsung' / name).read_bytes()
    payload['PACOTE.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for path, data in sorted(payload.items()):
            archive.writestr(path, data)
    return {'output': str(output.resolve()), 'source_commit': commit, 'files': len(payload),
            'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(build_package(args.output, args.ref)))
