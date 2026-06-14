import pygame
import random

class RacingGame:
    def __init__(self):
        self.width = 400
        self.height = 700
        self.reset()

    def reset(self):
        self.car_x = self.width // 2 - 25
        self.car_y = self.height - 120
        self.car_w, self.car_h = 40, 70
        self.road_w = 300
        self.road_x = (self.width - self.road_w) // 2
        self.lane_w = self.road_w // 3
        self.obstacles = []
        self.score = 0
        self.speed = 5
        self.game_over = False
        self.spawn_timer = 0

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()

    def update(self):
        if self.game_over:
            return
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] and self.car_x > self.road_x:
            self.car_x -= 5
        if keys[pygame.K_RIGHT] and self.car_x < self.road_x + self.road_w - self.car_w:
            self.car_x += 5
        if keys[pygame.K_UP] and self.speed < 10:
            self.speed += 0.2
        if keys[pygame.K_DOWN] and self.speed > 3:
            self.speed -= 0.2

        self.spawn_timer += 1
        if self.spawn_timer >= max(20, 60 - self.score // 5):
            self.spawn_timer = 0
            lane = random.randint(0, 2)
            ox = self.road_x + lane * self.lane_w + (self.lane_w - 35) // 2
            oh = random.randint(50, 80)
            self.obstacles.append([ox, -oh, 35, oh])

        new_obs = []
        for o in self.obstacles:
            o[1] += self.speed
            if o[1] < self.height:
                new_obs.append(o)
        self.obstacles = new_obs

        for o in self.obstacles:
            if (self.car_x < o[0] + o[2] and self.car_x + self.car_w > o[0] and
                self.car_y < o[1] + o[3] and self.car_y + self.car_h > o[1]):
                self.game_over = True
                return

        self.score += 0.1

    def draw(self, screen):
        screen.fill((20, 30, 20))
        road_rect = (self.road_x, 0, self.road_w, self.height)
        pygame.draw.rect(screen, (40, 40, 40), road_rect)
        pygame.draw.rect(screen, (255, 255, 0), road_rect, 3)
        for i in range(0, self.height, 40):
            pygame.draw.rect(screen, (255, 255, 255), (self.width // 2 - 2, i, 4, 20))
        for i in range(1, 3):
            lx = self.road_x + i * self.lane_w
            pygame.draw.line(screen, (150, 150, 150), (lx, 0), (lx, self.height), 2)
        pygame.draw.rect(screen, (50, 100, 255), (self.car_x, self.car_y, self.car_w, self.car_h))
        pygame.draw.rect(screen, (80, 150, 255), (self.car_x + 5, self.car_y + 5, 8, 15))
        pygame.draw.rect(screen, (80, 150, 255), (self.car_x + 27, self.car_y + 5, 8, 15))
        for o in self.obstacles:
            r, g = random.randint(150, 255), random.randint(0, 100)
            pygame.draw.rect(screen, (r, g, 0), o)
        font = pygame.font.Font(None, 28)
        screen.blit(font.render(f"Score: {int(self.score)}  Speed: {int(self.speed)}", True, (200, 200, 200)), (10, 10))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 10))
        if self.game_over:
            ov = pygame.font.Font(None, 56).render("CRASH!", True, (255, 50, 50))
            screen.blit(ov, (self.width // 2 - 80, self.height // 2 - 60))
            screen.blit(font.render(f"Final Score: {int(self.score)}", True, (200, 200, 200)), (self.width // 2 - 70, self.height // 2))
            screen.blit(font.render("Press R to restart", True, (200, 200, 200)), (self.width // 2 - 80, self.height // 2 + 30))

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
