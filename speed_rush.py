import pygame
import random
import math
import sys

pygame.init()

SCREEN_WIDTH = 500
SCREEN_HEIGHT = 750
FPS = 60

WHITE = (255, 255, 255)
BLACK = (10, 10, 15)
GRAY = (80, 80, 90)
DARK_GRAY = (30, 30, 40)
RED = (255, 40, 40)
GREEN = (50, 255, 100)
YELLOW = (255, 220, 50)

LEVEL_COLORS = [
    (60, 180, 255), (50, 220, 120), (255, 200, 50), (255, 100, 50),
    (200, 50, 255), (255, 50, 150), (50, 255, 200), (255, 150, 50),
    (100, 200, 255), (255, 50, 50),
]

screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Speed Rush - 2D Racing")
clock = pygame.time.Clock()
font_large = pygame.font.Font(None, 72)
font_big = pygame.font.Font(None, 48)
font_med = pygame.font.Font(None, 36)
font_sml = pygame.font.Font(None, 24)
font_tny = pygame.font.Font(None, 18)

LANE_COUNT = 4
LANE_WIDTH = SCREEN_WIDTH // LANE_COUNT

CAR_W = 46
CAR_H = 82
HIT_W = 34
HIT_H = 68

TRUCK_W = 54
TRUCK_H = 98
TRUCK_HIT_W = 42
TRUCK_HIT_H = 84

BIKE_W = 32
BIKE_H = 56
BIKE_HIT_W = 20
BIKE_HIT_H = 42

def glow_surf(color, radius=24):
    s = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
    for i in range(radius, 0, -1):
        a = int(35 * (i / radius))
        pygame.draw.circle(s, (*color[:3], a), (radius, radius), i)
    return s

def draw_car_body(surf, c1, c2):
    w, h = CAR_W, CAR_H
    bw, bh = w * 0.82, h * 0.92
    bx, by = (w - bw) / 2, h * 0.06
    pts = [
        (bx + bw*0.18, by), (bx + bw*0.82, by),
        (bx + bw, by + bh*0.2), (bx + bw, by + bh*0.7),
        (bx + bw*0.92, by + bh*0.85), (bx + bw*0.5, by + bh),
        (bx + bw*0.08, by + bh*0.85), (bx, by + bh*0.7), (bx, by + bh*0.2),
    ]
    pygame.draw.polygon(surf, c2, pts)
    pts2 = [
        (bx + bw*0.21, by + 2), (bx + bw*0.79, by + 2),
        (bx + bw*0.96, by + bh*0.22), (bx + bw*0.96, by + bh*0.68),
        (bx + bw*0.88, by + bh*0.82), (bx + bw*0.5, by + bh*0.96),
        (bx + bw*0.12, by + bh*0.82), (bx + bw*0.04, by + bh*0.68),
        (bx + bw*0.04, by + bh*0.22),
    ]
    pygame.draw.polygon(surf, c1, pts2)
    wins = [(bx + bw*0.25, by + bh*0.1), (bx + bw*0.75, by + bh*0.1),
            (bx + bw*0.65, by + bh*0.44), (bx + bw*0.35, by + bh*0.44)]
    pygame.draw.polygon(surf, (160, 210, 255), wins)
    rear = [(bx + bw*0.3, by + bh*0.54), (bx + bw*0.7, by + bh*0.54),
            (bx + bw*0.64, by + bh*0.72), (bx + bw*0.36, by + bh*0.72)]
    pygame.draw.polygon(surf, (110, 170, 230), rear)
    hl = [(bx, by + bh*0.14), (bx + bw*0.16, by + bh*0.1),
          (bx + bw*0.16, by + bh*0.28), (bx, by + bh*0.3)]
    hr = [(bx + bw, by + bh*0.14), (bx + bw*0.84, by + bh*0.1),
          (bx + bw*0.84, by + bh*0.28), (bx + bw, by + bh*0.3)]
    pygame.draw.polygon(surf, (255, 255, 210), hl)
    pygame.draw.polygon(surf, (255, 255, 210), hr)
    tl = [(bx, by + bh*0.7), (bx + bw*0.14, by + bh*0.74),
          (bx + bw*0.14, by + bh*0.88), (bx, by + bh*0.84)]
    tr = [(bx + bw, by + bh*0.7), (bx + bw*0.86, by + bh*0.74),
          (bx + bw*0.86, by + bh*0.88), (bx + bw, by + bh*0.84)]
    pygame.draw.polygon(surf, (255, 30, 30), tl)
    pygame.draw.polygon(surf, (255, 30, 30), tr)
    for wx, wy in [(bx + bw*0.06, by + bh*0.2), (bx + bw*0.94, by + bh*0.2),
                    (bx + bw*0.06, by + bh*0.72), (bx + bw*0.94, by + bh*0.72)]:
        r = int(bw * 0.11)
        pygame.draw.circle(surf, (25, 25, 30), (int(wx), int(wy)), r)
        pygame.draw.circle(surf, (55, 55, 60), (int(wx), int(wy)), r - 2)
        pygame.draw.circle(surf, (35, 35, 40), (int(wx), int(wy)), r - 5)
        for i in range(5):
            a = i * (2 * math.pi / 5)
            pygame.draw.line(surf, (75, 75, 80), (wx, wy),
                             (wx + math.cos(a) * (r - 2), wy + math.sin(a) * (r - 2)), 1)
    gr = [(bx + bw*0.36, by + bh*0.88), (bx + bw*0.64, by + bh*0.88),
          (bx + bw*0.6, by + bh), (bx + bw*0.4, by + bh)]
    pygame.draw.polygon(surf, (18, 18, 22), gr)
    sp = [(bx + bw*0.14, by + bh*0.92), (bx + bw*0.86, by + bh*0.92),
          (bx + bw*0.82, by + bh*0.98), (bx + bw*0.18, by + bh*0.98)]
    pygame.draw.polygon(surf, (18, 18, 22), sp)

