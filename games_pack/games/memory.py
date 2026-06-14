import pygame
import random

class MemoryGame:
    def __init__(self):
        self.cols = 4
        self.rows = 4
        self.card_w = 80
        self.card_h = 100
        self.margin = 10
        self.width = self.cols * (self.card_w + self.margin) + self.margin
        self.height = self.rows * (self.card_h + self.margin) + self.margin + 40
        self.reset()

    def reset(self):
        self.cards = []
        values = list(range(1, (self.cols * self.rows) // 2 + 1)) * 2
        random.shuffle(values)
        for i in range(self.rows):
            row = []
            for j in range(self.cols):
                v = values[i * self.cols + j]
                row.append({"value": v, "flipped": False, "matched": False})
            self.cards.append(row)
        self.flipped = []
        self.matched_pairs = 0
        self.total_pairs = (self.cols * self.rows) // 2
        self.moves = 0
        self.game_over = False
        self.waiting = False
        self.wait_timer = 0

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()
        if event.type == pygame.MOUSEBUTTONDOWN and not self.waiting and not self.game_over:
            mx, my = event.pos
            if my < 40:
                return
            col = (mx - self.margin) // (self.card_w + self.margin)
            row = (my - 40 - self.margin) // (self.card_h + self.margin)
            if 0 <= col < self.cols and 0 <= row < self.rows:
                card = self.cards[row][col]
                if not card["flipped"] and not card["matched"]:
                    card["flipped"] = True
                    self.flipped.append((row, col))
                    if len(self.flipped) == 2:
                        self.moves += 1
                        r1, c1 = self.flipped[0]
                        r2, c2 = self.flipped[1]
                        if self.cards[r1][c1]["value"] == self.cards[r2][c2]["value"]:
                            self.cards[r1][c1]["matched"] = True
                            self.cards[r2][c2]["matched"] = True
                            self.matched_pairs += 1
                            self.flipped = []
                            if self.matched_pairs >= self.total_pairs:
                                self.game_over = True
                        else:
                            self.waiting = True
                            self.wait_timer = 60

    def update(self):
        if self.waiting:
            self.wait_timer -= 1
            if self.wait_timer <= 0:
                r1, c1 = self.flipped[0]
                r2, c2 = self.flipped[1]
                self.cards[r1][c1]["flipped"] = False
                self.cards[r2][c2]["flipped"] = False
                self.flipped = []
                self.waiting = False

    def draw(self, screen):
        screen.fill((15, 10, 25))
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Moves: {self.moves}  Matched: {self.matched_pairs}/{self.total_pairs}", True, (200, 200, 200)), (10, 8))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 8))
        for row in range(self.rows):
            for col in range(self.cols):
                card = self.cards[row][col]
                x = self.margin + col * (self.card_w + self.margin)
                y = 40 + self.margin + row * (self.card_h + self.margin)
                if card["flipped"] or card["matched"]:
                    pygame.draw.rect(screen, (50, 50, 100), (x, y, self.card_w, self.card_h))
                    pygame.draw.rect(screen, (80, 80, 150), (x, y, self.card_w, self.card_h), 2)
                    if card["matched"]:
                        pygame.draw.rect(screen, (50, 100, 50), (x + 5, y + 5, self.card_w - 10, self.card_h - 10))
                    vfont = pygame.font.Font(None, 44)
                    text = vfont.render(str(card["value"]), True, (255, 255, 255))
                    screen.blit(text, (x + self.card_w // 2 - 12, y + self.card_h // 2 - 16))
                else:
                    pygame.draw.rect(screen, (30, 30, 60), (x, y, self.card_w, self.card_h))
                    pygame.draw.rect(screen, (60, 60, 100), (x, y, self.card_w, self.card_h), 2)
                    pygame.draw.rect(screen, (40, 40, 70), (x + 10, y + 10, self.card_w - 20, self.card_h - 20))
        if self.game_over:
            ov = pygame.font.Font(None, 48).render("YOU WIN!", True, (0, 255, 0))
            screen.blit(ov, (self.width // 2 - 100, self.height // 2 - 30))
            screen.blit(font.render(f"Completed in {self.moves} moves", True, (200, 200, 200)), (self.width // 2 - 100, self.height // 2 + 10))
            screen.blit(font.render("Press R to restart", True, (200, 200, 200)), (self.width // 2 - 80, self.height // 2 + 40))

    def run(self, screen):
        clock = pygame.time.Clock()
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    return "quit"
                if event.type == pygame.KEYDOWN and event.key == pygame.K_q:
                    return "menu"
                self.handle_event(event)
            self.update()
            self.draw(screen)
            pygame.display.flip()
            clock.tick(60)
        return "menu"
