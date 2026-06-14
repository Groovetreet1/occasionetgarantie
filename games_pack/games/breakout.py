import pygame
import math

class BreakoutGame:
    def __init__(self):
        self.width = 700
        self.height = 550
        self.reset()

    def reset(self):
        self.paddle_w = 100
        self.paddle_h = 14
        self.paddle_x = self.width // 2 - self.paddle_w // 2
        self.paddle_y = self.height - 35
        self.ball_x = self.width // 2
        self.ball_y = self.height - 55
        self.ball_dx = 4
        self.ball_dy = -5
        self.radius = 8
        self.bricks = []
        self.score = 0
        self.lives = 3
        self.game_over = False
        self.won = False
        self.launched = False
        brick_w, brick_h = 70, 22
        colors = [(255, 50, 50), (255, 150, 50), (255, 255, 50), (50, 255, 50), (50, 150, 255)]
        for row in range(5):
            for col in range(10):
                x = 5 + col * (brick_w + 5)
                y = 30 + row * (brick_h + 5)
                self.bricks.append([x, y, brick_w, brick_h, colors[row]])

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and self.game_over:
                self.reset()
            if (event.key == pygame.K_SPACE or event.key == pygame.K_UP) and not self.launched:
                self.launched = True

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] and self.paddle_x > 0:
            self.paddle_x -= 6
        if keys[pygame.K_RIGHT] and self.paddle_x < self.width - self.paddle_w:
            self.paddle_x += 6
        if not self.launched:
            self.ball_x = self.paddle_x + self.paddle_w // 2
            self.ball_y = self.paddle_y - self.radius
            return
        self.ball_x += self.ball_dx
        self.ball_y += self.ball_dy

        if self.ball_x <= self.radius or self.ball_x >= self.width - self.radius:
            self.ball_dx *= -1
            self.ball_x = max(self.radius, min(self.width - self.radius, self.ball_x))
        if self.ball_y <= self.radius:
            self.ball_dy *= -1
            self.ball_y = self.radius

        if (self.paddle_x <= self.ball_x <= self.paddle_x + self.paddle_w and
            self.paddle_y - self.radius <= self.ball_y <= self.paddle_y + self.radius + 2):
            self.ball_dy = -abs(self.ball_dy)
            rel_x = (self.ball_x - self.paddle_x) / self.paddle_w
            self.ball_dx = int((rel_x - 0.5) * 8)
            if self.ball_dx == 0:
                self.ball_dx = 1 if rel_x > 0.5 else -1
            self.ball_y = self.paddle_y - self.radius

        if self.ball_y > self.height:
            self.lives -= 1
            if self.lives <= 0:
                self.game_over = True
            else:
                self.launched = False
                self.ball_x = self.paddle_x + self.paddle_w // 2
                self.ball_y = self.paddle_y - self.radius
                self.ball_dx = 4
                self.ball_dy = -5
            return

        for b in self.bricks[:]:
            if (b[0] <= self.ball_x <= b[0] + b[2] and
                b[1] <= self.ball_y <= b[1] + b[3]):
                self.bricks.remove(b)
                self.score += 10
                dx = self.ball_x - (b[0] + b[2] // 2)
                dy = self.ball_y - (b[1] + b[3] // 2)
                if abs(dx) > abs(dy):
                    self.ball_dx *= -1
                else:
                    self.ball_dy *= -1
                break

        if not self.bricks:
            self.won = True
            self.game_over = True

    def draw(self, screen):
        screen.fill((10, 10, 25))
        for b in self.bricks:
            pygame.draw.rect(screen, b[4], (b[0], b[1], b[2], b[3]))
            pygame.draw.rect(screen, (255, 255, 255), (b[0], b[1], b[2], b[3]), 1)
        pygame.draw.rect(screen, (200, 200, 200), (self.paddle_x, self.paddle_y, self.paddle_w, self.paddle_h))
        pygame.draw.circle(screen, (255, 255, 255), (int(self.ball_x), int(self.ball_y)), self.radius)
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Score: {self.score}  Lives: {self.lives}", True, (200, 200, 200)), (10, 5))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 5))
        if not self.launched and not self.game_over:
            screen.blit(font.render("Press SPACE to launch", True, (0, 255, 255)), (self.width // 2 - 90, self.height // 2))
        if self.game_over:
            msg = "YOU WIN!" if self.won else "GAME OVER"
            color = (0, 255, 0) if self.won else (255, 50, 50)
            ov = pygame.font.Font(None, 56).render(msg, True, color)
            screen.blit(ov, (self.width // 2 - 100, self.height // 2 - 40))
            screen.blit(font.render("Press R to restart", True, (200, 200, 200)), (self.width // 2 - 80, self.height // 2 + 10))

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
