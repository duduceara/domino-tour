"""Read-only, token-protected local distribution server. Python standard library only."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
from pathlib import Path
import secrets
import socket
from urllib.parse import unquote, urlsplit
import webbrowser


class LocalGameHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json'}

    def __init__(self, *args, site_root, token, **kwargs):
        self.site_root = Path(site_root).resolve()
        self.token = token
        self.target = self.site_root
        super().__init__(*args, directory=str(self.site_root), **kwargs)

    def authorise(self):
        path = unquote(urlsplit(self.path).path)
        parts = path.split('/')
        if len(parts) < 3 or not secrets.compare_digest(parts[1], self.token):
            self.send_error(404)
            return False
        remainder = parts[2:]
        if any(part in ('.', '..') or '\\' in part or '\x00' in part for part in remainder):
            self.send_error(404)
            return False
        target = self.site_root.joinpath(*remainder).resolve()
        if not target.is_relative_to(self.site_root):
            self.send_error(404)
            return False
        if not ''.join(remainder):
            self.send_response(302)
            self.send_header('Location', '/' + self.token + '/web/index.html')
            self.end_headers()
            return False
        if target.is_dir():
            self.send_error(404)
            return False
        self.target = target
        return True

    def translate_path(self, path):
        return str(self.target)

    def do_GET(self):
        if self.authorise():
            super().do_GET()

    def do_HEAD(self):
        if self.authorise():
            super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, format, *args):
        # Do not repeat access tokens in request logs.
        pass


def private_addresses():
    try:
        return sorted({addr for addr in socket.gethostbyname_ex(socket.gethostname())[2]
                       if ipaddress.ip_address(addr).is_private and not ipaddress.ip_address(addr).is_loopback})
    except OSError:
        return []


def make_server(site_root, host='0.0.0.0', port=8765, token=None):
    token = token or secrets.token_urlsafe(6)
    server = ThreadingHTTPServer((host, port), partial(LocalGameHandler, site_root=site_root, token=token))
    server.access_token = token
    return server


def main():
    parser = argparse.ArgumentParser(description='DOMINÓ TOUR — teste local no Samsung')
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--host', default='0.0.0.0')
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--site', type=Path, default=Path(__file__).resolve().parent / 'site')
    args = parser.parse_args()
    if not (args.site / 'web/index.html').is_file():
        parser.error('Pasta site incompleta. Extraia todo o ZIP antes de iniciar.')
    try:
        server = make_server(args.site, args.host, args.port)
    except OSError as exc:
        parser.exit(1, f'Não foi possível iniciar o teste: {exc}\nTente outra porta com --port 8766.\n')
    suffix = f':{server.server_port}/{server.access_token}/web/index.html'
    print('\nDOMINÓ TOUR | EDVÓRIA — teste local', flush=True)
    print('Mantenha esta janela aberta e conecte o Samsung à mesma rede Wi-Fi do computador.', flush=True)
    for address in private_addresses():
        print('NO SAMSUNG: http://' + address + suffix, flush=True)
    print('NO COMPUTADOR: http://127.0.0.1' + suffix, flush=True)
    print('Se não aparecer endereço para o Samsung, use o IPv4 do computador no lugar de 127.0.0.1.', flush=True)
    print('Para encerrar: Ctrl+C. A escolha do avatar é salva; a partida não é retomada após recarregar.\n', flush=True)
    if not args.no_browser:
        webbrowser.open('http://127.0.0.1' + suffix)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
