import pygame
import random

class RunnerGame:
    def __init__(self):
        self.width = 500
        self.height = 400
        self.reset()

    def reset(self):
        self.player_x = 80
        self.player_y = self.height - 80
        self.player_w, self.player_h = 30, 40
        self.vy = 0
        self.on_ground = True
        self.obstacles = []
        self.score = 0
        self.game_over = False
        self.speed = 6
        self.spawn_timer = 0
        self.ground_y = self.height - 40

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if (event.key == pygame.K_SPACE or event.key == pygame.K_UP) and self.on_ground and not self.game_over:
                self.vy = -12
                self.on_ground = False
            if event.key == pygame.K_r and self.game_over:
                self.reset()

    def update(self):
        if self.game_over:
            return
        self.vy += 0.7
        if self.vy > 15:
            self.vy = 15
        self.player_y += self.vy
        if self.player_y >= self.ground_y - self.player_h:
            self.player_y = self.ground_y - self.player_h
            self.vy = 0
            self.on_ground = True

        self.spawn_timer += 1
        if self.spawn_timer >= max(30, 80 - self.score // 10):
            self.spawn_timer = 0
            otype = random.choice(["cactus", "bird", "cactus", "cactus"])
            if otype == "cactus":
                h = random.randint(30, 50)
                self.obstacles.append([self.width, self.ground_y - h, 20, h, "cactus"])
            else:
                self.obstacles.append([self.width, self.ground_y - 50, 30, 20, "bird"])

        new_obs = []
        for o in self.obstacles:
            o[0] -= self.speed
            if o[0] + o[2] > 0:
                new_obs.append(o)
        self.obstacles = new_obs

        for o in self.obstacles:
            if (self.player_x < o[0] + o[2] and self.player_x + self.player_w > o[0] and
                self.player_y < o[1] + o[3] and self.player_y + self.player_h > o[1]):
                self.game_over = True
                return

        self.score += 1

    def draw(self, screen):
        screen.fill((120, 200, 255))
        pygame.draw.rect(screen, (200, 180, 140), (0, self.ground_y, self.width, 40))
        pygame.draw.rect(screen, (50, 180, 50), (0, self.ground_y - 3, self.width, 6))
        for i in range(0, self.width, 30):
            pygame.draw.line(screen, (150, 130, 100), (i + self.score % 30, self.ground_y + 20), (i + 15 + self.score % 30, self.ground_y + 25), 2)
        pygame.draw.rect(screen, (50, 50, 200), (self.player_x, self.player_y, self.player_w, self.player_h))
        pygame.draw.circle(screen, (255, 255, 255), (self.player_x + 8, self.player_y + 5), 5)
        pygame.draw.circle(screen, (255, 255, 255), (self.player_x + 22, self.player_y + 5), 5)
        for o in self.obstacles:
            if o[4] == "cactus":
                pygame.draw.rect(screen, (0, 150, 0), (o[0], o[1], o[2], o[3]))
                pygame.draw.rect(screen, (0, 100, 0), (o[0] - 5, o[1] + 5, 5, 10))
            else:
                pygame.draw.ellipse(screen, (200, 100, 50), (o[0], o[1], o[2], o[3]))
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Score: {self.score}", True, (50, 50, 50)), (10, 10))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 10))
        if self.game_over:
            ov = pygame.font.Font(None, 48).render("GAME OVER", True, (200, 50, 50))
            screen.blit(ov, (self.width // 2 - 110, self.height // 2 - 40))
            screen.blit(font.render(f"Score: {self.score}", True, (50, 50, 50)), (self.width // 2 - 40, self.height // 2))
            screen.blit(pygame.font.Font(None, 22).render("Press R to restart", True, (100, 100, 100)), (self.width // 2 - 70, self.height // 2 + 30))

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
