import pygame
import random

class MazeGame:
    def __init__(self):
        self.cell = 28
        self.rows = 16
        self.cols = 24
        self.width = self.cols * self.cell
        self.height = self.rows * self.cell + 40
        self.reset()

    def reset(self):
        self.maze = [[1] * self.cols for _ in range(self.rows)]
        self.generate_maze(1, 1)
        self.player_x, self.player_y = 1, 1
        self.goal_x, self.goal_y = self.cols - 2, self.rows - 2
        self.maze[self.goal_y][self.goal_x] = 2
        self.moves = 0
        self.game_over = False
        self.won = False
        self.visited = [[False] * self.cols for _ in range(self.rows)]

    def generate_maze(self, cx, cy):
        self.maze[cy][cx] = 0
        dirs = [(0, -2), (0, 2), (-2, 0), (2, 0)]
        random.shuffle(dirs)
        for dx, dy in dirs:
            nx, ny = cx + dx, cy + dy
            if 0 < nx < self.cols - 1 and 0 < ny < self.rows - 1 and self.maze[ny][nx] == 1:
                self.maze[cy + dy // 2][cx + dx // 2] = 0
                self.generate_maze(nx, ny)

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and self.game_over:
                self.reset()
            if self.game_over or self.won:
                return
            nx, ny = self.player_x, self.player_y
            if event.key == pygame.K_UP:
                ny -= 1
            elif event.key == pygame.K_DOWN:
                ny += 1
            elif event.key == pygame.K_LEFT:
                nx -= 1
            elif event.key == pygame.K_RIGHT:
                nx += 1
            else:
                return
            if 0 <= nx < self.cols and 0 <= ny < self.rows and self.maze[ny][nx] != 1:
                self.player_x, self.player_y = nx, ny
                self.moves += 1
                self.visited[ny][nx] = True
                if (nx, ny) == (self.goal_x, self.goal_y):
                    self.won = True
                    self.game_over = True

    def update(self):
        pass

    def draw(self, screen):
        screen.fill((10, 10, 20))
        surf = pygame.Surface((self.width, self.height - 40))
        surf.fill((10, 10, 20))
        for y in range(self.rows):
            for x in range(self.cols):
                rect = (x * self.cell, y * self.cell, self.cell, self.cell)
                if self.maze[y][x] == 1:
                    pygame.draw.rect(surf, (40, 40, 80), rect)
                elif self.visited[y][x]:
                    pygame.draw.rect(surf, (15, 25, 15), rect)
                else:
                    pygame.draw.rect(surf, (15, 15, 25), rect)
        pygame.draw.rect(surf, (0, 255, 0), (self.goal_x * self.cell + 4, self.goal_y * self.cell + 4, self.cell - 8, self.cell - 8))
        pygame.draw.circle(surf, (255, 200, 50), (self.player_x * self.cell + self.cell // 2, self.player_y * self.cell + self.cell // 2), self.cell // 2 - 3)
        screen.blit(surf, (0, 25))
        font = pygame.font.Font(None, 24)
        screen.blit(font.render(f"Moves: {self.moves}", True, (200, 200, 200)), (10, 5))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 70, 5))
        if self.won:
            ov = pygame.font.Font(None, 48).render(f"MAZE COMPLETE! {self.moves} moves", True, (0, 255, 0))
            screen.blit(ov, (self.width // 2 - 180, self.height // 2 - 40))
            s = pygame.font.Font(None, 24).render("Press R to restart", True, (200, 200, 200))
            screen.blit(s, (self.width // 2 - 80, self.height // 2 + 10))

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
            clock.tick(30)
        return "menu"
