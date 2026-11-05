import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


builder = module('samsung_builder', ROOT / 'scripts/package-samsung.py')
launcher = module('samsung_launcher', ROOT / 'tools/samsung/iniciar_teste.py')


class SamsungPackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.path = Path(cls.temp.name)
        cls.summary = builder.build_package(cls.path / 'teste.zip')
        with zipfile.ZipFile(cls.path / 'teste.zip') as archive:
            archive.extractall(cls.path / 'unpacked')
            cls.names = archive.namelist()
        cls.manifest = json.loads((cls.path / 'unpacked/PACOTE.json').read_text())
        cls.server = launcher.make_server(cls.path / 'unpacked/site', '127.0.0.1', 0, 'test-token')
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def request(self, path, method='GET'):
        return urlopen(Request(self.origin + path, method=method), timeout=3)

    def test_source_bytes_and_no_repository_metadata(self):
        self.assertFalse(any('.git/' in name or name.startswith('/') for name in self.names))
        for path, digest in self.manifest['files'].items():
            data = (self.path / 'unpacked' / path).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), digest)
            original = subprocess.check_output(['git', 'show', self.manifest['source_commit'] + ':' + path.removeprefix('site/')], cwd=ROOT)
            self.assertEqual(data, original)
        for name in ['LEIA_PRIMEIRO.txt', 'INICIAR_WINDOWS.bat', 'iniciar_teste.py']:
            self.assertIn(name, self.names)

    def test_access_token_and_runtime_mime(self):
        for path in ['/web/index.html', '/wrong-token/web/index.html', '/test-token/../PACOTE.json', '/test-token/%2e%2e/PACOTE.json', '/test-token/.git/config']:
            with self.assertRaises(HTTPError) as caught:
                self.request(path)
            self.assertEqual(caught.exception.code, 404)
        with self.request('/test-token/') as response:
            self.assertIn(b'avatar-picker.js', response.read())
        with self.request('/test-token/dist/src/engine.js') as response:
            self.assertEqual(response.headers.get_content_type(), 'text/javascript')
        with self.request('/test-token/web/index.html', 'HEAD') as response:
            self.assertEqual(response.read(), b'')
            self.assertGreater(int(response.headers['Content-Length']), 0)

    def test_catalog_and_every_official_portrait_served_intact(self):
        with self.request('/test-token/web/avatar-catalog.json') as response:
            catalog = json.loads(response.read())
        self.assertEqual(len(catalog['items']), 50)
        self.assertEqual([a['name'] for a in catalog['opponents']], ['RobiX', 'AndroX', 'DomiX'])
        for asset in catalog['items'] + catalog['opponents']:
            with self.request('/test-token/web/' + asset['src']) as response:
                self.assertEqual(response.headers.get_content_type(), 'image/webp')
                self.assertEqual(hashlib.sha256(response.read()).hexdigest(), asset['sha256'])

    def test_runtime_includes_manual_hand_and_unchanged_rules(self):
        for path in ['web/avatar-picker.js', 'web/avatar-profile.js', 'web/entry-flow.js', 'dist/src/hand.js', 'dist/src/session.js', 'dist/src/bots.js']:
            with self.request('/test-token/' + path) as response:
                self.assertGreater(len(response.read()), 0)
        with self.assertRaises(HTTPError) as caught:
            self.request('/test-token/web/avatar-catalog.json', 'POST')
        self.assertEqual(caught.exception.code, 501)


if __name__ == '__main__':
    unittest.main()