class PlayerCar:
    def __init__(self):
        self.x = SCREEN_WIDTH // 2 - CAR_W // 2
        self.y = SCREEN_HEIGHT - 160
        self.speed = 6
        self.vx = 0
        self.vy = 0
        self.tilt = 0.0
        self.target_tilt = 0.0
        self.glow_r = 28

    def update(self, keys):
        self.vx = 0
        self.vy = 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.vx = -self.speed
            self.target_tilt = -0.15
        elif keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.vx = self.speed
            self.target_tilt = 0.15
        else:
            self.target_tilt = 0
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.vy = -self.speed
        elif keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.vy = self.speed
        self.tilt += (self.target_tilt - self.tilt) * 0.15
        self.x += self.vx
        self.y += self.vy
        self.x = max(10, min(SCREEN_WIDTH - CAR_W - 10, self.x))
        self.y = max(SCREEN_HEIGHT // 3, min(SCREEN_HEIGHT - 120, self.y))

    def draw(self, surface):
        g = glow_surf((255, 50, 100), self.glow_r)
        surface.blit(g, (self.x + CAR_W//2 - self.glow_r, self.y + CAR_H//2 - self.glow_r),
                     special_flags=pygame.BLEND_ALPHA_SDL2)
        g2 = glow_surf((50, 200, 255), self.glow_r - 8)
        surface.blit(g2, (self.x + CAR_W//2 - (self.glow_r - 8), self.y + CAR_H//2 - (self.glow_r - 8)),
                     special_flags=pygame.BLEND_ALPHA_SDL2)
        s = pygame.Surface((CAR_W + 8, CAR_H + 8), pygame.SRCALPHA)
        w, h = CAR_W, CAR_H
        bw = w * 0.88
        bh = h * 0.94
        bx = (w - bw) / 2
        by = h * 0.04
        c_top = (180, 40, 80)
        c_bot = (60, 15, 35)
        c_accent = (255, 80, 150)
        pts = [
            (bx + bw*0.15, by),
            (bx + bw*0.85, by),
            (bx + bw, by + bh*0.18),
            (bx + bw, by + bh*0.6),
            (bx + bw*0.9, by + bh*0.88),
            (bx + bw*0.5, by + bh),
            (bx + bw*0.1, by + bh*0.88),
            (bx, by + bh*0.6),
            (bx, by + bh*0.18),
        ]
        pygame.draw.polygon(s, c_bot, pts)
        pts2 = [
            (bx + bw*0.17, by + 2),
            (bx + bw*0.83, by + 2),
            (bx + bw*0.97, by + bh*0.2),
            (bx + bw*0.97, by + bh*0.58),
            (bx + bw*0.87, by + bh*0.85),
            (bx + bw*0.5, by + bh*0.97),
            (bx + bw*0.13, by + bh*0.85),
            (bx + bw*0.03, by + bh*0.58),
            (bx + bw*0.03, by + bh*0.2),
        ]
        pygame.draw.polygon(s, c_top, pts2)
        wins = [(bx + bw*0.22, by + bh*0.08), (bx + bw*0.78, by + bh*0.08),
                (bx + bw*0.68, by + bh*0.42), (bx + bw*0.32, by + bh*0.42)]
        pygame.draw.polygon(s, (180, 220, 255), wins)
        rear = [(bx + bw*0.28, by + bh*0.52), (bx + bw*0.72, by + bh*0.52),
                (bx + bw*0.66, by + bh*0.7), (bx + bw*0.34, by + bh*0.7)]
        pygame.draw.polygon(s, (120, 180, 240), rear)
        hl = [(bx, by + bh*0.12), (bx + bw*0.14, by + bh*0.08),
              (bx + bw*0.14, by + bh*0.24), (bx, by + bh*0.28)]
        hr = [(bx + bw, by + bh*0.12), (bx + bw*0.86, by + bh*0.08),
              (bx + bw*0.86, by + bh*0.24), (bx + bw, by + bh*0.28)]
        pygame.draw.polygon(s, (255, 150, 200), hl)
        pygame.draw.polygon(s, (255, 150, 200), hr)
        tl = [(bx, by + bh*0.62), (bx + bw*0.12, by + bh*0.66),
              (bx + bw*0.12, by + bh*0.86), (bx, by + bh*0.82)]
        tr = [(bx + bw, by + bh*0.62), (bx + bw*0.88, by + bh*0.66),
              (bx + bw*0.88, by + bh*0.86), (bx + bw, by + bh*0.82)]
        pygame.draw.polygon(s, (255, 200, 0), tl)
        pygame.draw.polygon(s, (255, 200, 0), tr)
        for wx, wy in [(bx + bw*0.04, by + bh*0.18), (bx + bw*0.96, by + bh*0.18),
                        (bx + bw*0.04, by + bh*0.7), (bx + bw*0.96, by + bh*0.7)]:
            r = int(bw * 0.12)
            pygame.draw.circle(s, (20, 20, 25), (int(wx), int(wy)), r)
            pygame.draw.circle(s, (100, 100, 100), (int(wx), int(wy)), r - 1)
            pygame.draw.circle(s, (50, 50, 55), (int(wx), int(wy)), r - 4)
            pygame.draw.circle(s, (180, 180, 180), (int(wx), int(wy)), 2)
            for i in range(6):
                a = i * (2 * math.pi / 6)
                pygame.draw.line(s, (140, 140, 140), (wx, wy),
                                 (wx + math.cos(a) * (r - 3), wy + math.sin(a) * (r - 3)), 1)
        gr = [(bx + bw*0.34, by + bh*0.86), (bx + bw*0.66, by + bh*0.86),
              (bx + bw*0.62, by + bh), (bx + bw*0.38, by + bh)]
        pygame.draw.polygon(s, (10, 10, 15), gr)
        sp = [(bx + bw*0.12, by + bh*0.9), (bx + bw*0.88, by + bh*0.9),
              (bx + bw*0.84, by + bh*0.98), (bx + bw*0.16, by + bh*0.98)]
        pygame.draw.polygon(s, (10, 10, 15), sp)
        nb = pygame.Surface((CAR_W + 8, CAR_H + 8), pygame.SRCALPHA)
        neon_w = 2
        for i in range(neon_w):
            pygame.draw.polygon(nb, (255, 50, 100, 60),
                [(bx + bw*0.17 - i, by + 2 - i),
                 (bx + bw*0.83 + i, by + 2 - i),
                 (bx + bw*0.97 + i, by + bh*0.2),
                 (bx + bw*0.97 + i, by + bh*0.58),
                 (bx + bw*0.87 + i, by + bh*0.85 + i),
                 (bx + bw*0.5, by + bh*0.97 + i),
                 (bx + bw*0.13 - i, by + bh*0.85 + i),
                 (bx + bw*0.03 - i, by + bh*0.58),
                 (bx + bw*0.03 - i, by + bh*0.2)], 1)
        s.blit(nb, (0, 0))
        stripe_s = pygame.Surface((CAR_W + 8, CAR_H + 8), pygame.SRCALPHA)
        pygame.draw.rect(stripe_s, (255, 255, 255, 40),
                        (bx + bw*0.43, by + bh*0.06, bw*0.14, bh*0.88), border_radius=2)
        s.blit(stripe_s, (0, 0))
        rot = pygame.transform.rotate(s, self.tilt * 180 / math.pi)
        r = rot.get_rect(center=(self.x + CAR_W // 2, self.y + CAR_H // 2))
        surface.blit(rot, r.topleft)

    def rect(self):
        pad_x = (CAR_W - HIT_W) // 2
        pad_y = (CAR_H - HIT_H) // 2
        return pygame.Rect(self.x + pad_x, self.y + pad_y, HIT_W, HIT_H)


VEHICLE_TYPES = ["car", "truck", "bike"]

def draw_truck_body(surf, c1, c2):
    w, h = TRUCK_W, TRUCK_H
    bw, bh = w * 0.88, h * 0.94
    bx, by = (w - bw) / 2, h * 0.04
    cab_h = bh * 0.35
    cargo_h = bh * 0.55
    pts = [
        (bx + bw*0.15, by), (bx + bw*0.55, by),
        (bx + bw*0.55, by + cab_h),
        (bx + bw*0.65, by + cab_h),
        (bx + bw*0.65, by), (bx + bw*0.85, by),
        (bx + bw, by + bh*0.08), (bx + bw, by + bh*0.5),
        (bx + bw*0.92, by + bh*0.7), (bx + bw*0.8, by + bh*0.92),
        (bx + bw*0.7, by + bh), (bx + bw*0.3, by + bh),
        (bx + bw*0.2, by + bh*0.92), (bx + bw*0.08, by + bh*0.7),
        (bx, by + bh*0.5), (bx, by + bh*0.08),
    ]
    pygame.draw.polygon(surf, c2, pts)
    cargo = [(bx + bw*0.03, by + bh*0.08), (bx + bw*0.55, by + bh*0.08),
             (bx + bw*0.55, by + cab_h - 4),
             (bx + bw*0.03, by + cab_h - 4)]
    pygame.draw.rect(surf, c1, (bx + bw*0.03, by + bh*0.08, bw*0.52, cab_h - 12), border_radius=2)
    cargo_box = [(bx + bw*0.6, by + bh*0.04), (bx + bw*0.97, by + bh*0.04),
                 (bx + bw*0.97, by + bh*0.92), (bx + bw*0.6, by + bh*0.92)]
    pygame.draw.polygon(surf, (55, 55, 60), cargo_box)
    pygame.draw.polygon(surf, (70, 70, 75),
        [(bx + bw*0.62, by + bh*0.06), (bx + bw*0.95, by + bh*0.06),
         (bx + bw*0.95, by + bh*0.9), (bx + bw*0.62, by + bh*0.9)])
    for i in range(4):
        lx = bx + bw*0.64 + i * (bw*0.29 / 4)
        pygame.draw.line(surf, (55, 55, 60), (lx, by + bh*0.06), (lx, by + bh*0.9), 1)
    wins = [(bx + bw*0.2, by + bh*0.02), (bx + bw*0.48, by + bh*0.02),
            (bx + bw*0.42, by + cab_h*0.7), (bx + bw*0.25, by + cab_h*0.7)]
    pygame.draw.polygon(surf, (150, 200, 255), wins)
    hl = [(bx + bw*0.5, by + bh*0.0), (bx + bw*0.56, by + bh*0.0),
          (bx + bw*0.56, by + cab_h*0.4), (bx + bw*0.5, by + cab_h*0.4)]
    pygame.draw.polygon(surf, (255, 255, 200), hl)
    hlx = [(bx + bw*0.0, by + bh*0.06), (bx + bw*0.08, by + bh*0.02),
           (bx + bw*0.12, by + bh*0.1), (bx + bw*0.0, by + bh*0.14)]
    pygame.draw.polygon(surf, (255, 255, 200), hlx)
    tl = [(bx + bw*0.6, by + bh*0.82), (bx + bw*0.78, by + bh*0.82),
          (bx + bw*0.82, by + bh*0.94), (bx + bw*0.6, by + bh*0.94)]
    pygame.draw.polygon(surf, (255, 30, 30), tl)
    for wx, wy in [(bx + bw*0.18, by + bh*0.18), (bx + bw*0.38, by + bh*0.18),
                    (bx + bw*0.7, by + bh*0.88), (bx + bw*0.9, by + bh*0.88)]:
        r = int(bw * 0.09)
        pygame.draw.circle(surf, (25, 25, 30), (int(wx), int(wy)), r)
        pygame.draw.circle(surf, (50, 50, 55), (int(wx), int(wy)), r - 2)
        pygame.draw.circle(surf, (35, 35, 40), (int(wx), int(wy)), r - 4)
    gr = [(bx + bw*0.22, by + bh*0.88), (bx + bw*0.4, by + bh*0.88),
          (bx + bw*0.38, by + bh), (bx + bw*0.24, by + bh)]
    pygame.draw.polygon(surf, (15, 15, 20), gr)

def draw_bike_body(surf, c1, c2):
    w, h = BIKE_W, BIKE_H
    tank_w = w * 0.5
    tank_h = h * 0.3
    tx = (w - tank_w) / 2
    ty = h * 0.05
    pts = [(tx - 2, ty + tank_h), (tx + tank_w + 2, ty + tank_h),
           (tx + tank_w * 0.8, ty + h * 0.08), (tx + tank_w * 0.2, ty + h * 0.08)]
    pygame.draw.polygon(surf, c2, pts)
    pts2 = [(tx, ty + tank_h - 2), (tx + tank_w, ty + tank_h - 2),
            (tx + tank_w * 0.78, ty + h * 0.1), (tx + tank_w * 0.22, ty + h * 0.1)]
    pygame.draw.polygon(surf, c1, pts2)
    seat_w = w * 0.22
    seat_h = h * 0.08
    sx = (w - seat_w) / 2
    sy = ty + tank_h + 2
    pygame.draw.ellipse(surf, (40, 40, 45), (sx, sy, seat_w, seat_h))
    tail_w = w * 0.15
    tail_h = h * 0.15
    tlx = (w - tail_w) / 2
    tly = sy + seat_h
    pygame.draw.ellipse(surf, c2, (tlx, tly, tail_w, tail_h))
    fork_h = h * 0.15
    fork_w = 3
    pygame.draw.line(surf, (100, 100, 100), (w//2 - fork_w, h*0.15), (w//2 - fork_w, h*0.3), 3)
    pygame.draw.line(surf, (100, 100, 100), (w//2 + fork_w, h*0.15), (w//2 + fork_w, h*0.3), 3)
    fender = [(tx - 3, ty + tank_h - 3), (tx + tank_w + 3, ty + tank_h - 3),
              (tx + tank_w + 3, ty + tank_h + 2), (tx - 3, ty + tank_h + 2)]
    pygame.draw.polygon(surf, (60, 60, 65), fender)
    hl = [(w//2 - 2, h*0.06), (w//2 + 2, h*0.06), (w//2, h*0.12)]
    pygame.draw.polygon(surf, (255, 255, 200), hl)
    tl = [(w//2 - 3, h*0.85), (w//2 + 3, h*0.85), (w//2, h*0.92)]
    pygame.draw.polygon(surf, (255, 30, 30), tl)
    for wx, wy in [(w*0.15, h*0.15), (w*0.85, h*0.15),
                    (w*0.18, h*0.75), (w*0.82, h*0.75)]:
        r = int(w * 0.09)
        pygame.draw.circle(surf, (20, 20, 25), (int(wx), int(wy)), r)
        pygame.draw.circle(surf, (60, 60, 65), (int(wx), int(wy)), r - 1)
        pygame.draw.circle(surf, (35, 35, 40), (int(wx), int(wy)), r - 3)
        for i in range(4):
            a = i * (2 * math.pi / 4)
            pygame.draw.line(surf, (80, 80, 85), (wx, wy),
                             (wx + math.cos(a) * (r - 2), wy + math.sin(a) * (r - 2)), 1)

class EnemyCar:
    all_colors = [
        (255, 70, 70), (255, 180, 40), (255, 70, 200),
        (60, 255, 140), (200, 90, 255), (255, 200, 80),
        (80, 200, 255), (255, 90, 90), (40, 255, 200),
        (255, 160, 40), (180, 40, 255), (40, 200, 255),
    ]

    def __init__(self, lane, base_speed, vtype="car"):
        self.vtype = vtype
        self.lane = lane
        self.color = random.choice(self.all_colors)
        self.dark = tuple(c // 2 for c in self.color)
        self.passed = False
        if vtype == "truck":
            self.w, self.h = TRUCK_W, TRUCK_H
            self.hit_w, self.hit_h = TRUCK_HIT_W, TRUCK_HIT_H
            self.speed = base_speed * random.uniform(0.4, 0.7)
            self.sway_amp = random.uniform(0.05, 0.15)
            self.glow_r = 26
        elif vtype == "bike":
            self.w, self.h = BIKE_W, BIKE_H
            self.hit_w, self.hit_h = BIKE_HIT_W, BIKE_HIT_H
            self.speed = base_speed * random.uniform(1.2, 1.8)
            self.sway_amp = random.uniform(0.6, 1.4)
            self.glow_r = 16
        else:
            self.w, self.h = CAR_W, CAR_H
            self.hit_w, self.hit_h = HIT_W, HIT_H
            self.speed = base_speed * random.uniform(0.7, 1.3)
            self.sway_amp = random.uniform(0.2, 0.6)
            self.glow_r = 20
        self.x = lane * LANE_WIDTH + (LANE_WIDTH - self.w) // 2
        self.y = -self.h - random.randint(20, 180)
        self.sway_freq = random.uniform(0.005, 0.02)
        self.sway_off = random.uniform(0, math.pi * 2)

    def update(self, scroll_speed):
        self.y += self.speed + scroll_speed * 0.25
        self.x += math.sin(self.y * self.sway_freq + self.sway_off) * self.sway_amp

    def draw(self, surface):
        if self.y < -self.h - 20 or self.y > SCREEN_HEIGHT + 40:
            return
        g = glow_surf(self.color, self.glow_r)
        surface.blit(g, (self.x + self.w//2 - self.glow_r, self.y + self.h//2 - self.glow_r),
                     special_flags=pygame.BLEND_ALPHA_SDL2)
        s = pygame.Surface((self.w + 8, self.h + 8), pygame.SRCALPHA)
        if self.vtype == "truck":
            draw_truck_body(s, self.color, self.dark)
        elif self.vtype == "bike":
            draw_bike_body(s, self.color, self.dark)
        else:
            draw_car_body(s, self.color, self.dark)
        surface.blit(s, (self.x - 4, self.y - 4))

    def rect(self):
        pad_x = (self.w - self.hit_w) // 2
        pad_y = (self.h - self.hit_h) // 2
        return pygame.Rect(self.x + pad_x, self.y + pad_y, self.hit_w, self.hit_h)


class RoadMarking:
    def __init__(self, y):
        self.y = y

    def update(self, speed):
        self.y += speed
        if self.y >= SCREEN_HEIGHT + 80:
            self.y -= (SCREEN_HEIGHT + 80) * 10

    def draw(self, surface):
        segment_h = SCREEN_HEIGHT // 8
        for row in range(-2, 12):
            yy = self.y + row * segment_h
            if yy < -segment_h or yy > SCREEN_HEIGHT + 20:
                continue
            for lane in range(1, LANE_COUNT):
                x = lane * LANE_WIDTH
                alpha = int(180 + 75 * math.sin(yy * 0.02))
                c = (min(255, alpha), min(255, alpha), min(255, alpha + 20))
                pygame.draw.line(surface, c, (x, yy), (x, yy + segment_h * 0.6), 3)
            if random.random() < 0.0003:
                pass


class RoadDecor:
    def __init__(self, y):
        self.y = y
        self.type = random.choice(["tree", "lamp", "tree", "lamp", "tree", "tree"])
        self.side = random.choice([-1, 1])
        self.color_var = random.uniform(0.8, 1.0)
        if self.type == "tree":
            self.trunk_h = random.randint(12, 18)
            self.canopy_r = random.randint(11, 16)
        else:
            self.pole_h = random.randint(26, 38)
        self.x_off = random.randint(16, 38)

    def update(self, speed):
        self.y += speed
        if self.y > SCREEN_HEIGHT + 80:
            self.y -= (SCREEN_HEIGHT + 120) * 8

    def draw(self, surface):
        if self.y < -60 or self.y > SCREEN_HEIGHT + 60:
            return
        cx = SCREEN_WIDTH // 2
        base_x = int(cx + self.side * (cx * 0.85 + self.x_off))
        base_x = max(4, min(SCREEN_WIDTH - 4, base_x))
        if self.type == "tree":
            cv = self.color_var
            tc = (50 + int(30*cv), 35 + int(20*cv), 18 + int(10*cv))
            gr = (20 + int(60*cv), 80 + int(90*cv), 20 + int(40*cv))
            gd = (15 + int(40*cv), 55 + int(60*cv), 15 + int(30*cv))
            hl = (60 + int(50*cv), 140 + int(80*cv), 50 + int(40*cv))
            r = self.canopy_r
            th = self.trunk_h
            pygame.draw.rect(surface, tc, (base_x - 2, self.y + r - 3, 4, th + 6))
            cs = pygame.Surface((r*2+4, r*2+4), pygame.SRCALPHA)
            pygame.draw.circle(cs, gd, (r+2, r+2), r)
            pygame.draw.circle(cs, gr, (r+1, r+1), r - 2)
            pygame.draw.circle(cs, hl, (r-1, r-2), r // 3)
            surface.blit(cs, (base_x - r - 2, self.y - 2))
        else:
            ph = self.pole_h
            pygame.draw.rect(surface, (48, 48, 52), (base_x - 2, self.y, 4, ph))
            pygame.draw.rect(surface, (58, 58, 62), (base_x - 1, self.y, 2, ph))
            pygame.draw.rect(surface, (68, 68, 72), (base_x - 4, self.y - 2, 8, 4), border_radius=1)
            pygame.draw.circle(surface, (255, 240, 200), (base_x, self.y - 3), 4)
            pygame.draw.circle(surface, (255, 255, 220), (base_x, self.y - 3), 2)
            gr = 18
            gs = pygame.Surface((gr*2, gr*2), pygame.SRCALPHA)
            br = int(35 + 25 * math.sin(pygame.time.get_ticks() * 0.003 + base_x))
            for i in range(gr, 0, -1):
                a = int(br * (i / gr) * 0.5)
                pygame.draw.circle(gs, (255, 230, 150, a), (gr, gr), i)
            surface.blit(gs, (base_x - gr, self.y - 3 - gr), special_flags=pygame.BLEND_ALPHA_SDL2)


class BackgroundStar:
    def __init__(self):
        self.x = random.randint(0, SCREEN_WIDTH)
        self.y = random.randint(0, SCREEN_HEIGHT)
        self.sz = random.uniform(1, 2.5)
        self.spd = random.uniform(0.3, 1.2)
        self.a = random.randint(80, 220)
        self.ph = random.uniform(0, math.pi * 2)

    def update(self):
        self.y += self.spd
        if self.y > SCREEN_HEIGHT:
            self.y = 0
            self.x = random.randint(0, SCREEN_WIDTH)

    def draw(self, surface):
        alpha = int(self.a * (0.5 + 0.5 * math.sin(pygame.time.get_ticks() * 0.002 + self.ph)))
        pygame.draw.circle(surface, (alpha, alpha, alpha),
                          (int(self.x), int(self.y)), max(1, int(self.sz)))


class Particle:
    def __init__(self, x, y, color, vx, vy, sz, life):
        self.x, self.y = x, y
        self.color = color
        self.vx, self.vy = vx, vy
        self.sz = sz
        self.life = life
        self.age = 0

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vx *= 0.96
        self.vy *= 0.96
        self.age += 1
        return self.age < self.life

    def draw(self, surface):
        a = int(255 * (1 - self.age / self.life))
        c = (*self.color[:3], a)
        s = pygame.Surface((int(self.sz) * 2, int(self.sz) * 2), pygame.SRCALPHA)
        pygame.draw.circle(s, c, (int(self.sz), int(self.sz)), int(self.sz))
        surface.blit(s, (self.x - self.sz, self.y - self.sz))


class Game:
    def __init__(self):
        self.reset()

    def reset(self):
        self.player = PlayerCar()
        self.enemies = []
        self.stars = [BackgroundStar() for _ in range(50)]
        self.marks = [RoadMarking(i * 60) for i in range(14)]
        self.decors = []
        for i in range(18):
            d = RoadDecor(i * (SCREEN_HEIGHT // 9))
            d.y = i * (SCREEN_HEIGHT // 9)
            self.decors.append(d)
        self.parts = []
        self.score = 0
        self.lives = 3
        self.level = 1
        self.combo = 0
        self.max_combo = 0
        self.scroll_speed = 3.0
        self.spawn_timer = 0
        self.spawn_delay = 55
        self.level_trans = 0
        self.go_delay = 0
        self.state = "menu"
        self.shake = 0

    def spawn_enemy(self):
        lanes = list(range(LANE_COUNT))
        occupied_lanes = set()
        for e in self.enemies:
            if -50 < e.y < SCREEN_HEIGHT // 2:
                occ = e.lane
                if e.vtype == "truck":
                    occupied_lanes.add(occ)
                    if occ + 1 < LANE_COUNT:
                        occupied_lanes.add(occ + 1)
                else:
                    occupied_lanes.add(occ)
        lanes = [l for l in lanes if l not in occupied_lanes]
        if not lanes:
            return
        lane = random.choice(lanes)
        base = 2.0 + self.level * 0.5
        wt = random.choices(
            VEHICLE_TYPES,
            weights=[0.45, 0.20, 0.35],
            k=1
        )[0]
        self.enemies.append(EnemyCar(lane, base, wt))

    def add_parts(self, x, y, color, n=20):
        for _ in range(n):
            a = random.uniform(0, math.pi * 2)
            spd = random.uniform(1, 5)
            self.parts.append(Particle(x, y, color,
                              math.cos(a) * spd, math.sin(a) * spd,
                              random.uniform(2, 5), random.randint(15, 35)))

    def crash(self):
        self.lives -= 1
        self.shake = 12
        self.add_parts(self.player.x + CAR_W // 2, self.player.y + CAR_H // 2,
                      (255, 200, 50), 35)
        self.player.x = SCREEN_WIDTH // 2 - CAR_W // 2
        self.player.y = SCREEN_HEIGHT - 160
        self.enemies.clear()
        self.combo = 0
        if self.lives <= 0:
            self.state = "gameover"
            self.go_delay = 90

    def level_up(self):
        if self.level < 10:
            self.level += 1
            self.scroll_speed = 3.0 + self.level * 0.45
            self.spawn_delay = max(18, 55 - self.level * 3)
            self.level_trans = 90
            self.add_parts(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2,
                          LEVEL_COLORS[(self.level - 1) % 10], 45)
            self.enemies.clear()

    def update(self):
        bg_update = self.state in ("playing", "gameover", "menu")
        if bg_update:
            for s in self.stars:
                s.update()
        if self.state == "playing":
            keys = pygame.key.get_pressed()
            self.player.update(keys)
            for m in self.marks:
                m.update(self.scroll_speed)
            for d in self.decors:
                d.update(self.scroll_speed)
            self.spawn_timer += 1
            if self.spawn_timer >= self.spawn_delay:
                self.spawn_timer = 0
                self.spawn_enemy()
            for e in self.enemies[:]:
                e.update(self.scroll_speed)
                if e.y > SCREEN_HEIGHT + 60:
                    if not e.passed:
                        e.passed = True
                        pts = 15 if e.vtype == "truck" else (5 if e.vtype == "bike" else 10)
                        self.score += pts + self.combo * 2
                        self.combo += 1
                        if self.combo > self.max_combo:
                            self.max_combo = self.combo
                        particle_color = (255, 200, 50) if e.vtype == "truck" else ((100, 200, 255) if e.vtype == "bike" else (100, 255, 100))
                        self.add_parts(e.x + e.w // 2, SCREEN_HEIGHT + 10, particle_color, 6)
                    self.enemies.remove(e)
            if self.level_trans > 0:
                self.level_trans -= 1
            elif self.score >= self.level * 200:
                self.level_up()
            for p in self.parts[:]:
                if not p.update():
                    self.parts.remove(p)
            if self.shake > 0:
                self.shake -= 1
            pr = self.player.rect()
            for e in self.enemies:
                if pr.colliderect(e.rect()):
                    self.crash()
                    break
        elif self.state == "menu":
            for m in self.marks:
                m.update(self.scroll_speed)
            for d in self.decors:
                d.update(self.scroll_speed)
        elif self.state == "gameover":
            self.go_delay -= 1
            if self.go_delay > 0:
                for p in self.parts[:]:
                    if not p.update():
                        self.parts.remove(p)
                for s in self.stars:
                    s.update()
            if self.go_delay < 0:
                self.go_delay = 0

    def draw_road(self, surf):
        sky1 = (8, 6, 20)
        sky2 = (18, 12, 35)
        gradient_rect(surf, sky1, sky2,
                     pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        ground_y = int(SCREEN_HEIGHT * 0.05)
        road_rect = pygame.Rect(0, ground_y, SCREEN_WIDTH, SCREEN_HEIGHT - ground_y)
        road_top = (22, 24, 32)
        road_bot = (40, 42, 55)
        gradient_rect(surf, road_top, road_bot, road_rect)
        for y in range(ground_y, SCREEN_HEIGHT, 4):
            shade = int(20 + 15 * math.sin(y * 0.05))
            c = (shade, shade, shade + 5)
            pygame.draw.line(surf, c, (4, y), (SCREEN_WIDTH - 4, y), 1)
        edge_g = pygame.Surface((6, SCREEN_HEIGHT), pygame.SRCALPHA)
        offset = (pygame.time.get_ticks() * 0.002) % (math.pi * 2)
        for i in range(6):
            a = int(40 + 35 * math.sin(offset + i * 0.5))
            pygame.draw.line(edge_g, (0, 150, 255, a), (i, 0), (i, SCREEN_HEIGHT))
        surf.blit(edge_g, (0, 0))
        edge_g2 = pygame.transform.flip(edge_g, True, False)
        surf.blit(edge_g2, (SCREEN_WIDTH - 6, 0))
        edge_l = pygame.Surface((4, SCREEN_HEIGHT - ground_y), pygame.SRCALPHA)
        for i in range(edge_l.get_height()):
            bright = int(150 + 80 * math.sin(i * 0.04 + offset))
            pygame.draw.line(edge_l, (255, 255, 255, min(255, bright)), (0, i), (3, i))
        surf.blit(edge_l, (0, ground_y))
        edge_r = pygame.transform.flip(edge_l, True, False)
        surf.blit(edge_r, (SCREEN_WIDTH - 4, ground_y))

    def draw_hud(self, surf):
        bg = pygame.Surface((SCREEN_WIDTH, 50), pygame.SRCALPHA)
        bg.fill((0, 0, 0, 170))
        surf.blit(bg, (0, 0))
        lc = LEVEL_COLORS[(self.level - 1) % 10]
        lt = font_sml.render(f"LEVEL {self.level}/10", True, lc)
        surf.blit(lt, (14, 8))
        st = font_sml.render(f"SCORE: {self.score}", True, WHITE)
        surf.blit(st, (14, 28))
        for i in range(self.lives):
            pygame.draw.polygon(surf, RED,
                [(SCREEN_WIDTH - 22 - i * 28, 18),
                 (SCREEN_WIDTH - 32 - i * 28, 36),
                 (SCREEN_WIDTH - 12 - i * 28, 36)])
        ct = font_sml.render(f"COMBO x{self.combo}", True, YELLOW)
        cr = ct.get_rect(midtop=(SCREEN_WIDTH // 2, 8))
        surf.blit(ct, cr)
        prog = min(1.0, self.score / (self.level * 200))
        bx, by = 120, 42
        bw, bh = SCREEN_WIDTH - 240, 6
        pygame.draw.rect(surf, (40, 40, 50), (bx, by, bw, bh), border_radius=3)
        if prog > 0:
            pygame.draw.rect(surf, lc, (bx, by, int(bw * prog), bh), border_radius=3)

    def draw(self):
        if self.state == "menu":
            self.draw_road(screen)
            for s in self.stars:
                s.draw(screen)
            for m in self.marks:
                m.draw(screen)
            for d in self.decors:
                d.draw(screen)
            ov = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            ov.fill((0, 0, 0, 140))
            screen.blit(ov, (0, 0))
            g = glow_surf((50, 150, 255), 60)
            screen.blit(g, (SCREEN_WIDTH//2 - 60, 140), special_flags=pygame.BLEND_ALPHA_SDL2)
            t1 = font_large.render("SPEED", True, (80, 200, 255))
            t2 = font_large.render("RUSH", True, (255, 220, 50))
            screen.blit(t1, t1.get_rect(center=(SCREEN_WIDTH//2, 200)))
            screen.blit(t2, t2.get_rect(center=(SCREEN_WIDTH//2, 270)))
            prev = PlayerCar()
            prev.x = SCREEN_WIDTH//2 - CAR_W//2
            prev.y = 375
            prev.draw(screen)
            pulse = 0.7 + 0.3 * math.sin(pygame.time.get_ticks() * 0.003)
            st = font_med.render("APPUYEZ SUR ESPACE", True,
                                (int(255*pulse), int(255*pulse), int(255*pulse)))
            screen.blit(st, st.get_rect(center=(SCREEN_WIDTH//2, 520)))
            i1 = font_sml.render("Fleches / ZQSD pour conduire", True, WHITE)
            screen.blit(i1, i1.get_rect(center=(SCREEN_WIDTH//2, 570)))
            i2 = font_tny.render("10 niveaux - Voitures, Camions, Motos", True, (150, 150, 160))
            screen.blit(i2, i2.get_rect(center=(SCREEN_WIDTH//2, 600)))
            pygame.draw.line(screen, (80, 80, 120), (100, 650), (SCREEN_WIDTH-100, 650), 1)
            cr = font_tny.render("2026 - Speed Rush", True, (80, 80, 100))
            screen.blit(cr, cr.get_rect(center=(SCREEN_WIDTH//2, 675)))
        elif self.state == "playing":
            self.draw_road(screen)
            for s in self.stars:
                s.draw(screen)
            for m in self.marks:
                m.draw(screen)
            for d in self.decors:
                d.draw(screen)
            for e in self.enemies:
                e.draw(screen)
            self.player.draw(screen)
            for p in self.parts:
                p.draw(screen)
            self.draw_hud(screen)
            if self.level_trans > 0:
                ov = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
                ov.fill((0, 0, 0, 100))
                screen.blit(ov, (0, 0))
                lc = LEVEL_COLORS[(self.level - 1) % 10]
                lt = font_big.render(f"NIVEAU {self.level}", True, lc)
                screen.blit(lt, lt.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 - 30)))
                prog = 1 - (self.level_trans / 90)
                bw, bh = 300, 8
                bx = (SCREEN_WIDTH - bw) // 2
                by = SCREEN_HEIGHT // 2 + 60
                pygame.draw.rect(screen, (40, 40, 50), (bx, by, bw, bh), border_radius=4)
                if prog > 0:
                    pygame.draw.rect(screen, lc, (bx, by, int(bw * prog), bh), border_radius=4)
        elif self.state == "gameover":
            self.draw_road(screen)
            for s in self.stars:
                s.draw(screen)
            for m in self.marks:
                m.draw(screen)
            for d in self.decors:
                d.draw(screen)
            for p in self.parts:
                p.draw(screen)
            self.draw_hud(screen)
            ov = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            ov.fill((0, 0, 0, 180))
            screen.blit(ov, (0, 0))
            gt = font_large.render("GAME OVER", True, RED)
            screen.blit(gt, gt.get_rect(center=(SCREEN_WIDTH//2, 200)))
            st = font_big.render(f"Score: {self.score}", True, WHITE)
            screen.blit(st, st.get_rect(center=(SCREEN_WIDTH//2, 290)))
            lt = font_med.render(f"Level: {self.level}/10", True, LEVEL_COLORS[(self.level-1)%10])
            screen.blit(lt, lt.get_rect(center=(SCREEN_WIDTH//2, 340)))
            ct = font_med.render(f"Best Combo: x{self.max_combo}", True, YELLOW)
            screen.blit(ct, ct.get_rect(center=(SCREEN_WIDTH//2, 390)))
            if self.go_delay <= 0:
                pulse = 0.7 + 0.3 * math.sin(pygame.time.get_ticks() * 0.003)
                rt = font_med.render("ESPACE pour recommencer", True,
                                    (int(255*pulse), int(255*pulse), int(255*pulse)))
                screen.blit(rt, rt.get_rect(center=(SCREEN_WIDTH//2, 490)))
                mt = font_sml.render("ECHAP pour le menu", True, GRAY)
                screen.blit(mt, mt.get_rect(center=(SCREEN_WIDTH//2, 540)))

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        if self.state in ("playing", "gameover"):
                            self.state = "menu"
                        else:
                            running = False
                    if event.key == pygame.K_SPACE:
                        if self.state == "menu":
                            self.reset()
                            self.state = "playing"
                        elif self.state == "gameover" and self.go_delay <= 0:
                            self.reset()
                            self.state = "playing"
            self.update()
            self.draw()
            pygame.display.flip()
            clock.tick(FPS)
        pygame.quit()
        sys.exit()


def gradient_rect(surface, c1, c2, rect, vertical=True):
    h, w = rect.height, rect.width
    for i in range(h if vertical else w):
        r = int(c1[0] * (1 - i/h) + c2[0] * i/h)
        g = int(c1[1] * (1 - i/h) + c2[1] * i/h)
        b = int(c1[2] * (1 - i/h) + c2[2] * i/h)
        if vertical:
            pygame.draw.line(surface, (r, g, b), (rect.x, rect.y + i), (rect.x + w, rect.y + i))
        else:
            pygame.draw.line(surface, (r, g, b), (rect.x + i, rect.y), (rect.x + i, rect.y + h))


if __name__ == "__main__":
    Game().run()
