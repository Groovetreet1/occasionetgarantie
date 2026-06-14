import pygame
import random
from enum import Enum

class Direction(Enum):
    UP = (0, -1)
    DOWN = (0, 1)
    LEFT = (-1, 0)
    RIGHT = (1, 0)

class SnakeGame:
    def __init__(self):
        self.cell_size = 20
        self.grid_w = 30
        self.grid_h = 25
        self.width = self.grid_w * self.cell_size
        self.height = self.grid_h * self.cell_size + 40
        self.reset()

    def reset(self):
        cx, cy = self.grid_w // 2, self.grid_h // 2
        self.snake = [(cx, cy), (cx - 1, cy), (cx - 2, cy)]
        self.direction = Direction.RIGHT
        self.next_dir = Direction.RIGHT
        self.score = 0
        self.game_over = False
        self.won = False
        self.spawn_food()

    def spawn_food(self):
        occupied = set(self.snake)
        free = [(x, y) for x in range(self.grid_w) for y in range(self.grid_h) if (x, y) not in occupied]
        if not free:
            self.won = True
            self.game_over = True
            return
        self.food = random.choice(free)

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN and not self.game_over:
            if event.key == pygame.K_UP and self.direction != Direction.DOWN:
                self.next_dir = Direction.UP
            elif event.key == pygame.K_DOWN and self.direction != Direction.UP:
                self.next_dir = Direction.DOWN
            elif event.key == pygame.K_LEFT and self.direction != Direction.RIGHT:
                self.next_dir = Direction.LEFT
            elif event.key == pygame.K_RIGHT and self.direction != Direction.LEFT:
                self.next_dir = Direction.RIGHT
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r and self.game_over:
            self.reset()

    def update(self):
        if self.game_over:
            return
        self.direction = self.next_dir
        head = self.snake[0]
        dx, dy = self.direction.value
        new_head = (head[0] + dx, head[1] + dy)
        if new_head == self.food:
            self.snake.insert(0, new_head)
            self.score += 1
            self.spawn_food()
        else:
            self.snake.insert(0, new_head)
            self.snake.pop()
            if (new_head[0] < 0 or new_head[0] >= self.grid_w or
                new_head[1] < 0 or new_head[1] >= self.grid_h or
                new_head in self.snake[1:]):
                self.game_over = True

    def draw(self, screen):
        screen.fill((10, 10, 20))
        surf = pygame.Surface((self.width, self.height - 40))
        surf.fill((15, 15, 30))
        for x, y in self.snake:
            rect = (x * self.cell_size, y * self.cell_size, self.cell_size - 1, self.cell_size - 1)
            pygame.draw.rect(surf, (0, 200, 80), rect)
            pygame.draw.rect(surf, (0, 255, 100), rect, 2)
        head = self.snake[0]
        pygame.draw.rect(surf, (0, 255, 120), (head[0] * self.cell_size, head[1] * self.cell_size, self.cell_size - 1, self.cell_size - 1))
        pygame.draw.circle(surf, (255, 255, 255), (head[0] * self.cell_size + 5, head[1] * self.cell_size + 5), 3)
        pygame.draw.circle(surf, (255, 255, 255), (head[0] * self.cell_size + 15, head[1] * self.cell_size + 5), 3)
        if self.food:
            fx, fy = self.food
            cx = fx * self.cell_size + self.cell_size // 2
            cy = fy * self.cell_size + self.cell_size // 2
            pygame.draw.circle(surf, (255, 50, 50), (cx, cy), self.cell_size // 2 - 2)
        screen.blit(surf, (0, 20))
        font = pygame.font.Font(None, 30)
        txt = font.render(f"Score: {self.score}  |  R=Restart  |  Q=Menu", True, (200, 200, 200))
        screen.blit(txt, (10, 5))
        if self.game_over:
            msg = "YOU WIN!" if self.won else "GAME OVER"
            color = (0, 255, 0) if self.won else (255, 50, 50)
            ov = font.render(f"{msg}  Press R to restart", True, color)
            screen.blit(ov, (self.width // 2 - 100, self.height // 2))

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
            clock.tick(10)
        return "menu"
