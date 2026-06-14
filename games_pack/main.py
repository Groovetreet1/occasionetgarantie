import pygame
import sys
from games import GAMES

pygame.init()

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("15 Games Pack - Select a Game")
clock = pygame.time.Clock()
font_title = pygame.font.Font(None, 52)
font_game = pygame.font.Font(None, 32)
font_small = pygame.font.Font(None, 22)

TITLE_COLOR = (255, 220, 50)
TEXT_COLOR = (200, 200, 200)
HOVER_COLOR = (255, 200, 50)
BG_COLOR = (10, 10, 25)
CARD_COLOR = (25, 25, 45)
CARD_HOVER = (40, 40, 70)

def draw_menu():
    screen.fill(BG_COLOR)
    title = font_title.render("~ 15 Games Pack ~", True, TITLE_COLOR)
    screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, 20))
    subtitle = font_small.render("Select a game with mouse click | Q=Quit", True, (100, 100, 130))
    screen.blit(subtitle, (SCREEN_WIDTH // 2 - subtitle.get_width() // 2, 65))

    cards_per_row = 3
    card_w = 220
    card_h = 80
    start_x = (SCREEN_WIDTH - (cards_per_row * card_w + (cards_per_row - 1) * 20)) // 2
    start_y = 100
    mouse_x, mouse_y = pygame.mouse.get_pos()
    hovered = -1

    for i, (name, _) in enumerate(GAMES):
        col = i % cards_per_row
        row = i // cards_per_row
        x = start_x + col * (card_w + 20)
        y = start_y + row * (card_h + 12)
        rect = pygame.Rect(x, y, card_w, card_h)
        is_hover = rect.collidepoint(mouse_x, mouse_y)
        color = CARD_HOVER if is_hover else CARD_COLOR
        pygame.draw.rect(screen, color, rect, border_radius=8)
        pygame.draw.rect(screen, (60, 60, 90), rect, 2, border_radius=8)
        icons = ["S", "P", "I", "L", "R", "B", "F", "T", "M", "D", "H", "N", "E", "X", "A"]
        icon = icons[i]
        ic = pygame.font.Font(None, 36).render(icon, True, TITLE_COLOR)
        screen.blit(ic, (x + 12, y + 22))
        txt = font_game.render(name, True, HOVER_COLOR if is_hover else TEXT_COLOR)
        screen.blit(txt, (x + 48, y + 26))
        if is_hover:
            hovered = i

    pygame.display.flip()
    return hovered

def main():
    running = True
    while running:
        hovered = draw_menu()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_q:
                running = False
            if event.type == pygame.MOUSEBUTTONDOWN and hovered >= 0:
                name, game_class = GAMES[hovered]
                pygame.display.set_caption(f"{name} - Q:Menu | R:Restart")
                game = game_class()
                result = game.run(screen)
                if result == "quit":
                    running = False
                pygame.display.set_caption("15 Games Pack - Select a Game")
        clock.tick(30)
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
