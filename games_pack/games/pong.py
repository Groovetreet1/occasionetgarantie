import pygame
import random
import math

class PongGame:
    def __init__(self):
        self.width = 800
        self.height = 500
        self.reset()

    def reset(self):
        self.paddle_h = 80
        self.paddle_w = 12
        self.player_y = self.height // 2 - self.paddle_h // 2
        self.ai_y = self.height // 2 - self.paddle_h // 2
        self.ball_x = self.width // 2
        self.ball_y = self.height // 2
        self.ball_dx = 5 * random.choice([-1, 1])
        self.ball_dy = 5 * random.choice([-1, 1])
        self.speed = 5
        self.score_p = 0
        self.score_a = 0
        self.game_over = False
        self.winner = ""

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and self.game_over:
                self.reset()
            if event.key == pygame.K_SPACE and self.game_over:
                self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP] and self.player_y > 0:
            self.player_y -= 6
        if keys[pygame.K_DOWN] and self.player_y < self.height - self.paddle_h:
            self.player_y += 6

        target = self.ball_y - self.paddle_h // 2
        if self.ai_y < target - 10:
            self.ai_y += 4
        elif self.ai_y > target + 10:
            self.ai_y -= 4
        self.ai_y = max(0, min(self.height - self.paddle_h, self.ai_y))

        self.ball_x += self.ball_dx
        self.ball_y += self.ball_dy

        if self.ball_y <= 0 or self.ball_y >= self.height:
            self.ball_dy *= -1
            self.ball_y = max(1, min(self.height - 1, self.ball_y))

        if self.ball_x <= self.paddle_w:
            if self.player_y <= self.ball_y <= self.player_y + self.paddle_h:
                self.ball_dx = abs(self.ball_dx)
                self.ball_x = self.paddle_w + 1
                hit = (self.ball_y - (self.player_y + self.paddle_h // 2)) / (self.paddle_h // 2)
                self.ball_dy += hit * 2
                mag = math.sqrt(self.ball_dx**2 + self.ball_dy**2)
                self.ball_dx = self.ball_dx / mag * (self.speed + 0.5)
                self.ball_dy = self.ball_dy / mag * (self.speed + 0.5)
            else:
                self.score_a += 1
                if self.score_a >= 5:
                    self.game_over = True
                    self.winner = "AI Wins!"
                else:
                    self.ball_x, self.ball_y = self.width // 2, self.height // 2
                    self.ball_dx = 5 * random.choice([-1, 1])
                    self.ball_dy = 5 * random.choice([-1, 1])

        if self.ball_x >= self.width - self.paddle_w:
            if self.ai_y <= self.ball_y <= self.ai_y + self.paddle_h:
                self.ball_dx = -abs(self.ball_dx)
                self.ball_x = self.width - self.paddle_w - 1
                hit = (self.ball_y - (self.ai_y + self.paddle_h // 2)) / (self.paddle_h // 2)
                self.ball_dy += hit * 2
                mag = math.sqrt(self.ball_dx**2 + self.ball_dy**2)
                self.ball_dx = self.ball_dx / mag * (self.speed + 0.5)
                self.ball_dy = self.ball_dy / mag * (self.speed + 0.5)
            else:
                self.score_p += 1
                if self.score_p >= 5:
                    self.game_over = True
                    self.winner = "You Win!"
                else:
                    self.ball_x, self.ball_y = self.width // 2, self.height // 2
                    self.ball_dx = 5 * random.choice([-1, 1])
                    self.ball_dy = 5 * random.choice([-1, 1])

    def draw(self, screen):
        screen.fill((10, 10, 20))
        for i in range(0, self.height, 15):
            pygame.draw.rect(screen, (40, 40, 60), (self.width // 2 - 2, i, 4, 8))
        pygame.draw.rect(screen, (255, 255, 255), (0, self.player_y, self.paddle_w, self.paddle_h))
        pygame.draw.rect(screen, (255, 100, 100), (self.width - self.paddle_w, self.ai_y, self.paddle_w, self.paddle_h))
        pygame.draw.circle(screen, (255, 255, 100), (int(self.ball_x), int(self.ball_y)), 8)
        font = pygame.font.Font(None, 48)
        screen.blit(font.render(str(self.score_p), True, (200, 200, 200)), (self.width // 2 - 60, 20))
        screen.blit(font.render(str(self.score_a), True, (200, 200, 200)), (self.width // 2 + 40, 20))
        screen.blit(font.render("PONG", True, (80, 80, 120)), (self.width // 2 - 50, 60))
        if self.game_over:
            ov = font.render(self.winner, True, (255, 255, 0))
            screen.blit(ov, (self.width // 2 - 80, self.height // 2 - 30))
            s = pygame.font.Font(None, 30).render("Press R or SPACE to restart", True, (200, 200, 200))
            screen.blit(s, (self.width // 2 - 120, self.height // 2 + 20))
        pygame.display.set_caption("Pong - Q:Menu")

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
