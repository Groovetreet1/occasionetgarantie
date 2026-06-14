import pygame
import random

class SpaceInvadersGame:
    def __init__(self):
        self.width = 700
        self.height = 600
        self.reset()

    def reset(self):
        self.player_x = self.width // 2 - 25
        self.player_y = self.height - 60
        self.player_w = 50
        self.bullets = []
        self.enemies = []
        self.enemy_bullets = []
        self.score = 0
        self.lives = 3
        self.game_over = False
        self.won = False
        self.shoot_cooldown = 0
        for row in range(5):
            for col in range(8):
                x = 80 + col * 70
                y = 40 + row * 50
                self.enemies.append([x, y, 1])
        self.enemy_dir = 1
        self.enemy_timer = 0

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] and self.player_x > 0:
            self.player_x -= 5
        if keys[pygame.K_RIGHT] and self.player_x < self.width - self.player_w:
            self.player_x += 5
        if self.shoot_cooldown > 0:
            self.shoot_cooldown -= 1
        if keys[pygame.K_SPACE] and self.shoot_cooldown == 0:
            self.bullets.append([self.player_x + self.player_w // 2 - 2, self.player_y, -8])
            self.shoot_cooldown = 12

        new_bullets = []
        for b in self.bullets:
            b[1] += b[2]
            hit = False
            for e in self.enemies[:]:
                if e[2] and abs(b[0] - (e[0] + 25)) < 25 and abs(b[1] - e[1]) < 20:
                    self.enemies.remove(e)
                    self.score += 10
                    hit = True
                    break
            if not hit and 0 < b[1] < self.height:
                new_bullets.append(b)
        self.bullets = new_bullets

        self.enemy_timer += 1
        if self.enemy_timer >= 30:
            self.enemy_timer = 0
            move_down = False
            for e in self.enemies:
                e[0] += self.enemy_dir * 8
                if e[0] < 10 or e[0] > self.width - 60:
                    move_down = True
            if move_down:
                self.enemy_dir *= -1
                for e in self.enemies:
                    e[1] += 15

        if random.randint(0, 40) == 0 and self.enemies:
            e = random.choice(self.enemies)
            self.enemy_bullets.append([e[0] + 25, e[1] + 20, 5])

        new_eb = []
        for b in self.enemy_bullets:
            b[1] += b[2]
            if (self.player_x <= b[0] <= self.player_x + self.player_w and
                self.player_y <= b[1] <= self.player_y + 30):
                self.lives -= 1
                if self.lives <= 0:
                    self.game_over = True
                continue
            if b[1] < self.height:
                new_eb.append(b)
        self.enemy_bullets = new_eb

        if not self.enemies:
            self.won = True
            self.game_over = True

    def draw(self, screen):
        screen.fill((5, 5, 20))
        stars = [(100, 30), (200, 80), (500, 50), (600, 120), (300, 150), (50, 200), (650, 250)]
        for sx, sy in stars:
            pygame.draw.circle(screen, (255, 255, 255), (sx, sy), 1)
        pygame.draw.rect(screen, (0, 200, 255), (self.player_x, self.player_y, self.player_w, 25))
        pygame.draw.rect(screen, (0, 150, 200), (self.player_x + 5, self.player_y - 5, 8, 10))
        pygame.draw.rect(screen, (0, 150, 200), (self.player_x + 37, self.player_y - 5, 8, 10))
        for b in self.bullets:
            pygame.draw.rect(screen, (255, 255, 0), (b[0], b[1], 4, 12))
        for e in self.enemies:
            color = [(255, 50, 50), (255, 150, 50), (200, 50, 255), (50, 200, 255), (50, 255, 50)]
            idx = min(e[1] // 50, 4)
            pygame.draw.rect(screen, color[idx], (e[0], e[1], 45, 30))
            pygame.draw.circle(screen, (0, 0, 0), (e[0] + 10, e[1] + 8), 4)
            pygame.draw.circle(screen, (0, 0, 0), (e[0] + 35, e[1] + 8), 4)
        for b in self.enemy_bullets:
            pygame.draw.rect(screen, (255, 0, 0), (b[0] - 2, b[1], 4, 10))
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Score: {self.score}  Lives: {self.lives}", True, (200, 200, 200)), (10, 10))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 10))
        if self.game_over:
            msg = "YOU SAVED EARTH!" if self.won else "GAME OVER"
            color = (0, 255, 0) if self.won else (255, 50, 50)
            ov = pygame.font.Font(None, 56).render(msg, True, color)
            screen.blit(ov, (self.width // 2 - 140, self.height // 2 - 60))
            screen.blit(font.render("Press R to restart", True, (200, 200, 200)), (self.width // 2 - 80, self.height // 2))

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
