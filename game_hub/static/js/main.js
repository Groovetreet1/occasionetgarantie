let gid = '', gname = '', socket = null, running = false;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

function toast(m, t) {
    const el = document.createElement('div');
    el.className = `toast ${t||'success'}`;
    el.innerHTML = `<i class="fas fa-${t==='error'?'exclamation-circle':'check-circle'}"></i> ${m}`;
    $('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function loadGames() {
    fetch('/api/games').then(r => r.json()).then(render);
}

function render(games) {
    $('totalGames').textContent = games.length;
    const grid = $('gamesGrid');
    const empty = $('emptyState');
    const q = $('searchInput').value.toLowerCase();
    const f = games.filter(g => g.name.toLowerCase().includes(q));
    if (!f.length) {
        grid.innerHTML = games.length ? '<div class="empty-state"><i class="fas fa-search" style="font-size:30px;opacity:.3"></i><h3>Aucun résultat</h3></div>' : '';
        if (!games.length) grid.appendChild(empty);
        return;
    }
    grid.innerHTML = f.map(g => `<div class="game-card" data-id="${g.id}">
        <h4><i class="fas fa-gamepad" style="color:var(--accent2);margin-right:6px"></i>${esc(g.name)}</h4>
        <p>${esc(g.description)}</p>
        <div class="footer"><span>${new Date(g.created_at).toLocaleDateString('fr-FR')}</span><span><span class="dot"></span> Prêt</span></div>
    </div>`).join('');
    grid.querySelectorAll('.game-card').forEach(el => el.onclick = () => openDetail(el.dataset.id));
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

$('searchInput').oninput = loadGames;
$('openModal').onclick = () => $('modalOverlay').classList.add('active');
$('closeModal').onclick = () => { $('modalOverlay').classList.remove('active'); $('gameForm').reset(); $('fileZone').classList.remove('has-file'); $('fileName').textContent = ''; };
$('modalOverlay').onclick = e => { if (e.target === e.currentTarget) $('closeModal').click(); };

const fz = $('fileZone'), fi = fz.querySelector('input');
fi.onchange = () => { if (fi.files.length) { $('fileName').textContent = fi.files[0].name; fz.classList.add('has-file'); } };
fz.ondragover = e => { e.preventDefault(); fz.classList.add('dragover'); };
fz.ondragleave = () => fz.classList.remove('dragover');
fz.ondrop = e => { e.preventDefault(); fz.classList.remove('dragover'); if (e.dataTransfer.files.length) { fi.files = e.dataTransfer.files; fi.onchange(); } };

$('gameForm').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', $('gameName').value);
    fd.append('description', $('gameDesc').value);
    fd.append('file', fi.files[0]);
    fetch('/api/games', { method: 'POST', body: fd })
        .then(r => { if (!r.ok) return r.json().then(e => { throw new Error(e.error); }); return r.json(); })
        .then(() => { toast('Jeu ajouté !'); $('closeModal').click(); loadGames(); })
        .catch(e => toast(e.message, 'error'));
};

function openDetail(id) {
    gid = id;
    fetch('/api/games').then(r => r.json()).then(games => {
        const g = games.find(x => x.id === id); if (!g) return;
        gname = g.name;
        $('detailTitle').innerHTML = `<i class="fas fa-info-circle"></i> ${esc(g.name)}`;
        $('detailDesc').textContent = g.description;
        $('detailOverlay').classList.add('active');
    });
}

$('closeDetail').onclick = () => $('detailOverlay').classList.remove('active');
$('detailOverlay').onclick = e => { if (e.target === e.currentTarget) $('closeDetail').click(); };
$('deleteBtn').onclick = () => {
    if (!confirm('Supprimer ?')) return;
    fetch('/api/games/' + gid, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error('Erreur'); toast('Supprimé'); $('closeDetail').click(); loadGames(); })
        .catch(e => toast(e.message, 'error'));
};

$('playBtn').onclick = () => { $('closeDetail').click(); setTimeout(openPlayer, 300); };
$('backBtn').onclick = showLib;

function showLib() {
    $('playerView').classList.add('hidden');
    $('libraryView').classList.remove('hidden');
    if (socket) { socket.emit('stop_game'); socket.disconnect(); socket = null; }
    running = false;
}

function openPlayer() {
    $('playerName').textContent = gname;
    $('playerIcon').className = 'fas fa-gamepad';
    $('playerStatus').textContent = '⏳ Connexion...';
    $('loadingOverlay').classList.remove('hidden');
    $('libraryView').classList.add('hidden');
    $('playerView').classList.remove('hidden');
    connectAndPlay();
}

function connectAndPlay() {
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
        $('playerStatus').textContent = '▶ Démarrage du jeu...';
        socket.emit('run_game', { game_id: gid });
    });

    socket.on('frame', (data) => {
        if (!$('playerView').classList.contains('hidden')) {
            $('loadingOverlay').classList.add('hidden');
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = 'data:image/jpeg;base64,' + data.data;
        }
    });

    socket.on('game_error', (data) => {
        toast(data.msg || 'Erreur', 'error');
        $('playerStatus').textContent = '❌ ' + (data.msg || 'Erreur');
        $('loadingOverlay').classList.add('hidden');
    });

    socket.on('game_end', () => {
        $('playerStatus').textContent = '✓ Terminé';
        $('loadingOverlay').classList.add('hidden');
        running = false;
    });

    socket.on('disconnect', () => {
        $('playerStatus').textContent = '❌ Déconnecté';
        if (!$('loadingOverlay').classList.contains('hidden')) {
            $('loadingOverlay').querySelector('p').textContent = 'Perte de connexion...';
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (!$('playerView').classList.contains('hidden') && socket && socket.connected) {
        const key = e.keyCode || e.which;
        socket.emit('key', { key, pressed: true });
        if ([32, 37, 38, 39, 40, 65, 68, 87, 83].includes(key)) {
            e.preventDefault();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (!$('playerView').classList.contains('hidden') && socket && socket.connected) {
        const key = e.keyCode || e.which;
        socket.emit('key', { key, pressed: false });
    }
});

loadGames();
