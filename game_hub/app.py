import os, json, uuid, io, threading, base64, queue, sys, time
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gameforge'
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
app.config['GAMES_FILE'] = os.path.join(app.root_path, 'games', 'games.json')
ALLOWED_EXT = {'.py'}
socketio = SocketIO(app, cors_allowed_origins='*')
runners = {}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.dirname(app.config['GAMES_FILE']), exist_ok=True)

def load():
    if not os.path.exists(app.config['GAMES_FILE']) or os.path.getsize(app.config['GAMES_FILE']) == 0:
        return []
    try:
        return json.load(open(app.config['GAMES_FILE']))
    except:
        return []

def save(data):
    json.dump(data, open(app.config['GAMES_FILE'], 'w'), indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/games', methods=['GET', 'POST', 'OPTIONS'])
def handle_games():
    if request.method == 'GET':
        return jsonify(sorted(load(), key=lambda g: g.get('created_at', ''), reverse=True))
    name = request.form.get('name', '').strip()
    desc = request.form.get('description', '').strip()
    f = request.files.get('file')
    if not name:
        return jsonify({'error': 'Nom requis'}), 400
    if not f or os.path.splitext(f.filename)[1].lower() not in ALLOWED_EXT:
        return jsonify({'error': 'Fichier .py requis'}), 400
    gid = str(uuid.uuid4())
    fn = f"{gid}.py"
    f.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
    game = {'id': gid, 'name': name, 'description': desc or 'Aucune description', 'filename': fn,
            'created_at': __import__('datetime').datetime.now().isoformat()}
    g = load(); g.append(game); save(g)
    return jsonify(game), 201

@app.route('/api/games/<gid>', methods=['DELETE', 'OPTIONS'])
def delete_game(gid):
    if request.method == 'OPTIONS':
        return jsonify({})
    games = load()
    g = next((x for x in games if x['id'] == gid), None)
    if not g:
        return jsonify({'error': 'Introuvable'}), 404
    fp = os.path.join(app.config['UPLOAD_FOLDER'], g['filename'])
    if os.path.exists(fp):
        os.remove(fp)
    save([x for x in games if x['id'] != gid])
    return jsonify({'ok': True})

@app.route('/uploads/<fn>')
def serve_file(fn):
    return send_from_directory(app.config['UPLOAD_FOLDER'], fn)

class GameRunner:
    def __init__(self, sid, filepath):
        self.sid = sid
        self.filepath = filepath
        self.screen = None
        self.keys = __import__('collections').defaultdict(int)
        self.events = queue.Queue()
        self.alive = True

    def add_key(self, key, pressed):
        import pygame
        JS2PG = {
            8: pygame.K_BACKSPACE, 9: pygame.K_TAB, 13: pygame.K_RETURN,
            16: pygame.K_LSHIFT, 17: pygame.K_LCTRL, 27: pygame.K_ESCAPE,
            32: pygame.K_SPACE, 37: pygame.K_LEFT, 38: pygame.K_UP,
            39: pygame.K_RIGHT, 40: pygame.K_DOWN,
            46: pygame.K_DELETE,
            48: pygame.K_0, 49: pygame.K_1, 50: pygame.K_2, 51: pygame.K_3, 52: pygame.K_4,
            53: pygame.K_5, 54: pygame.K_6, 55: pygame.K_7, 56: pygame.K_8, 57: pygame.K_9,
            65: pygame.K_a, 66: pygame.K_b, 67: pygame.K_c, 68: pygame.K_d, 69: pygame.K_e,
            70: pygame.K_f, 71: pygame.K_g, 72: pygame.K_h, 73: pygame.K_i, 74: pygame.K_j,
            75: pygame.K_k, 76: pygame.K_l, 77: pygame.K_m, 78: pygame.K_n, 79: pygame.K_o,
            80: pygame.K_p, 81: pygame.K_q, 82: pygame.K_r, 83: pygame.K_s, 84: pygame.K_t,
            85: pygame.K_u, 86: pygame.K_v, 87: pygame.K_w, 88: pygame.K_x, 89: pygame.K_y,
            90: pygame.K_z, 91: pygame.K_LGUI, 93: pygame.K_MENU,
            96: pygame.K_KP0, 97: pygame.K_KP1, 98: pygame.K_KP2, 99: pygame.K_KP3,
            100: pygame.K_KP4, 101: pygame.K_KP5, 102: pygame.K_KP6, 103: pygame.K_KP7,
            104: pygame.K_KP8, 105: pygame.K_KP9,
            106: pygame.K_KP_MULTIPLY, 107: pygame.K_KP_PLUS, 109: pygame.K_KP_MINUS,
            110: pygame.K_KP_PERIOD, 111: pygame.K_KP_DIVIDE,
            186: pygame.K_SEMICOLON, 187: pygame.K_PLUS, 188: pygame.K_COMMA,
            189: pygame.K_MINUS, 190: pygame.K_PERIOD, 191: pygame.K_SLASH,
            192: pygame.K_BACKQUOTE,
            219: pygame.K_LEFTBRACKET, 220: pygame.K_BACKSLASH,
            221: pygame.K_RIGHTBRACKET, 222: pygame.K_QUOTE,
        }
        pk = JS2PG.get(key, key)
        self.events.put(('key' if pressed else 'keyup', pk))

    def stop(self):
        self.alive = False
        self.events.put(('quit', 0))

    def run(self):
        import pygame
        try:
            os.environ['SDL_VIDEODRIVER'] = 'dummy'
            pygame.init()
        except:
            pass

        orig_get = pygame.event.get
        orig_poll = pygame.event.poll
        orig_set_mode = pygame.display.set_mode
        orig_flip = pygame.display.flip

        def get_events():
            ours = []
            while not self.events.empty():
                try:
                    typ, val = self.events.get_nowait()
                    if typ == 'key':
                        ours.append(pygame.event.Event(pygame.KEYDOWN, {'key': val, 'unicode': chr(val) if 32 <= val <= 126 else ''}))
                        self.keys[val] = 1
                    elif typ == 'keyup':
                        ours.append(pygame.event.Event(pygame.KEYUP, {'key': val}))
                        self.keys[val] = 0
                    elif typ == 'quit':
                        ours.append(pygame.event.Event(pygame.QUIT))
                except queue.Empty:
                    break
            return ours

        def patched_get(*a):
            if a:
                real = orig_get(*a)
            else:
                real = orig_get()
            return get_events() + real

        def patched_poll():
            evts = get_events()
            if evts:
                return evts[0]
            return orig_poll()

        def patched_set_mode(size, flags=0, depth=0):
            self.screen = orig_set_mode(size, flags, depth)
            return self.screen

        def patched_flip():
            if not self.screen or not self.alive:
                return
            try:
                raw = pygame.image.tostring(self.screen, 'RGB')
                w, h = self.screen.get_size()
                img = __import__('PIL.Image', fromlist=['Image']).frombytes('RGB', (w, h), raw)
                buf = io.BytesIO()
                img.save(buf, 'JPEG', quality=85)
                socketio.emit('frame', {'data': base64.b64encode(buf.getvalue()).decode()}, room=self.sid)
            except:
                pass

        pygame.event.get = patched_get
        pygame.event.poll = patched_poll
        pygame.display.set_mode = patched_set_mode
        pygame.display.flip = patched_flip
        pygame.display.set_caption = lambda c: None



        def patched_get_pressed():
            return self.keys
        pygame.key.get_pressed = patched_get_pressed

        globs = {
            '__builtins__': __builtins__,
            '__name__': '__main__',
            '__file__': self.filepath,
            'pygame': pygame, 'numpy': __import__('numpy'),
            'math': __import__('math'), 'random': __import__('random'),
            'sys': __import__('sys'), 'os': __import__('os'),
            'logging': __import__('logging'), 'datetime': __import__('datetime'),
        }

        try:
            with open(self.filepath, encoding='utf-8') as f:
                exec(f.read(), globs)
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            print("GAME ERROR:", tb)
            socketio.emit('game_error', {'msg': f"{type(e).__name__}: {str(e)[:200]}"}, room=self.sid)
        finally:
            try: pygame.quit()
            except: pass
            socketio.emit('game_end', {}, room=self.sid)
            runners.pop(self.sid, None)

@socketio.on('connect')
def on_connect():
    pass

@socketio.on('run_game')
def on_run_game(data):
    sid = request.sid
    games = load()
    g = next((x for x in games if x['id'] == data.get('game_id')), None)
    if not g:
        socketio.emit('game_error', {'msg': 'Jeu introuvable'}, room=sid); return
    fp = os.path.join(app.config['UPLOAD_FOLDER'], g['filename'])
    if not os.path.exists(fp):
        socketio.emit('game_error', {'msg': 'Fichier introuvable'}, room=sid); return
    runner = GameRunner(sid, fp)
    runners[sid] = runner
    t = threading.Thread(target=runner.run, daemon=True)
    t.start()

@socketio.on('key')
def on_key(data):
    r = runners.get(request.sid)
    if r:
        r.add_key(data.get('key', 0), data.get('pressed', True))

@socketio.on('stop_game')
def on_stop():
    r = runners.pop(request.sid, None)
    if r:
        r.stop()

@socketio.on('disconnect')
def on_disconnect():
    r = runners.pop(request.sid, None)
    if r:
        r.stop()

if __name__ == '__main__':
    socketio.run(app, port=5000, debug=True, allow_unsafe_werkzeug=True)
