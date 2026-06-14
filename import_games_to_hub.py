import os, json, uuid, datetime, shutil, re

GAMES_PACK = os.path.join(os.path.dirname(__file__), "games_pack", "games")
GAME_HUB = os.path.join(os.path.dirname(__file__), "game_hub")
UPLOADS = os.path.join(GAME_HUB, "uploads")
GAMES_JSON = os.path.join(GAME_HUB, "games", "games.json")

os.makedirs(UPLOADS, exist_ok=True)

GAME_META = [
    ("snake.py", "Snake", "Classic Snake - mangez les fruits sans vous mordre la queue"),
    ("pong.py", "Pong", "Pong contre IA - premier à 5 points gagne"),
    ("space_invaders.py", "Space Invaders", "Tirez sur les aliens et sauvez la Terre"),
    ("platformer.py", "Platformer", "Sautez de plateforme en plateforme, collectez les pièces"),
    ("racing.py", "Racing", "Course sur route - évitez les obstacles et battez votre score"),
    ("breakout.py", "Breakout", "Cassez toutes les briques avec la balle"),
    ("flappy_bird.py", "Flappy Bird", "Flappy Bird - volez entre les tuyaux"),
    ("tetris.py", "Tetris", "Tetris classique - empilez les blocs"),
    ("maze.py", "Maze", "Labyrinthe généré aléatoirement - trouvez la sortie"),
    ("dodge.py", "Dodge", "Esquivez les projectiles qui viennent de toutes parts"),
    ("shooter.py", "Shooter", "Tirez sur les vagues d'ennemis avec votre viseur"),
    ("runner.py", "Runner", "Course infinie - sautez par-dessus les obstacles"),
    ("memory.py", "Memory", "Jeu de memory - trouvez toutes les paires"),
    ("tictactoe.py", "Tic Tac Toe", "Tic Tac Toe contre l'IA avec Minimax"),
    ("asteroids.py", "Asteroids", "Tirez sur les astéroïdes dans l'espace"),
]

STUB = """
if __name__ == "__main__":
    import pygame
    _game = {class_name}()
    _screen = pygame.display.set_mode((_game.width, _game.height))
    pygame.display.set_caption("{display_name}")
    _game.run(_screen)
    pygame.quit()
"""

entries = []

for filename, display_name, description in GAME_META:
    src = os.path.join(GAMES_PACK, filename)
    if not os.path.exists(src):
        print(f"SKIP {filename} - not found")
        continue

    with open(src, encoding="utf-8") as f:
        content = f.read()

    # Find the class name (the first class defined)
    m = re.search(r"class\s+(\w+Game)\s*:", content)
    if not m:
        print(f"SKIP {filename} - no class found")
        continue
    class_name = m.group(1)
    game_id = str(uuid.uuid4())
    dest = os.path.join(UPLOADS, f"{game_id}.py")

    full_content = content + STUB.format(class_name=class_name, display_name=display_name)

    with open(dest, "w", encoding="utf-8") as f:
        f.write(full_content)

    entry = {
        "id": game_id,
        "name": display_name,
        "description": description,
        "filename": f"{game_id}.py",
        "created_at": datetime.datetime.now().isoformat()
    }
    entries.append(entry)
    print(f"OK {display_name:20s} -> {game_id}.py")

with open(GAMES_JSON, "w", encoding="utf-8") as f:
    json.dump(entries, f, indent=2, ensure_ascii=False)

print(f"\nDone! {len(entries)} games imported to game_hub")
