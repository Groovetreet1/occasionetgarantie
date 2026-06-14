import pygame
import random

SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[1, 1, 1], [0, 1, 0]],
]
COLORS = [(0, 240, 240), (255, 255, 0), (0, 0, 240), (240, 160, 0), (0, 240, 0), (240, 0, 0), (160, 0, 240)]

class TetrisGame:
    def __init__(self):
        self.cols = 10
        self.rows = 20
        self.cell = 28
        self.width = self.cols * self.cell + 150
        self.height = self.rows * self.cell
        self.reset()

    def reset(self):
        self.board = [[0] * self.cols for _ in range(self.rows)]
        self.score = 0
        self.game_over = False
        self.new_piece()

    def new_piece(self):
        idx = random.randint(0, len(SHAPES) - 1)
        self.piece_shape = [row[:] for row in SHAPES[idx]]
        self.piece_color = COLORS[idx]
        self.piece_x = self.cols // 2 - len(self.piece_shape[0]) // 2
        self.piece_y = 0
        if self.collides(self.piece_shape, self.piece_x, self.piece_y):
            self.game_over = True

    def collides(self, shape, px, py):
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell:
                    bx, by = px + x, py + y
                    if bx < 0 or bx >= self.cols or by >= self.rows or (by >= 0 and self.board[by][bx]):
                        return True
        return False

    def lock_piece(self):
        for y, row in enumerate(self.piece_shape):
            for x, cell in enumerate(row):
                if cell:
                    by = self.piece_y + y
                    if 0 <= by < self.rows:
                        bx = self.piece_x + x
                        if 0 <= bx < self.cols:
                            self.board[by][bx] = self.piece_color
        self.clear_lines()
        self.new_piece()

    def clear_lines(self):
        full = [i for i, row in enumerate(self.board) if all(row)]
        for i in sorted(full, reverse=True):
            del self.board[i]
            self.board.insert(0, [0] * self.cols)
        if len(full) == 1:
            self.score += 100
        elif len(full) == 2:
            self.score += 300
        elif len(full) == 3:
            self.score += 500
        elif len(full) == 4:
            self.score += 800

    def rotate(self):
        shape = list(zip(*self.piece_shape[::-1]))
        if not self.collides(shape, self.piece_x, self.piece_y):
            self.piece_shape = [list(row) for row in shape]

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and self.game_over:
                self.reset()
            if self.game_over:
                return
            if event.key == pygame.K_LEFT:
                if not self.collides(self.piece_shape, self.piece_x - 1, self.piece_y):
                    self.piece_x -= 1
            elif event.key == pygame.K_RIGHT:
                if not self.collides(self.piece_shape, self.piece_x + 1, self.piece_y):
                    self.piece_x += 1
            elif event.key == pygame.K_DOWN:
                if not self.collides(self.piece_shape, self.piece_x, self.piece_y + 1):
                    self.piece_y += 1
            elif event.key == pygame.K_UP:
                self.rotate()
            elif event.key == pygame.K_SPACE:
                while not self.collides(self.piece_shape, self.piece_x, self.piece_y + 1):
                    self.piece_y += 1
                self.lock_piece()

    def update(self):
        if self.game_over:
            return
        if not self.collides(self.piece_shape, self.piece_x, self.piece_y + 1):
            self.piece_y += 1
        else:
            self.lock_piece()

    def draw(self, screen):
        screen.fill((10, 10, 20))
        for y in range(self.rows):
            for x in range(self.cols):
                rect = (x * self.cell, y * self.cell, self.cell - 1, self.cell - 1)
                if self.board[y][x]:
                    pygame.draw.rect(screen, self.board[y][x], rect)
                else:
                    pygame.draw.rect(screen, (20, 20, 35), rect)
        for y, row in enumerate(self.piece_shape):
            for x, cell in enumerate(row):
                if cell:
                    rect = ((self.piece_x + x) * self.cell, (self.piece_y + y) * self.cell, self.cell - 1, self.cell - 1)
                    pygame.draw.rect(screen, self.piece_color, rect)
                    pygame.draw.rect(screen, (255, 255, 255), rect, 1)
        font = pygame.font.Font(None, 24)
        panel_x = self.cols * self.cell + 10
        screen.blit(font.render("TETRIS", True, (200, 200, 200)), (panel_x, 20))
        screen.blit(font.render(f"Score: {self.score}", True, (200, 200, 200)), (panel_x, 60))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (panel_x, 100))
        if self.game_over:
            ov = pygame.font.Font(None, 48).render("GAME OVER", True, (255, 50, 50))
            screen.blit(ov, (self.width // 2 - 130, self.height // 2 - 30))
            s = pygame.font.Font(None, 24).render("Press R to restart", True, (200, 200, 200))
            screen.blit(s, (self.width // 2 - 80, self.height // 2 + 10))

    def run(self, screen):
        clock = pygame.time.Clock()
        counter = 0
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    return "quit"
                if event.type == pygame.KEYDOWN and event.key == pygame.K_q:
                    return "menu"
                self.handle_event(event)
            counter += 1
            if counter >= 30:
                counter = 0
                self.update()
            self.draw(screen)
            pygame.display.flip()
            clock.tick(60)
        return "menu"
