import subprocess, sys, os, zipfile, io, urllib.request, platform, shutil

ARCH = platform.machine()
BASE = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest"
ZIP_NAME = "ffmpeg-master-latest-win64-gpl.zip"
FFMPEG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ffmpeg-bin")
FFMPEG_EXE = os.path.join(FFMPEG_DIR, "ffmpeg.exe")
ENC = sys.stdout.encoding or "utf-8"

def safep(s):
    return s.encode(ENC, errors="replace").decode(ENC)

def download_ffmpeg():
    os.makedirs(FFMPEG_DIR, exist_ok=True)
    url = f"{BASE}/{ZIP_NAME}"
    print(safep(f"Telechargement de ffmpeg... {url}"))
    resp = urllib.request.urlopen(url)
    z = zipfile.ZipFile(io.BytesIO(resp.read()))
    for f in z.namelist():
        name = os.path.basename(f)
        if name in ("ffmpeg.exe", "ffprobe.exe", "ffplay.exe"):
            out = os.path.join(FFMPEG_DIR, name)
            with z.open(f) as src, open(out, "wb") as dst:
                shutil.copyfileobj(src, dst)
            os.chmod(out, 0o755)
    print("ffmpeg installe dans", FFMPEG_DIR)

def get_ffmpeg():
    p = shutil.which("ffmpeg")
    if p: return p
    if not os.path.isfile(FFMPEG_EXE):
        download_ffmpeg()
    return FFMPEG_EXE

def convert_to_mp3(input_path):
    ffmpeg = get_ffmpeg()
    out = os.path.splitext(input_path)[0] + ".mp3"
    print(safep(f"Conversion >> {out}"))
    r = subprocess.run([
        ffmpeg, "-i", input_path,
        "-vn", "-acodec", "libmp3lame",
        "-ar", "44100", "-ac", "2", "-b:a", "320k",
        "-y", out
    ], capture_output=True, text=True)
    if r.returncode != 0:
        err = safep(r.stderr.strip().split("\n")[-1] if r.stderr.strip() else "Erreur inconnue")
        print("ERREUR:", err)
        return False
    print(safep(f"OK : {out}"))
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Glissez-deposez un fichier sur ce script ou passez le chemin en argument.")
        print("Usage: python convert_to_mp3.py <fichier>")
        sys.exit(1)
    ok = convert_to_mp3(sys.argv[1])
    sys.exit(0 if ok else 1)
