import pygame

class PlatformerGame:
    def __init__(self):
        self.width = 800
        self.height = 500
        self.reset()

    def reset(self):
        self.px, self.py = 50, 300
        self.vx, self.vy = 0, 0
        self.on_ground = False
        self.score = 0
        self.game_over = False
        self.won = False
        self.coins = [(180, 230), (350, 180), (520, 130), (650, 280)]
        self.goal = (720, 220)
        self.platforms = [
            (0, 460, 800, 40),
            (100, 360, 120, 15),
            (260, 300, 120, 15),
            (420, 240, 120, 15),
            (580, 350, 120, 15),
            (250, 170, 80, 15),
            (450, 130, 80, 15),
            (660, 200, 100, 15),
            (0, 0, 800, 20),
        ]

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        self.vx = 0
        if keys[pygame.K_LEFT]:
            self.vx = -5
        if keys[pygame.K_RIGHT]:
            self.vx = 5
        if (keys[pygame.K_SPACE] or keys[pygame.K_UP]) and self.on_ground:
            self.vy = -11
            self.on_ground = False

        self.vy += 0.6
        if self.vy > 13:
            self.vy = 13
        self.px += self.vx
        self.py += self.vy
        self.on_ground = False

        for pl in self.platforms:
            rx, ry, rw, rh = pl
            if self.px + 30 > rx and self.px < rx + rw and self.py + 30 > ry and self.py < ry + rh:
                if self.vy > 0 and self.py + 30 - self.vy <= ry:
                    self.py = ry - 30
                    self.vy = 0
                    self.on_ground = True
                elif self.vy < 0 and self.py - self.vy >= ry + rh:
                    self.py = ry + rh
                    self.vy = 0

        if self.py > self.height:
            self.game_over = True
            return

        for c in self.coins[:]:
            cx, cy = c
            if abs(self.px - cx) < 25 and abs(self.py - cy) < 25:
                self.coins.remove(c)
                self.score += 1

        if abs(self.px - self.goal[0]) < 25 and abs(self.py - self.goal[1]) < 25:
            self.won = True
            self.game_over = True

    def draw(self, screen):
        screen.fill((20, 20, 40))
        for pl in self.platforms:
            pygame.draw.rect(screen, (60, 60, 100), pl)
            pygame.draw.rect(screen, (80, 80, 120), pl, 2)
        pygame.draw.rect(screen, (0, 200, 80), (self.px, self.py, 30, 30))
        pygame.draw.rect(screen, (0, 255, 120), (self.px, self.py, 30, 6))
        pygame.draw.circle(screen, (255, 255, 255), (self.px + 8, self.py + 8), 4)
        pygame.draw.circle(screen, (255, 255, 255), (self.px + 22, self.py + 8), 4)
        for c in self.coins:
            pygame.draw.circle(screen, (255, 215, 0), c, 10)
            pygame.draw.circle(screen, (255, 255, 100), c, 6)
        gx, gy = self.goal
        pygame.draw.rect(screen, (0, 255, 0), (gx - 15, gy - 15, 30, 30), 3)
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Coins: {self.score}/4  Q:Menu", True, (200, 200, 200)), (10, 10))
        if self.game_over:
            msg = "LEVEL COMPLETE!" if self.won else "GAME OVER"
            color = (0, 255, 0) if self.won else (255, 50, 50)
            ov = pygame.font.Font(None, 56).render(msg, True, color)
            screen.blit(ov, (self.width // 2 - 150, self.height // 2 - 30))
            s = pygame.font.Font(None, 28).render("Press R to restart", True, (200, 200, 200))
            screen.blit(s, (self.width // 2 - 80, self.height // 2 + 20))

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
