"""Read-only structural/hash diagnostic for approved gallery bytes. No repair."""
import hashlib
import json
from pathlib import Path
import struct
import zlib
ROOT = Path(__file__).resolve().parents[1]


def png_structure(data):
    offset = 8
    chunks = []
    while offset + 12 <= len(data):
        length = struct.unpack('>I', data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8].decode('ascii', errors='replace')
        end = offset + length + 12
        if end > len(data):
            return {'valid': False, 'error': 'incomplete_chunk', 'chunk': kind,
                    'offset': offset, 'declared_payload_bytes': length,
                    'minimum_file_bytes': end, 'actual_file_bytes': len(data), 'complete_chunks': chunks}
        crc = struct.unpack('>I', data[end - 4:end])[0]
        if (zlib.crc32(data[offset + 4:end - 4]) & 0xffffffff) != crc:
            return {'valid': False, 'error': 'crc_mismatch', 'chunk': kind, 'offset': offset}
        chunks.append(kind)
        offset = end
        if kind == 'IEND':
            return {'valid': offset == len(data), 'complete_chunks': chunks}
    return {'valid': False, 'error': 'missing_iend', 'complete_chunks': chunks}


def audit_gallery():
    catalog = json.loads((ROOT / 'web/approved-interfaces.json').read_text())
    assets = {}
    for screen in catalog:
        src = screen['src']
        if not src:
            continue
        if src in assets:
            assets[src]['screens'].append(screen['number'])
            continue
        path = ROOT / 'web' / src
        data = path.read_bytes()
        actual = hashlib.sha256(data).hexdigest()
        kind = 'PNG' if data.startswith(b'\x89PNG\r\n\x1a\n') else 'JPEG' if data.startswith(b'\xff\xd8') else 'unknown'
        assets[src] = {'path': src, 'screens': [screen['number']], 'bytes': len(data),
                       'expected_sha256': screen['sha256'], 'actual_sha256': actual,
                       'hash_matches': actual == screen['sha256'], 'detected_format': kind,
                       'structure': png_structure(data) if kind == 'PNG' else {'jpeg_eoi_present': data.endswith(b'\xff\xd9')}}
    return {'positions': len(catalog), 'missing_screens': [s['number'] for s in catalog if not s['src']],
            'unique_assets': len(assets), 'hash_matches': sum(a['hash_matches'] for a in assets.values()),
            'hash_mismatches': sum(not a['hash_matches'] for a in assets.values()), 'assets': list(assets.values())}


if __name__ == '__main__':
    print(json.dumps(audit_gallery(), ensure_ascii=False, indent=2))
