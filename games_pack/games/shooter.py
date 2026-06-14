import pygame
import random
import math

class ShooterGame:
    def __init__(self):
        self.width = 700
        self.height = 500
        self.reset()

    def reset(self):
        self.px, self.py = self.width // 2, self.height // 2
        self.pr = 15
        self.health = 100
        self.score = 0
        self.enemies = []
        self.bullets = []
        self.game_over = False
        self.wave = 0
        self.enemies_left = 0
        self.shoot_cooldown = 0
        self.start_wave()

    def start_wave(self):
        self.wave += 1
        self.enemies_left = 5 + self.wave * 2
        for _ in range(self.enemies_left):
            side = random.randint(0, 3)
            if side == 0:
                ex, ey = random.randint(0, self.width), -30
            elif side == 1:
                ex, ey = random.randint(0, self.width), self.height + 30
            elif side == 2:
                ex, ey = -30, random.randint(0, self.height)
            else:
                ex, ey = self.width + 30, random.randint(0, self.height)
            hp = 1 + self.wave // 3
            self.enemies.append([ex, ey, random.uniform(1, 2.5), hp])

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            dx -= 4
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            dx += 4
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            dy -= 4
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            dy += 4
        self.px = max(self.pr, min(self.width - self.pr, self.px + dx))
        self.py = max(self.pr, min(self.height - self.pr, self.py + dy))

        if self.shoot_cooldown > 0:
            self.shoot_cooldown -= 1
        if keys[pygame.K_SPACE] and self.shoot_cooldown == 0:
            mx, my = pygame.mouse.get_pos()
            angle = math.atan2(my - self.py, mx - self.px)
            self.bullets.append([self.px, self.py, math.cos(angle) * 8, math.sin(angle) * 8])
            self.shoot_cooldown = 10

        new_bullets = []
        for b in self.bullets:
            b[0] += b[2]
            b[1] += b[3]
            hit = False
            for e in self.enemies[:]:
                if math.hypot(b[0] - e[0], b[1] - e[1]) < 25:
                    e[3] -= 1
                    if e[3] <= 0:
                        self.enemies.remove(e)
                        self.score += 10
                        self.enemies_left -= 1
                    hit = True
                    break
            if not hit and 0 < b[0] < self.width and 0 < b[1] < self.height:
                new_bullets.append(b)
        self.bullets = new_bullets

        for e in self.enemies:
            angle = math.atan2(self.py - e[1], self.px - e[0])
            e[0] += math.cos(angle) * e[2]
            e[1] += math.sin(angle) * e[2]
            if math.hypot(e[0] - self.px, e[1] - self.py) < self.pr + 15:
                self.health -= 10
                self.enemies.remove(e)
                if self.health <= 0:
                    self.game_over = True
                    return

        if self.enemies_left <= 0 and not self.enemies:
            self.start_wave()

    def draw(self, screen):
        screen.fill((15, 10, 20))
        for x in range(0, self.width, 30):
            for y in range(0, self.height, 30):
                if (x + y) % 60 == 0:
                    pygame.draw.rect(screen, (20, 15, 25), (x, y, 30, 30))
        pygame.draw.circle(screen, (0, 200, 255), (self.px, self.py), self.pr)
        pygame.draw.circle(screen, (100, 230, 255), (self.px, self.py), self.pr - 4)
        mx, my = pygame.mouse.get_pos()
        pygame.draw.line(screen, (255, 255, 100), (self.px, self.py), (mx, my), 2)
        for b in self.bullets:
            pygame.draw.circle(screen, (255, 255, 0), (int(b[0]), int(b[1])), 4)
        for e in self.enemies:
            color = (255, 50, 50) if e[3] <= 1 else (255, 150, 50)
            pygame.draw.circle(screen, color, (int(e[0]), int(e[1])), 18)
            pygame.draw.circle(screen, (255, 0, 0), (int(e[0]), int(e[1])), 12)
        font = pygame.font.Font(None, 24)
        screen.blit(font.render(f"Wave: {self.wave}  Score: {self.score}", True, (200, 200, 200)), (10, 10))
        bar_w = 200
        bar_h = 16
        pygame.draw.rect(screen, (60, 20, 20), (self.width - bar_w - 10, 10, bar_w, bar_h))
        pygame.draw.rect(screen, (0, 255, 50), (self.width - bar_w - 10, 10, int(bar_w * self.health / 100), bar_h))
        screen.blit(font.render(f"HP: {self.health}", True, (255, 255, 255)), (self.width - bar_w - 5, 30))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, self.height - 25))
        if self.game_over:
            ov = pygame.font.Font(None, 56).render("DEFEATED", True, (255, 50, 50))
            screen.blit(ov, (self.width // 2 - 120, self.height // 2 - 40))
            screen.blit(font.render(f"Wave {self.wave}  Score: {self.score}", True, (200, 200, 200)), (self.width // 2 - 80, self.height // 2 + 10))
            screen.blit(font.render("Press R to restart", True, (200, 200, 200)), (self.width // 2 - 80, self.height // 2 + 35))

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
