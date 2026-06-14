import subprocess, sys, os

DIR = r"C:\Users\Imane Gomobile\OneDrive\Desktop\Ors music hamid"
SCRIPT = r"C:\Users\Imane Gomobile\OneDrive\Desktop\test projet\convert_to_mp3.py"
EXTS = (".mp4", ".m4a", ".wav", ".flac", ".ogg", ".wma", ".aac", ".avi", ".mov", ".mkv", ".webm")
MIN_SIZE = 1024
ENC = sys.stdout.encoding or "utf-8"

count = 0
errors = 0
skipped = 0

def pr(s): print(s.encode(ENC, errors="replace").decode(ENC))

for root, _, files in os.walk(DIR):
    for f in sorted(files):
        if not f.lower().endswith(EXTS):
            continue
        inp = os.path.join(root, f)
        size = os.path.getsize(inp)
        out = os.path.splitext(inp)[0] + ".mp3"

        if size < MIN_SIZE:
            pr(f"IGNORE (vide/corrompu, {size}o) : {f}")
            skipped += 1
            continue

        if os.path.isfile(out):
            pr(f"PASSE (deja converti) : {f}")
            skipped += 1
            continue

        count += 1
        pr(f"\n--- [{count}] {f} ({size//1024} Ko) ---")
        r = subprocess.run([sys.executable, SCRIPT, inp], capture_output=True, text=True)
        if r.stdout.strip(): pr(r.stdout.strip())
        if r.returncode != 0:
            errors += 1

pr(f"\n=== Termine ===")
pr(f"Convertis : {count - errors}")
pr(f"Erreurs   : {errors}")
pr(f"Ignories  : {skipped}")
