import pygame
import random

class TicTacToeGame:
    def __init__(self):
        self.cell_size = 120
        self.grid_size = self.cell_size * 3
        self.width = self.grid_size
        self.height = self.grid_size + 50
        self.reset()

    def reset(self):
        self.board = [""] * 9
        self.turn = "X"
        self.player_symbol = "X"
        self.ai_symbol = "O"
        self.game_over = False
        self.winner = None
        self.mode = "ai"

    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r and self.game_over:
                self.reset()
        if event.type == pygame.MOUSEBUTTONDOWN and not self.game_over:
            mx, my = event.pos
            if my < 50:
                return
            col = mx // self.cell_size
            row = (my - 50) // self.cell_size
            if 0 <= col < 3 and 0 <= row < 3:
                idx = row * 3 + col
                if self.board[idx] == "":
                    self.board[idx] = self.turn
                    if self.check_win(self.turn):
                        self.winner = self.turn
                        self.game_over = True
                    elif "" not in self.board:
                        self.game_over = True
                        self.winner = "draw"
                    else:
                        self.turn = self.ai_symbol if self.turn == self.player_symbol else self.player_symbol
                        if self.mode == "ai" and self.turn == self.ai_symbol and not self.game_over:
                            self.ai_move()

    def ai_move(self):
        best_score = -float("inf")
        best_move = None
        for i in range(9):
            if self.board[i] == "":
                self.board[i] = self.ai_symbol
                score = self.minimax(False)
                self.board[i] = ""
                if score > best_score:
                    best_score = score
                    best_move = i
        if best_move is not None:
            self.board[best_move] = self.ai_symbol
            if self.check_win(self.ai_symbol):
                self.winner = self.ai_symbol
                self.game_over = True
            elif "" not in self.board:
                self.game_over = True
                self.winner = "draw"
            else:
                self.turn = self.player_symbol

    def minimax(self, is_maximizing):
        if self.check_win(self.ai_symbol):
            return 1
        if self.check_win(self.player_symbol):
            return -1
        if "" not in self.board:
            return 0
        if is_maximizing:
            best = -float("inf")
            for i in range(9):
                if self.board[i] == "":
                    self.board[i] = self.ai_symbol
                    best = max(best, self.minimax(False))
                    self.board[i] = ""
            return best
        else:
            best = float("inf")
            for i in range(9):
                if self.board[i] == "":
                    self.board[i] = self.player_symbol
                    best = min(best, self.minimax(True))
                    self.board[i] = ""
            return best

    def check_win(self, symbol):
        wins = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]
        return any(all(self.board[i] == symbol for i in combo) for combo in wins)

    def update(self):
        pass

    def draw(self, screen):
        screen.fill((10, 10, 20))
        font = pygame.font.Font(None, 36)
        screen.blit(font.render(f"Turn: {self.turn}", True, (200, 200, 200)), (10, 10))
        screen.blit(font.render("Q:Menu", True, (100, 100, 100)), (self.width - 90, 10))
        surf = pygame.Surface((self.grid_size, self.grid_size))
        surf.fill((20, 20, 35))
        for i in range(1, 3):
            pygame.draw.line(surf, (60, 60, 100), (i * self.cell_size, 0), (i * self.cell_size, self.grid_size), 3)
            pygame.draw.line(surf, (60, 60, 100), (0, i * self.cell_size), (self.grid_size, i * self.cell_size), 3)
        for i in range(9):
            x = (i % 3) * self.cell_size
            y = (i // 3) * self.cell_size
            if self.board[i] == "X":
                pygame.draw.line(surf, (255, 100, 100), (x + 20, y + 20), (x + self.cell_size - 20, y + self.cell_size - 20), 5)
                pygame.draw.line(surf, (255, 100, 100), (x + self.cell_size - 20, y + 20), (x + 20, y + self.cell_size - 20), 5)
            elif self.board[i] == "O":
                pygame.draw.circle(surf, (100, 200, 255), (x + self.cell_size // 2, y + self.cell_size // 2), self.cell_size // 2 - 20, 5)
        screen.blit(surf, (0, 50))
        if self.game_over:
            if self.winner == "draw":
                msg = "DRAW!"
                color = (255, 255, 0)
            elif self.winner == self.player_symbol:
                msg = "YOU WIN!"
                color = (0, 255, 0)
            else:
                msg = "AI WINS!"
                color = (255, 50, 50)
            ov = pygame.font.Font(None, 56).render(msg, True, color)
            screen.blit(ov, (self.width // 2 - 110, self.grid_size // 2 - 20))
            s = pygame.font.Font(None, 24).render("Press R to restart", True, (200, 200, 200))
            screen.blit(s, (self.width // 2 - 80, self.grid_size // 2 + 30))

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
