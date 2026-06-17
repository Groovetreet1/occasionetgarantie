import pygame
import random

class FlappyBirdGame:
    def __init__(self):
        self.width = 400
        self.height = 600
        self.reset()

    def reset(self):
        self.bird_x = 80
        self.bird_y = self.height // 2
        self.bird_v = 0
        self.bird_r = 15
        self.pipes = []
        self.score = 0
        self.game_over = False
        self.pipe_w = 50
        self.gap = 150
        self.pipe_speed = 4
        self.spawn_timer = 0
        self.started = False

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if (event.key == pygame.K_SPACE or event.key == pygame.K_UP) and not self.game_over:
                self.bird_v = -8
                self.started = True
            if event.key == pygame.K_r and self.game_over:
                self.reset()

    def update(self):
        if self.game_over:
            return
        if not self.started:
            self.bird_y = self.height // 2
            return
        self.bird_v += 0.5
        if self.bird_v > 10:
            self.bird_v = 10
        self.bird_y += self.bird_v

        if self.bird_y < 0:
            self.bird_y = 0
            self.bird_v = 0

        self.spawn_timer += 1
        if self.spawn_timer >= 90:
            self.spawn_timer = 0
            pipe_h = random.randint(80, self.height - self.gap - 80)
            self.pipes.append([self.width, pipe_h, False])

        new_pipes = []
        for p in self.pipes:
            p[0] -= self.pipe_speed
            if p[0] + self.pipe_w > 0:
                new_pipes.append(p)
                if not p[2] and p[0] + self.pipe_w < self.bird_x:
                    p[2] = True
                    self.score += 1
            if (not p[2] and p[0] < self.bird_x + self.bird_r and p[0] + self.pipe_w > self.bird_x - self.bird_r):
                if (self.bird_y - self.bird_r < p[1] or self.bird_y + self.bird_r > p[1] + self.gap):
                    self.game_over = True
        self.pipes = new_pipes

        if self.bird_y + self.bird_r > self.height:
            self.game_over = True

    def draw(self, screen):
        screen.fill((80, 180, 255))
        for i in range(0, self.height, 40):
            pygame.draw.rect(screen, (60, 150, 220), (0, i + 20, self.width, 20))
        for p in self.pipes:
            pygame.draw.rect(screen, (50, 180, 50), (p[0], 0, self.pipe_w, p[1]))
            pygame.draw.rect(screen, (30, 140, 30), (p[0], p[1], self.pipe_w, 15))
            pygame.draw.rect(screen, (50, 180, 50), (p[0], p[1] + self.gap, self.pipe_w, self.height))
            pygame.draw.rect(screen, (30, 140, 30), (p[0], p[1] + self.gap - 15, self.pipe_w, 15))
        pygame.draw.circle(screen, (255, 200, 50), (self.bird_x, int(self.bird_y)), self.bird_r)
        pygame.draw.circle(screen, (255, 230, 100), (self.bird_x, int(self.bird_y)), self.bird_r - 4)
        pygame.draw.circle(screen, (0, 0, 0), (self.bird_x + 5, int(self.bird_y) - 3), 3)
        font = pygame.font.Font(None, 36)
        screen.blit(font.render(str(self.score), True, (255, 255, 255)), (self.width // 2 - 10, 30))
        screen.blit(pygame.font.Font(None, 20).render("Q:Menu", True, (100, 100, 100)), (self.width - 60, 10))
        if not self.started and not self.game_over:
            screen.blit(font.render("Press SPACE", True, (255, 255, 255)), (self.width // 2 - 70, self.height // 2 - 40))
            screen.blit(font.render("to start", True, (255, 255, 255)), (self.width // 2 - 50, self.height // 2))
        if self.game_over:
            ov = pygame.font.Font(None, 48).render("GAME OVER", True, (255, 50, 50))
            screen.blit(ov, (self.width // 2 - 100, self.height // 2 - 40))
            screen.blit(pygame.font.Font(None, 28).render(f"Score: {self.score}", True, (255, 255, 255)), (self.width // 2 - 40, self.height // 2))
            screen.blit(pygame.font.Font(None, 22).render("Press R to restart", True, (200, 200, 200)), (self.width // 2 - 70, self.height // 2 + 30))

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
