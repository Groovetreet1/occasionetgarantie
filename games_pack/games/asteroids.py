import pygame
import random
import math

class AsteroidsGame:
    def __init__(self):
        self.width = 800
        self.height = 600
        self.reset()

    def reset(self):
        self.px, self.py = self.width // 2, self.height // 2
        self.pvx, self.pvy = 0, 0
        self.angle = 0
        self.pr = 15
        self.bullets = []
        self.asteroids = []
        self.score = 0
        self.lives = 3
        self.game_over = False
        self.invulnerable = 0
        for _ in range(5):
            self.spawn_asteroid(3)

    def spawn_asteroid(self, size):
        sides = ["top", "bottom", "left", "right"]
        side = random.choice(sides)
        if side == "top":
            ax, ay = random.randint(0, self.width), -30
        elif side == "bottom":
            ax, ay = random.randint(0, self.width), self.height + 30
        elif side == "left":
            ax, ay = -30, random.randint(0, self.height)
        else:
            ax, ay = self.width + 30, random.randint(0, self.height)
        while math.hypot(ax - self.px, ay - self.py) < 100:
            ax += random.randint(-50, 50)
            ay += random.randint(-50, 50)
        vx = random.uniform(-1.5, 1.5) * (4 - size)
        vy = random.uniform(-1.5, 1.5) * (4 - size)
        verts = []
        for i in range(8):
            r = 20 * size + random.randint(-5, 5)
            a = math.radians(i * 45 + random.randint(-10, 10))
            verts.append((math.cos(a) * r, math.sin(a) * r))
        self.asteroids.append([ax, ay, vx, vy, verts, size])

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE and not self.game_over:
                self.bullets.append([self.px, self.py,
                    math.cos(math.radians(self.angle)) * 10,
                    math.sin(math.radians(self.angle)) * 10])
            if event.key == pygame.K_r and self.game_over:
                self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            self.angle = (self.angle - 5) % 360
        if keys[pygame.K_RIGHT]:
            self.angle = (self.angle + 5) % 360
        if keys[pygame.K_UP]:
            self.pvx += math.cos(math.radians(self.angle)) * 0.3
            self.pvy += math.sin(math.radians(self.angle)) * 0.3
        if keys[pygame.K_DOWN]:
            self.pvx *= 0.98
            self.pvy *= 0.98
        self.px += self.pvx
        self.py += self.pvy
        self.px %= self.width
        self.py %= self.height
        self.pvx *= 0.99
        self.pvy *= 0.99
        if self.invulnerable > 0:
            self.invulnerable -= 1

        for b in self.bullets[:]:
            b[0] += b[2]
            b[1] += b[3]
            if b[0] < 0 or b[0] > self.width or b[1] < 0 or b[1] > self.height:
                self.bullets.remove(b)
                continue
            hit = False
            for a in self.asteroids[:]:
                if math.hypot(b[0] - a[0], b[1] - a[1]) < 30 * a[5]:
                    self.asteroids.remove(a)
                    if b in self.bullets:
                        self.bullets.remove(b)
                    self.score += 20 * (4 - a[5])
                    if a[5] > 1:
                        for _ in range(2):
                            self.spawn_asteroid(a[5] - 1)
                    hit = True
                    break

        for a in self.asteroids:
            a[0] += a[2]
            a[1] += a[3]
            a[0] %= self.width
            a[1] %= self.height
            if self.invulnerable == 0 and math.hypot(a[0] - self.px, a[1] - self.py) < self.pr + 20 * a[5]:
                self.lives -= 1
                self.invulnerable = 90
                if self.lives <= 0:
                    self.game_over = True
                break

    def draw(self, screen):
        screen.fill((5, 5, 15))
        for _ in range(50):
            sx, sy = random.randint(0, self.width), random.randint(0, self.height)
            pygame.draw.circle(screen, (255, 255, 255), (sx, sy), 1)
        for a in self.asteroids:
            verts = [(a[0] + v[0], a[1] + v[1]) for v in a[4]]
            color = [(100, 100, 100), (140, 140, 140), (180, 180, 180)][min(a[5] - 1, 2)]
            pygame.draw.polygon(screen, color, verts)
            pygame.draw.polygon(screen, (200, 200, 200), verts, 2)
        ship_pts = []
        for i in range(3):
            a = math.radians(self.angle + i * 120 - 90)
            r = 20 if i == 0 else 12
            ship_pts.append((self.px + math.cos(a) * r, self.py + math.sin(a) * r))
        color = (255, 255, 255) if self.invulnerable % 6 < 3 else (255, 100, 100)
        pygame.draw.polygon(screen, color, ship_pts)
        pygame.draw.polygon(screen, (200, 200, 255), ship_pts, 2)
        for b in self.bullets:
            pygame.draw.circle(screen, (255, 255, 100), (int(b[0]), int(b[1])), 3)
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Score: {self.score}  Lives: {self.lives}", True, (200, 200, 200)), (10, 10))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 10))
        if self.game_over:
            ov = pygame.font.Font(None, 56).render("GAME OVER", True, (255, 50, 50))
            screen.blit(ov, (self.width // 2 - 140, self.height // 2 - 30))
            screen.blit(font.render(f"Final Score: {self.score}", True, (200, 200, 200)), (self.width // 2 - 70, self.height // 2 + 10))
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
