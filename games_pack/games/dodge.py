import pygame
import random
import math

class DodgeGame:
    def __init__(self):
        self.width = 600
        self.height = 500
        self.reset()

    def reset(self):
        self.player_x = self.width // 2
        self.player_y = self.height // 2
        self.player_r = 15
        self.bullets = []
        self.score = 0
        self.game_over = False
        self.spawn_timer = 0
        self.speed = 3
        self.level = 1

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            dx -= 5
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            dx += 5
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            dy -= 5
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            dy += 5
        self.player_x = max(self.player_r, min(self.width - self.player_r, self.player_x + dx))
        self.player_y = max(self.player_r, min(self.height - self.player_r, self.player_y + dy))

        self.spawn_timer += 1
        spawn_rate = max(15, 50 - self.level * 3)
        if self.spawn_timer >= spawn_rate:
            self.spawn_timer = 0
            side = random.randint(0, 3)
            spd = self.speed + self.level * 0.3
            if side == 0:
                bx, by = random.randint(0, self.width), -10
                angle = math.atan2(self.player_y - by, self.player_x - bx)
            elif side == 1:
                bx, by = random.randint(0, self.width), self.height + 10
                angle = math.atan2(self.player_y - by, self.player_x - bx)
            elif side == 2:
                bx, by = -10, random.randint(0, self.height)
                angle = math.atan2(self.player_y - by, self.player_x - bx)
            else:
                bx, by = self.width + 10, random.randint(0, self.height)
                angle = math.atan2(self.player_y - by, self.player_x - bx)
            self.bullets.append([bx, by, math.cos(angle) * spd, math.sin(angle) * spd, random.choice([8, 10, 12])])

        new_bullets = []
        for b in self.bullets:
            b[0] += b[2]
            b[1] += b[3]
            dist = math.hypot(b[0] - self.player_x, b[1] - self.player_y)
            if dist < self.player_r + b[4]:
                self.game_over = True
                return
            if -50 < b[0] < self.width + 50 and -50 < b[1] < self.height + 50:
                new_bullets.append(b)
        self.bullets = new_bullets
        self.score += 1
        self.level = 1 + self.score // 500

    def draw(self, screen):
        screen.fill((10, 10, 20))
        for i in range(0, self.width, 40):
            for j in range(0, self.height, 40):
                pygame.draw.rect(screen, (15, 15, 28), (i, j, 20, 20))
        pygame.draw.circle(screen, (50, 200, 255), (self.player_x, self.player_y), self.player_r)
        pygame.draw.circle(screen, (100, 230, 255), (self.player_x, self.player_y), self.player_r - 4)
        for b in self.bullets:
            colors = [(255, 50, 50), (255, 150, 50), (255, 255, 50), (200, 50, 255)]
            pygame.draw.circle(screen, random.choice(colors), (int(b[0]), int(b[1])), b[4])
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Score: {self.score}  Level: {self.level}", True, (200, 200, 200)), (10, 10))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 10))
        if self.game_over:
            ov = pygame.font.Font(None, 56).render("HIT!", True, (255, 50, 50))
            screen.blit(ov, (self.width // 2 - 60, self.height // 2 - 40))
            screen.blit(font.render(f"Score: {self.score}", True, (200, 200, 200)), (self.width // 2 - 50, self.height // 2 + 10))
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
