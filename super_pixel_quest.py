#!/usr/bin/env python
import pygame
import numpy as np
import math
import random
import sys
import os
import logging
from datetime import datetime

SCREEN_W, SCREEN_H = 1000, 650
FPS = 60
TILE = 36
GRAVITY = 0.6
MAX_FALL = 13
PLAYER_W, PLAYER_H = 28, 40
GROUND_Y = SCREEN_H - 80
ACCEL = 0.45
FRICTION = 0.92
MAX_SPEED = 5.0
JUMP_POWER = -11.0
JUMP_HOLD = -0.3
JUMP_CUT = -7.0
JUMP_BUFFER = 5

pygame.init()
screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
pygame.display.set_caption("Super Pixel Quest 2D")
clock = pygame.time.Clock()
font_l = pygame.font.Font(None, 72)
font_m = pygame.font.Font(None, 36)
font_s = pygame.font.Font(None, 24)
font_xs = pygame.font.Font(None, 18)

# ------------------------------------------------------------------ SOUND
try:
    pygame.mixer.init(frequency=22050, size=-16, channels=2)
except:
    pass
SND = {}
SR = 22050

def _make(wave, dur):
    try:
        n = int(SR * dur)
        if n == 0: return None
        t = np.linspace(0, dur, n, False)
        w = wave(t).astype(np.float64)
        p = np.max(np.abs(w))
        if p > 0: w = w / p * 0.5
        w = np.clip(w * 32767, -32767, 32767).astype(np.int16)
        s = np.zeros((n, 2), dtype=np.int16)
        s[:, 0] = w
        s[:, 1] = w
        return pygame.sndarray.make_sound(s)
    except:
        return None

def _env(t, d, a=0.05, de=0.1, sus=0.6, r=0.2):
    n = len(t)
    ae = max(1, int(n * a / d))
    dee = max(ae + 1, int(n * (a + de) / d))
    rs = max(dee, int(n * (d - r) / d))
    e = np.ones(n)
    if ae > 0 and ae < n: e[:ae] = np.linspace(0, 1, ae)
    if dee > ae and dee < n: e[ae:dee] = np.linspace(1, sus, dee - ae)
    if rs < n and rs >= 0:
        rem = n - rs
        if rem > 0: e[rs:] = np.linspace(sus, 0, rem)
    return e

def init_snd():
    d = 0.15; t = np.linspace(0, d, int(SR*d), False)
    w = np.sin(2*np.pi*np.linspace(300, 600, len(t))*t) * _env(t,d)
    SND['jump'] = _make(lambda t: w, d)
    d = 0.2; t = np.linspace(0, d, int(SR*d), False); h = len(t)//2
    w = np.zeros_like(t); w[:h] = np.sin(2*np.pi*880*t[:h]); w[h:] = np.sin(2*np.pi*1320*t[h:]); w *= _env(t,d,0.01,0.05,0.5,0.1)
    SND['coin'] = _make(lambda t: w, d)
    d = 0.15; t = np.linspace(0, d, int(SR*d), False)
    w = np.sin(2*np.pi*80*t)*(1-t/d)**3 + np.random.randn(len(t))*0.3*(1-t/d)**2
    SND['stomp'] = _make(lambda t: w, d)
    d = 0.5; t = np.linspace(0, d, int(SR*d), False); ns = [523,659,784,1047]; sg = len(t)//len(ns); w = np.zeros_like(t)
    for i,n in enumerate(ns): s=i*sg; e=min((i+1)*sg,len(t)); w[s:e] = np.sin(2*np.pi*n*t[s:e])
    w *= _env(t,d,0.02,0.1,0.7,0.2)
    SND['powerup'] = _make(lambda t: w, d)
    d = 0.6; t = np.linspace(0, d, int(SR*d), False)
    w = np.sin(2*np.pi*np.linspace(500, 100, len(t))*t) * _env(t,d,0.05,0.1,0.5,0.3)
    SND['death'] = _make(lambda t: w, d)
    d = 1.2; t = np.linspace(0, d, int(SR*d), False); nc = [523,659,784,1047,784,1047,1319]; sg = len(t)//len(nc); w = np.zeros_like(t)
    for i,n in enumerate(nc): s=i*sg; e=min((i+1)*sg,len(t)); w[s:e] = np.sin(2*np.pi*n*t[s:e])+0.3*np.sin(2*np.pi*n*2*t[s:e]); w *= _env(t,d,0.02,0.05,0.8,0.3)
    SND['win'] = _make(lambda t: w, d)
    d = 0.05; t = np.linspace(0, d, int(SR*d), False)
    w = np.sin(2*np.pi*1000*t)*(1-t/d)
    SND['select'] = _make(lambda t: w, d)
    d = 0.1; t = np.linspace(0, d, int(SR*d), False)
    w = np.sin(2*np.pi*150*t)*(1-t/d)**2 + np.random.randn(len(t))*0.2*(1-t/d)
    SND['hit'] = _make(lambda t: w, d)

def play(n):
    s = SND.get(n)
    if s:
        try: s.play()
        except: pass

init_snd()

# ------------------------------------------------------------------ LOGGER
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, f"game_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

logger = logging.getLogger("SuperPixelQuest")
logger.setLevel(logging.DEBUG)
class _FlushHandler(logging.FileHandler):
    def emit(self, record):
        super().emit(record)
        self.flush()

_fh = _FlushHandler(LOG_FILE, mode='w', encoding='utf-8')
_fh.setLevel(logging.DEBUG)
_fmt = logging.Formatter("[%(asctime)s] %(levelname)s %(message)s", datefmt="%H:%M:%S")
_fh.setFormatter(_fmt)
logger.addHandler(_fh)
logger.info("=== Super Pixel Quest started ===")
_fh.flush()

def log_err(exc):
    logger.exception("Unhandled exception: %s", exc)

# ------------------------------------------------------------------ DRAW UTILS
def rr(surf, color, rect, r=6):
    pygame.draw.rect(surf, color, pygame.Rect(rect), border_radius=r)

def shadow_txt(surf, text, size, x, y, color, shadow=(0,0,0), off=2, center=False):
    f = pygame.font.Font(None, size)
    sh = f.render(text, True, shadow)
    tx = f.render(text, True, color)
    if center:
        sr = sh.get_rect(center=(x+off, y+off))
        tr = tx.get_rect(center=(x, y))
    else:
        sr = sh.get_rect(topleft=(x+off, y+off))
        tr = tx.get_rect(topleft=(x, y))
    surf.blit(sh, sr)
    surf.blit(tx, tr)

def draw_glow(surf, color, center, radius, alpha=60):
    s = pygame.Surface((radius*4, radius*4), pygame.SRCALPHA)
    for i in range(radius, 0, -1):
        a = int(alpha * (radius - i) / radius)
        pygame.draw.circle(s, (*color[:3], a), (radius*2, radius*2), i)
    surf.blit(s, (center[0]-radius*2, center[1]-radius*2), special_flags=pygame.BLEND_ALPHA_SDL2)

def lerp(a, b, t): return a + (b - a) * t
def clamp(v, lo, hi): return max(lo, min(v, hi))

# ------------------------------------------------------------------ PARTICLES
class Particle:
    __slots__ = ('x','y','vx','vy','color','size','life','max_life','grav')
    def __init__(self, x, y, vx, vy, color, size, life, grav=0):
        self.x=x;self.y=y;self.vx=vx;self.vy=vy;self.color=color;self.size=size;self.life=life;self.max_life=life;self.grav=grav
    @property
    def alive(self): return self.life > 0
    def update(self):
        self.x+=self.vx;self.vy+=self.grav;self.y+=self.vy;self.life-=1
    def draw(self, surf, ox, oy):
        if self.life<=0: return
        t = self.life/self.max_life if self.max_life>0 else 0
        a = int(255*t); r = max(1, int(self.size*(0.3+0.7*t)))
        s = pygame.Surface((r*2, r*2), pygame.SRCALPHA)
        pygame.draw.circle(s, (*self.color[:3], a), (r, r), r)
        surf.blit(s, (self.x-ox-r, self.y-oy-r))

class Particles:
    def __init__(self):
        self.parts = []
    def emit(self, x, y, vx, vy, color, size, life, grav=0, count=1):
        for _ in range(count):
            self.parts.append(Particle(x, y, vx, vy, color, size, life, grav))
    def burst(self, x, y, color, count=12, speed=3, life=30, size=3, grav=0.1):
        for _ in range(count):
            a = random.uniform(0, math.tau)
            s = random.uniform(1, speed)
            self.parts.append(Particle(x, y, math.cos(a)*s, math.sin(a)*s, color, random.uniform(1, size), random.randint(int(life*0.5), int(life)), grav))
    def update(self):
        self.parts = [p for p in self.parts if p.alive]
        for p in self.parts: p.update()
    def draw(self, surf, ox, oy):
        for p in self.parts: p.draw(surf, ox, oy)
    def clear(self): self.parts.clear()

# ------------------------------------------------------------------ CAMERA
class Camera:
    def __init__(self, lw):
        self.x = 0.0; self.tx = 0.0; self.shake = 0.0; self.lw = lw
    def follow(self, target):
        self.tx = target.centerx - SCREEN_W // 3
        self.x = lerp(self.x, self.tx, 0.08)
        self.x = clamp(self.x, 0, self.lw - SCREEN_W)
    def add_shake(self, a): self.shake = max(self.shake, a)
    def off(self):
        ox = int(self.x)
        if self.shake > 0.5:
            ox += random.randint(-int(self.shake), int(self.shake))
            self.shake *= 0.85
            if self.shake < 0.5: self.shake = 0
        return ox, 0

# ------------------------------------------------------------------ PLAYER
class Player:
    def __init__(self, x, y):
        self.fx = float(x); self.fy = float(y)
        self.rect = pygame.Rect(x, y, PLAYER_W, PLAYER_H)
        self.vx = 0.0; self.vy = 0.0
        self.on_ground = False; self.facing = 1
        self.has_dj = False; self.dj_used = False
        self.speed_boost = False; self.speed_timer = 0
        self.invincible = False; self.inv_timer = 0
        self.health = 3; self.alive = True; self.inv_frames = 0
        self.score = 0; self.coins = 0; self.kills = 0
        self.lives = 3; self.checkpoint = None
        self.jump_held = False; self.jumping = False
        self.jump_buffer = 0
        self.ice = False; self.win = False
        self.anim_timer = 0; self.anim_frame = 0
        self.shoot_cooldown = 0

    @property
    def centerx(self): return self.rect.centerx
    @property
    def centery(self): return self.rect.centery

    def max_spd(self): return MAX_SPEED * (1.5 if self.speed_boost else 1.0)

    def shoot(self):
        if self.shoot_cooldown > 0: return None
        self.shoot_cooldown = 12
        return Projectile(self.rect.centerx + self.facing*15, self.rect.centery, self.facing*8, 0)

    def update(self, platforms, particles, cam=None):
        if not self.alive: return
        self.inv_frames = max(0, self.inv_frames-1)
        self.speed_timer = max(0, self.speed_timer-1)
        self.inv_timer = max(0, self.inv_timer-1)
        self.shoot_cooldown = max(0, self.shoot_cooldown-1)
        self.speed_boost = self.speed_timer > 0
        self.invincible = self.inv_timer > 0

        # ---- JUMP BUFFER ----
        keys = pygame.key.get_pressed()
        jump_pressed = keys[pygame.K_SPACE] or keys[pygame.K_UP] or keys[pygame.K_w]
        if jump_pressed and not self.jump_held:
            self.jump_held = True
            self.jump_buffer = JUMP_BUFFER
        if not jump_pressed:
            self.jump_held = False

        # ---- HORIZONTAL ----
        move = 0
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: move = -1; self.facing = -1
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: move = 1; self.facing = 1

        if move != 0:
            self.vx += move * ACCEL
        else:
            self.vx *= FRICTION if self.on_ground else 0.95

        ms = self.max_spd()
        self.vx = clamp(self.vx, -ms, ms)
        if abs(self.vx) < 0.05: self.vx = 0

        # ---- JUMP EXECUTION ----
        if self.jump_buffer > 0:
            can_jump = self.on_ground or (self.has_dj and not self.dj_used)
            if can_jump:
                self.vy = JUMP_POWER
                self.on_ground = False
                self.jumping = True
                if not self.on_ground and self.has_dj:
                    self.dj_used = True
                play('jump')
                particles.burst(self.rect.centerx, self.rect.bottom, (180,160,140), 6, 2, 15, 2, 0)
                self.jump_buffer = 0
            else:
                self.jump_buffer -= 1

        # Variable jump height
        if jump_pressed and self.jumping and self.vy < 0:
            self.vy += JUMP_HOLD
        elif not jump_pressed and self.jumping and self.vy < JUMP_CUT:
            self.vy = JUMP_CUT
            self.jumping = False

        # ---- GRAVITY ----
        self.vy += GRAVITY
        if self.vy > MAX_FALL: self.vy = MAX_FALL

        # ---- MOVE X ----
        self.fx += self.vx
        self.rect.x = int(self.fx)
        for p in platforms:
            if self.rect.colliderect(p):
                if self.vx > 0: self.rect.right = p.left
                elif self.vx < 0: self.rect.left = p.right
                self.vx = 0; self.fx = self.rect.x

        # ---- MOVE Y ----
        was_ground = self.on_ground
        self.on_ground = False
        self.fy += self.vy
        self.rect.y = int(self.fy)
        for p in platforms:
            if self.rect.colliderect(p):
                if self.vy > 0:
                    self.rect.bottom = p.top
                    self.vy = 0
                    self.on_ground = True
                    self.fy = self.rect.y
                    self.dj_used = False
                    if not was_ground:
                        particles.burst(self.rect.centerx, self.rect.bottom, (160,140,120), 4, 1.5, 10, 2, 0)
                        if cam: cam.add_shake(2)
                        # Consume jump buffer on landing
                        if self.jump_buffer > 0:
                            self.vy = JUMP_POWER
                            self.jumping = True
                            self.jump_buffer = 0
                            play('jump')
                elif self.vy < 0:
                    self.rect.top = p.bottom
                    self.vy = 0; self.fy = self.rect.y

        # ---- BOUNDS ----
        if self.rect.left < 0:
            self.rect.left = 0; self.vx = 0; self.fx = self.rect.x

        # ---- TRAIL ----
        if abs(self.vx) > 2:
            if random.random() < 0.3:
                particles.emit(self.rect.centerx+random.randint(-4,4), self.rect.centery+random.randint(-4,4),
                               random.uniform(-0.3,0.3), random.uniform(-0.3,0.3),
                               (200,200,255,80), random.uniform(1,2), random.randint(6,12))

    def draw(self, surf, ox, oy):
        if not self.alive: return
        x = self.rect.x - ox; y = self.rect.y - oy
        if self.inv_frames > 0 and (self.inv_frames // 4) % 2 == 0: return

        body = (50, 130, 230)
        if self.invincible: body = (255, 255, 100)
        if self.speed_boost: body = (255, 180, 50)

        t = pygame.time.get_ticks() * 0.001
        speed = abs(self.vx)

        # ---- REFLECTION on ground ----
        if self.on_ground or self.rect.bottom < GROUND_Y + 20:
            ref_alpha = max(0, int(80 * (1 - (self.rect.bottom - GROUND_Y) / 40))) if not self.on_ground else 80
            if ref_alpha > 5:
                ref_y = GROUND_Y - oy
                ref_s = pygame.Surface((self.rect.w, 18))
                ref_s.set_colorkey((0,0,0))
                ref_s.set_alpha(ref_alpha)
                pygame.draw.ellipse(ref_s, (20, 20, 20), (0, 6, self.rect.w, 8))
                pygame.draw.ellipse(ref_s, (60, 50, 120), (3, 2, 9, 6))
                pygame.draw.ellipse(ref_s, (60, 50, 120), (self.rect.w-12, 2, 9, 6))
                pygame.draw.ellipse(ref_s, (180, 80, 50), (1, 9, 11, 4))
                pygame.draw.ellipse(ref_s, (180, 80, 50), (self.rect.w-12, 9, 11, 4))
                ref_s = pygame.transform.flip(ref_s, False, True)
                surf.blit(ref_s, (x, ref_y - 6))

        # ---- BOUNCE ----
        bounce = int(abs(math.sin(t * 10 * min(speed, 1))) * speed * 0.8) if speed > 0.3 else 0
        y += bounce

        # ---- MODERN AVATAR ----
        # Back scarf / cape
        cap_color = (200, 60, 60)
        cape_wave = math.sin(t * 8) * 3
        cape_pts = [(x+4, y+10), (x-6+int(cape_wave), y+30), (x+2+int(cape_wave), y+38), (x+8, y+20)]
        pygame.draw.polygon(surf, cap_color, cape_pts)
        pygame.draw.polygon(surf, (160, 40, 40), cape_pts, 1)

        # Hair (swoop)
        hair_color = (60, 40, 30)
        pygame.draw.ellipse(surf, hair_color, (x+2, y-5, self.rect.w-4, 12))
        pygame.draw.ellipse(surf, (80, 55, 40), (x+3, y-6, self.rect.w-8, 8))

        # Head (round face)
        head_r = self.rect.w//2 - 2
        head_cx = x + self.rect.w//2
        head_cy = y + 10
        pygame.draw.circle(surf, (255, 210, 170), (head_cx, head_cy), head_r)
        pygame.draw.circle(surf, (240, 190, 150), (head_cx, head_cy), head_r, 1)

        # Eyes (big manga-style)
        eye_off = 5 if self.facing > 0 else -5
        for ex_c in [head_cx - 5 + eye_off, head_cx + 5 + eye_off]:
            pygame.draw.circle(surf, (255, 255, 255), (ex_c, head_cy-2), 5)
            pygame.draw.circle(surf, (40, 30, 20), (ex_c+1, head_cy-1), 3)
            pygame.draw.circle(surf, (255, 255, 255), (ex_c+2, head_cy-3), 1)

        # Blush
        bx = head_cx - 9 + eye_off
        pygame.draw.circle(surf, (255, 160, 160, 80), (bx, head_cy+4), 3)
        pygame.draw.circle(surf, (255, 160, 160, 80), (head_cx + 9 + eye_off, head_cy+4), 3)

        # Mouth (smile)
        pygame.draw.arc(surf, (200, 100, 80), (head_cx-5+eye_off, head_cy+1, 10, 6), 0.1, math.pi-0.1, 2)

        # Body (hoodie/jacket)
        body_color = body
        hoodie_color = (clamp(body_color[0]+20, 0, 255), clamp(body_color[1]+20, 0, 255), clamp(body_color[2]+20, 0, 255))
        pygame.draw.rect(surf, hoodie_color, (x+3, y+16, self.rect.w-6, 16), border_radius=6)
        # Zipper line
        pygame.draw.line(surf, (clamp(body_color[0]-20, 0, 255), clamp(body_color[1]-20, 0, 255), clamp(body_color[2]-30, 0, 255)), (x+self.rect.w//2, y+18), (x+self.rect.w//2, y+30), 1)

        # Arms (with sleeves) - natural walk swing
        swing = math.sin(t * 9) * speed * 3
        arm_off = int(swing)
        arm_s = 1 if self.facing > 0 else -1
        arm_x = x-2 if arm_s < 0 else x+self.rect.w-4
        pygame.draw.rect(surf, (255, 210, 170), (arm_x, y+18+arm_off, 6, 12), border_radius=3)
        pygame.draw.rect(surf, hoodie_color, (arm_x-1, y+16+arm_off, 8, 6), border_radius=2)
        # Opposite arm (background)
        arm_bx = x+self.rect.w-4 if arm_s < 0 else x-2
        pygame.draw.rect(surf, (220, 180, 150), (arm_bx, y+18-arm_off, 6, 10), border_radius=2)

        # Legs (baggy pants) - smooth walk cycle
        leg_phase = math.sin(t * 9)
        leg_off = int(leg_phase * speed * 3)
        pant_color = (60, 50, 120)
        pygame.draw.rect(surf, pant_color, (x+3, y+30+leg_off, 9, 10), border_radius=3)
        pygame.draw.rect(surf, pant_color, (x+self.rect.w-12, y+30-leg_off, 9, 10), border_radius=3)

        # Shoes (blocky platformer style)
        shoe_color = (180, 80, 50)
        shoe_hl = (200, 100, 70)
        # Left shoe
        lsx = x + 1
        lsy = y + 38 + leg_off
        pygame.draw.rect(surf, shoe_color, (lsx, lsy, 11, 6), border_radius=2)
        pygame.draw.rect(surf, shoe_hl, (lsx+2, lsy+1, 7, 2))
        # Right shoe (opposite phase)
        rsx = x + self.rect.w - 12
        rsy = y + 38 - leg_off
        pygame.draw.rect(surf, shoe_color, (rsx, rsy, 11, 6), border_radius=2)
        pygame.draw.rect(surf, shoe_hl, (rsx+2, rsy+1, 7, 2))

        # Star badge on chest
        star_s = pygame.Surface((8, 8), pygame.SRCALPHA)
        pygame.draw.polygon(star_s, (255, 215, 0), [(4,0),(5,3),(8,3),(6,5),(7,8),(4,6),(1,8),(2,5),(0,3),(3,3)])
        surf.blit(star_s, (x+self.rect.w//2-4, y+20))

        if self.invincible:
            draw_glow(surf, (255, 255, 100), (x+self.rect.w//2, y+self.rect.h//2), 40, 60)

# ------------------------------------------------------------------ ENEMY
class EnemyType: GOOMBA=0; KOOPA=1; FLYING=2; ANGRY=3
class Enemy:
    def __init__(self, x, y, etype=0, speed=1.0):
        self.rect = pygame.Rect(x, y, 30, 30)
        self.etype = etype; self.start_x = x; self.start_y = y
        self.vx = -1.5*speed; self.vy = 0; self.alive = True
        self.death_timer = 0; self.death_vy = 0; self.death_vx = 0
        self.score_v = [200, 300, 400, 500][etype]
        self.time = random.uniform(0, math.tau)
        self.shoot_timer = random.randint(30, 90)

    def update(self, platforms, particles, player=None):
        if not self.alive:
            self.death_timer -= 1
            if self.death_timer > 0:
                self.rect.x += self.death_vx
                self.rect.y += self.death_vy
                self.death_vy += 0.3
            return self.death_timer > 0, None

        self.time += 0.03
        bullet = None
        if self.etype == EnemyType.ANGRY and player and player.alive:
            dx = player.rect.centerx - self.rect.centerx
            dy = player.rect.centery - self.rect.centery
            dist = math.hypot(dx, dy)
            if dist > 0:
                spd = 3.0
                self.vx = dx / dist * spd
                self.vy += GRAVITY * 2
                self.rect.x += self.vx
                self.rect.y += self.vy
                for p in platforms:
                    if self.rect.colliderect(p):
                        if self.vy > 0: self.rect.bottom = p.top; self.vy = -6
                        elif self.vx > 0: self.rect.right = p.left; self.vx = -self.vx
                        elif self.vx < 0: self.rect.left = p.right; self.vx = -self.vx
                if self.rect.left < 0: self.rect.left = 0; self.vx = abs(self.vx)
                # Shoot at player
                self.shoot_timer -= 1
                if self.shoot_timer <= 0 and dist < 400:
                    bullet = Projectile(self.rect.centerx, self.rect.centery, dx/dist*5, dy/dist*5, enemy=True)
                    self.shoot_timer = random.randint(60, 120)
        elif self.etype == EnemyType.FLYING:
            self.rect.y = self.start_y + math.sin(self.time*2)*30
            self.rect.x += self.vx
        else:
            self.vy += GRAVITY
            if self.vy > MAX_FALL: self.vy = MAX_FALL
            self.rect.x += self.vx; self.rect.y += self.vy
            for p in platforms:
                if self.rect.colliderect(p):
                    if self.vx > 0: self.rect.right = p.left; self.vx = -self.vx
                    elif self.vx < 0: self.rect.left = p.right; self.vx = -self.vx
                    if self.vy > 0: self.rect.bottom = p.top; self.vy = 0
                    elif self.vy < 0: self.rect.top = p.bottom; self.vy = 0
        return True, bullet

    def die(self, particles):
        self.alive = False; self.death_timer = 25; self.death_vy = -8; self.death_vx = random.uniform(-3,3)
        play('stomp'); particles.burst(self.rect.centerx, self.rect.centery, (200,100,50), 10, 4, 20, 3, 0.1)

    def draw(self, surf, ox, oy):
        x = self.rect.x-ox; y = self.rect.y-oy
        if not self.alive and self.death_timer <= 0: return
        cols = [(150,80,50), (50,150,50), (200,100,200), (200,50,50)]
        c = cols[self.etype]
        if self.alive:
            if self.etype == EnemyType.ANGRY:
                # Angry enemy - red with angry face
                pygame.draw.rect(surf, c, (x, y, self.rect.w, self.rect.h), border_radius=4)
                pygame.draw.rect(surf, (150,30,30), (x, y, self.rect.w, self.rect.h), border_radius=4, width=2)
                # Angry eyes
                pygame.draw.circle(surf, (255,255,255), (x+8, y+8), 5)
                pygame.draw.circle(surf, (255,255,255), (x+self.rect.w-8, y+8), 5)
                pygame.draw.circle(surf, (0,0,0), (x+9, y+9), 3)
                pygame.draw.circle(surf, (0,0,0), (x+self.rect.w-7, y+9), 3)
                # Angry eyebrows (diagonal)
                pygame.draw.line(surf, (0,0,0), (x+3, y+3), (x+11, y+7), 2)
                pygame.draw.line(surf, (0,0,0), (x+self.rect.w-3, y+3), (x+self.rect.w-11, y+7), 2)
                # Teeth/mouth
                pygame.draw.rect(surf, (0,0,0), (x+8, y+18, 14, 4))
                pygame.draw.rect(surf, (255,255,255), (x+9, y+18, 4, 4))
                pygame.draw.rect(surf, (255,255,255), (x+17, y+18, 4, 4))
            else:
                pygame.draw.ellipse(surf, c, (x, y, self.rect.w, self.rect.h))
                pygame.draw.circle(surf, (255,255,255), (x+7, y+8), 4)
                pygame.draw.circle(surf, (255,255,255), (x+self.rect.w-7, y+8), 4)
                pygame.draw.circle(surf, (0,0,0), (x+8, y+9), 2)
                pygame.draw.circle(surf, (0,0,0), (x+self.rect.w-6, y+9), 2)
                if self.etype == EnemyType.FLYING:
                    pygame.draw.ellipse(surf, (180,80,180), (x-4, y-4, 8, 6))
                    pygame.draw.ellipse(surf, (180,80,180), (x+self.rect.w-4, y-4, 8, 6))
        else:
            s = pygame.Surface((self.rect.w, self.rect.h), pygame.SRCALPHA)
            pygame.draw.ellipse(s, c, (0, 0, self.rect.w, self.rect.h))
            rot = pygame.transform.rotate(s, (25-self.death_timer)*15)
            surf.blit(rot, (x-rot.get_width()//2+self.rect.w//2, y-rot.get_height()//2+self.rect.h//2))

# ------------------------------------------------------------------ PROJECTILE
class Projectile:
    def __init__(self, x, y, vx, vy, enemy=False):
        self.rect = pygame.Rect(x-4, y-4, 8, 8)
        self.vx = vx; self.vy = vy; self.enemy = enemy
        self.alive = True; self.life = 120
    def update(self):
        self.rect.x += self.vx; self.rect.y += self.vy
        self.life -= 1
        if self.rect.x < -50 or self.rect.x > 7000 or self.rect.y < -50 or self.rect.y > SCREEN_H+50:
            self.alive = False
    def draw(self, surf, ox, oy):
        x = self.rect.x-ox; y = self.rect.y-oy
        if self.enemy:
            color = (255, 50, 50); glow_c = (255, 100, 100)
        else:
            color = (100, 200, 255); glow_c = (150, 230, 255)
        draw_glow(surf, glow_c, (x+4, y+4), 12, 40)
        pygame.draw.circle(surf, (255,255,255), (x+4, y+4), 4)
        pygame.draw.circle(surf, color, (x+4, y+4), 3)

# ------------------------------------------------------------------ COIN
class Coin:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 20, 24)
        self.collected = False; self.boff = random.uniform(0, math.tau)
    def update(self, player, particles):
        if self.collected: return False
        self.boff += 0.05
        if self.rect.colliderect(player.rect):
            self.collected = True; player.coins += 1; player.score += 100; play('coin')
            particles.burst(self.rect.centerx, self.rect.centery, (255,215,0), 8, 3, 20, 3, 0); return True
        return False
    def draw(self, surf, ox, oy):
        if self.collected: return
        x = self.rect.x-ox; y = self.rect.y-oy + math.sin(self.boff)*3
        draw_glow(surf, (255,215,0), (x+10, y+12), 16, 30)
        pygame.draw.ellipse(surf, (255,215,0), (x, y, self.rect.w, self.rect.h))
        pygame.draw.ellipse(surf, (255,255,200), (x+2, y+2, self.rect.w-4, self.rect.h-4))
        pygame.draw.ellipse(surf, (200,160,0), (x, y, self.rect.w, self.rect.h), 2)
        pygame.draw.line(surf, (255,255,255,100), (x+5, y+5), (x+5, y+15), 2)

# ------------------------------------------------------------------ POWERUP
class PowerUp:
    def __init__(self, x, y, ptype=0):
        self.rect = pygame.Rect(x, y, 28, 28); self.ptype = ptype; self.collected = False; self.boff = random.uniform(0, math.tau); self.gt = 0
    def update(self, player, particles):
        if self.collected: return False
        self.boff += 0.04; self.gt += 0.1
        if self.rect.colliderect(player.rect):
            self.collected = True; play('powerup')
            if self.ptype == 0: player.has_dj = True
            elif self.ptype == 1: player.speed_boost = True; player.speed_timer = 600
            elif self.ptype == 2: player.invincible = True; player.inv_timer = 600
            particles.burst(self.rect.centerx, self.rect.centery, (100,200,255), 15, 4, 25, 3, 0); return True
        return False
    def draw(self, surf, ox, oy):
        if self.collected: return
        x = self.rect.x-ox; y = self.rect.y-oy + math.sin(self.boff)*3
        cols = [(100,200,255), (255,180,50), (255,255,100)]
        syms = ['^', '>', '*']
        c = cols[self.ptype]
        draw_glow(surf, (min(255,c[0]+50),min(255,c[1]+50),min(255,c[2]+50)), (x+14, y+14), 20, 30)
        pygame.draw.rect(surf, c, (x, y, self.rect.w, self.rect.h), border_radius=6)
        pygame.draw.rect(surf, (255,255,255,40), (x+2, y+2, self.rect.w-4, self.rect.h-4), border_radius=4)
        t = font_xs.render(syms[self.ptype], True, (255,255,255))
        surf.blit(t, (x+9, y+6))

# ------------------------------------------------------------------ QBLOCK / PIPE / FLAG
class QBlock:
    def __init__(self, x, y, reward=0):
        self.rect = pygame.Rect(x, y, TILE, TILE); self.reward = reward; self.used = False; self.anim = 0
    def hit(self):
        if not self.used: self.used = True; self.anim = 8; return self.reward
        return None
    def update(self):
        if self.anim > 0: self.anim -= 1
    def draw(self, surf, ox, oy):
        x = self.rect.x-ox; y = self.rect.y-oy - (abs(self.anim-4) if self.anim>0 else 0)
        c = (180,120,40) if not self.used else (120,90,40)
        pygame.draw.rect(surf, c, (x, y, TILE, TILE), border_radius=3)
        if not self.used:
            pygame.draw.rect(surf, (220,180,60), (x+2, y+2, TILE-4, TILE-4), border_radius=2)
            q = font_s.render('?', True, (255,255,255)); surf.blit(q, (x+11, y+5))
            draw_glow(surf, (255,220,100), (x+TILE//2, y+TILE//2), 20, 25)
        else:
            pygame.draw.rect(surf, (100,80,40), (x+2, y+2, TILE-4, TILE-4), border_radius=2)

class Pipe:
    def __init__(self, x, y, h=2):
        self.rect = pygame.Rect(x, y-h*TILE, TILE*2, h*TILE)
    def draw(self, surf, ox, oy):
        x = self.rect.x-ox; y = self.rect.y-oy
        pygame.draw.rect(surf, (60,180,60), (x+4, y+TILE, self.rect.w-8, self.rect.h-TILE), border_radius=2)
        pygame.draw.rect(surf, (50,160,50), (x, y, self.rect.w, TILE), border_radius=4)
        pygame.draw.rect(surf, (80,200,80), (x+2, y+2, self.rect.w-4, TILE-4), border_radius=3)
        pygame.draw.line(surf, (100,220,100), (x+6, y+6), (x+6, y+TILE-2), 2)

class FlagPole:
    def __init__(self, x):
        self.rect = pygame.Rect(x, GROUND_Y-200, 8, 200)
        self.fy = self.rect.y + 10; self.reached = False
    def check(self, player): return not self.reached and player.rect.colliderect(self.rect)
    def draw(self, surf, ox, oy):
        x = self.rect.x-ox; y = self.rect.y-oy; foff = math.sin(pygame.time.get_ticks()*0.003)*3
        pygame.draw.rect(surf, (180,180,180), (x, y, self.rect.w, self.rect.h))
        pygame.draw.circle(surf, (255,215,0), (x+4, y), 8)
        draw_glow(surf, (255,215,0), (x+4, y), 15, 30)
        pygame.draw.polygon(surf, (255,50,50), [(x+8, y+10+foff), (x+40, y+25+foff), (x+8, y+40+foff)])

# ------------------------------------------------------------------ POPUP
class Popup:
    def __init__(self, x, y, text, color=(255,255,255)):
        self.x=x;self.y=y;self.text=text;self.color=color;self.life=60;self.vy=-2
    @property
    def alive(self): return self.life > 0
    def update(self): self.y+=self.vy; self.vy+=0.05; self.life-=1
    def draw(self, surf, ox, oy):
        if self.life<=0: return
        a = int(255*self.life/60); t = font_xs.render(self.text, True, self.color).convert_alpha()
        t.set_alpha(a); surf.blit(t, (self.x-ox-t.get_width()//2, self.y-oy))

# ------------------------------------------------------------------ LEVEL
THEMES = [
    {"name":"Green Hills","sky":(0.3,0.6,1.0,0.1,0.75,1.0),"g":((60,180,50),(90,210,70)),"p":((140,90,50),(180,130,70)),"bg_col":((180,220,255,30),(200,240,200,20)),"amb":[(180,220,255),(200,240,200)]},
    {"name":"Sandy Desert","sky":(1.0,0.7,0.3,0.9,0.86,0.55),"g":((200,160,80),(230,190,110)),"p":((170,130,70),(200,160,100)),"bg_col":((255,200,100,30),(255,220,150,20)),"amb":[(255,200,100),(255,220,150)]},
    {"name":"Ice Cavern","sky":(0.7,0.78,0.9,0.0,0.86,1.0),"g":((150,200,230),(190,230,250)),"p":((160,200,240),(200,230,255)),"bg_col":((200,220,255,30),(180,200,240,20)),"amb":[(200,220,255),(180,200,240)]},
    {"name":"Volcanic","sky":(0.15,0.03,0.03,0.39,0.12,0.08),"g":((80,40,30),(130,60,40)),"p":((100,50,35),(150,70,50)),"bg_col":((200,50,20,20),(255,100,30,15)),"amb":[(200,50,20),(255,100,30)]},
    {"name":"Crystal Cave","sky":(0.35,0.2,0.55,0.25,0.35,0.7),"g":((90,70,160),(120,100,190)),"p":((130,110,190),(160,140,220)),"bg_col":((140,110,240,30),(170,140,255,20)),"amb":[(140,110,240),(170,140,255)]},
    {"name":"Stormy Sky","sky":(0.2,0.2,0.3,0.35,0.35,0.45),"g":((70,70,85),(100,100,115)),"p":((115,115,130),(145,145,160)),"bg_col":((100,100,160,30),(120,120,180,20)),"amb":[(100,100,160),(120,120,180)]},
    {"name":"Enchanted Forest","sky":(0.1,0.28,0.1,0.18,0.45,0.2),"g":((35,75,45),(55,105,65)),"p":((85,55,105),(115,75,135)),"bg_col":((85,190,85,30),(105,210,105,20)),"amb":[(85,190,85),(105,210,105)]},
    {"name":"Lava Fortress","sky":(0.45,0.08,0.04,0.55,0.12,0.08),"g":((85,35,25),(125,55,35)),"p":((105,45,35),(145,65,45)),"bg_col":((255,85,25,30),(255,125,35,20)),"amb":[(255,85,25),(255,125,35)]},
    {"name":"Haunted Mansion","sky":(0.1,0.05,0.15,0.18,0.08,0.22),"g":((50,40,60),(70,60,85)),"p":((85,75,105),(115,95,135)),"bg_col":((125,85,185,30),(155,105,205,20)),"amb":[(125,85,185),(155,105,205)]},
    {"name":"Final Void","sky":(0.02,0.02,0.08,0.04,0.04,0.12),"g":((25,25,45),(45,45,65)),"p":((65,65,85),(95,95,115)),"bg_col":((55,55,155,30),(85,85,185,20)),"amb":[(55,55,155),(85,85,185)]},
]

LVL_DATA = [
    {"ground":[(0,3500),(3550,5600)],"plat":[(400,470,120),(650,400,120),(900,440,140),(1200,360,120),(1500,420,100),(1800,320,160),(2100,460,100),(2400,380,120),(2700,420,140),(3000,340,100),(3400,400,120),(3700,370,160),(4000,320,100),(4300,420,120),(4600,380,140),(4900,340,100),(5200,400,180)],
     "enemy":[(500,GROUND_Y-30,0,1),(1200,GROUND_Y-30,0,1),(1700,GROUND_Y-30,1,1.8),(2400,GROUND_Y-30,0,1),(2800,280,2,1.5),(3200,GROUND_Y-30,0,1),(3800,GROUND_Y-30,1,1.8)],
     "coin":[(520,440),(540,440),(560,440),(900,400),(1500,380),(1800,280),(2100,420),(2400,340),(2700,380),(3000,300),(3400,360),(3700,330),(4000,280),(4300,380),(4600,340),(4900,300)],
           "pu":[(2400,340,0),(4000,280,1)],"qb":[(900,400,0),(1800,280,1),(3000,300,0)],"pipe":[(800,GROUND_Y,3),(2000,GROUND_Y,2)],"flag":5400,"mc":10,"me":3,"cp":[1500,2700,4500]},
    {"ground":[(0,1600),(1670,2900),(2980,3500),(3580,4600),(4680,5500),(5580,6000)],"plat":[(300,460,100),(600,390,80),(800,430,100),(1100,360,80),(1400,410,100),(1700,330,80),(2000,390,100),(2300,310,80),(2600,370,100),(2900,330,80),(3200,390,100),(3500,310,80),(3800,370,100),(4100,330,80),(4400,390,100),(4700,310,80),(5000,360,100),(5300,310,80),(5600,370,100)],
      "enemy":[(500,GROUND_Y-30,0,1),(1000,GROUND_Y-30,1,1.8),(1900,290,2,1.5),(2200,GROUND_Y-30,0,1),(2700,GROUND_Y-30,1,1.8),(3600,260,2,1.5),(4200,GROUND_Y-30,0,1),(4800,GROUND_Y-30,1,1.8),(5300,GROUND_Y-30,0,1),(3200,GROUND_Y-30,3,1.5)],
     "coin":[(300,420),(600,350),(800,390),(1100,320),(1400,370),(1700,290),(2000,350),(2300,270),(2600,330),(2900,290),(3200,350),(3500,270),(3800,330),(4100,290),(4400,350),(4700,270),(5000,320)],
           "pu":[(1700,290,0),(3500,270,2)],"qb":[(600,350,0),(2000,350,1),(4400,350,0)],"pipe":[(500,GROUND_Y,2),(2500,GROUND_Y,3)],"flag":5800,"mc":8,"me":4,"cp":[1200,2800,4200]},
    {"ground":[(0,1600),(1670,2600),(2670,3600),(3670,4600),(4670,6200)],"plat":[(300,470,100),(500,410,80),(700,450,100),(1000,380,80),(1300,430,100),(1600,360,80),(1900,400,100),(2200,340,80),(2500,380,100),(2800,320,80),(3100,360,100),(3400,300,80),(3700,340,100),(4000,280,80),(4300,320,100),(4600,260,80),(4900,300,100),(5200,340,80),(5500,380,100),(5800,320,80)],
      "enemy":[(600,GROUND_Y-30,0,1),(1300,GROUND_Y-30,1,1.8),(2100,290,2,1.5),(2500,GROUND_Y-30,1,1.8),(3200,GROUND_Y-30,0,1),(3900,270,2,1.5),(4400,GROUND_Y-30,1,1.8),(5000,GROUND_Y-30,0,1),(5600,GROUND_Y-30,0,1),(2800,GROUND_Y-30,3,1.5),(4800,GROUND_Y-30,3,1.8)],
     "coin":[(300,430),(500,370),(700,410),(1000,340),(1300,390),(1600,320),(1900,360),(2200,300),(2500,340),(2800,280),(3100,320),(3400,260),(3700,300),(4000,240),(4300,280),(4600,220),(4900,260),(5200,300),(5500,340)],
           "pu":[(1000,340,0),(3400,260,1)],"qb":[(700,410,0),(2200,300,1),(4300,280,0)],"pipe":[(1500,GROUND_Y,2),(3500,GROUND_Y,2)],"flag":6000,"mc":12,"me":4,"cp":[1800,3500,5200]},
    {"ground":[(0,1300),(1380,2300),(2380,3300),(3380,4300),(4380,5800)],"plat":[(300,470,100),(500,410,80),(700,450,100),(900,390,80),(1100,430,100),(1400,370,80),(1700,410,100),(2000,350,80),(2300,390,100),(2600,330,80),(2900,370,100),(3200,310,80),(3500,350,100),(3800,290,80),(4100,330,100),(4400,270,80),(4700,310,100),(5000,350,80),(5300,290,100),(5600,330,80)],
      "enemy":[(500,GROUND_Y-30,0,1),(1100,GROUND_Y-30,1,1.8),(1900,290,2,1.5),(2200,GROUND_Y-30,1,1.8),(2800,GROUND_Y-30,0,1),(3100,260,2,1.5),(3700,GROUND_Y-30,1,1.8),(4200,GROUND_Y-30,0,1),(4500,280,2,1.5),(5100,GROUND_Y-30,1,1.8),(5600,GROUND_Y-30,0,1),(1500,GROUND_Y-30,3,1.5),(3800,GROUND_Y-30,3,2.0)],
     "coin":[(300,430),(500,370),(700,410),(900,350),(1100,390),(1400,330),(1700,370),(2000,310),(2300,350),(2600,290),(2900,330),(3200,270),(3500,310),(3800,250),(4100,290),(4400,230),(4700,270),(5000,310),(5300,250),(5600,290)],
      "pu":[(1100,390,0),(3200,270,2)],"qb":[(700,410,0),(2000,310,1),(4700,270,0)],"pipe":[(600,GROUND_Y,2),(2800,GROUND_Y,2)],"flag":5600,"mc":8,"me":6,"cp":[1500,3000,4500]},
    {"ground":[(0,1500),(1580,2800),(2880,3800),(3880,4800),(4880,6000)],"plat":[(300,460,100),(600,390,80),(900,430,100),(1200,360,80),(1500,400,100),(1800,330,80),(2100,370,100),(2400,300,80),(2700,340,100),(3000,280,80),(3300,320,100),(3700,270,80),(4100,310,100),(4400,250,80),(4700,290,100),(5000,240,80),(5300,280,100),(5600,320,80)],
      "enemy":[(400,GROUND_Y-30,0,1),(900,GROUND_Y-30,1,1.8),(1600,GROUND_Y-30,0,1),(2200,290,2,1.5),(2600,GROUND_Y-30,1,1.8),(3200,GROUND_Y-30,0,1),(3700,270,2,1.5),(4200,GROUND_Y-30,1,1.8),(4800,GROUND_Y-30,0,1),(5300,GROUND_Y-30,1,1.8),(2800,GROUND_Y-30,3,1.5),(3800,GROUND_Y-30,3,1.8)],
     "coin":[(300,420),(600,350),(900,390),(1200,320),(1500,360),(1800,290),(2100,330),(2400,260),(2700,300),(3000,240),(3300,280),(3700,230),(4100,270),(4400,210),(4700,250),(5000,200),(5300,240),(5600,280)],
           "pu":[(1200,360,1),(3000,280,2)],"qb":[(900,390,0),(2100,330,1),(4400,210,0)],"pipe":[(700,GROUND_Y,3),(2500,GROUND_Y,2)],"flag":5800,"mc":10,"me":5,"cp":[1200,2500,4000]},
    {"ground":[(0,1200),(1280,2200),(2280,3200),(3280,4200),(4280,5200),(5280,6200),(6280,7000)],"plat":[(300,450,80),(600,380,80),(900,420,100),(1200,350,80),(1500,390,100),(1800,320,80),(2100,360,100),(2400,290,80),(2700,330,100),(3000,260,80),(3300,300,100),(3600,230,80),(3900,270,100),(4200,200,80),(4500,240,100),(4800,170,80),(5100,210,100),(5400,140,80),(5700,180,100),(6000,110,80)],
      "enemy":[(500,GROUND_Y-30,0,1),(1000,GROUND_Y-30,1,1.8),(1500,GROUND_Y-30,0,1),(2000,260,2,1.5),(2500,GROUND_Y-30,1,1.8),(3000,GROUND_Y-30,0,1),(3500,240,2,1.5),(4000,GROUND_Y-30,1,1.8),(4500,GROUND_Y-30,0,1),(5000,210,2,1.5),(5500,GROUND_Y-30,1,1.8),(6000,GROUND_Y-30,0,1),(1800,GROUND_Y-30,3,1.8),(3800,GROUND_Y-30,3,2.0),(5800,GROUND_Y-30,3,2.2)],
     "coin":[(300,410),(600,340),(900,380),(1200,310),(1500,350),(1800,280),(2100,320),(2400,250),(2700,290),(3000,220),(3300,260),(3600,190),(3900,230),(4200,160),(4500,200),(4800,130),(5100,170),(5400,100),(5700,140),(6000,70)],
           "pu":[(900,420,0),(3000,260,2)],"qb":[(600,340,0),(2100,320,1),(4500,200,0)],"pipe":[(500,GROUND_Y,2),(3500,GROUND_Y,3)],"flag":6800,"mc":9,"me":5,"cp":[1000,2800,4500,6000]},
    {"ground":[(0,1800),(1880,3000),(3080,4200),(4280,5300),(5380,6500)],"plat":[(300,470,100),(550,410,80),(800,450,100),(1050,380,80),(1300,420,100),(1550,350,80),(1800,390,100),(2050,320,80),(2300,360,100),(2550,290,80),(2800,330,100),(3050,260,80),(3300,300,100),(3550,230,80),(3800,270,100),(4050,200,80),(4300,240,100),(4550,170,80),(4800,210,100),(5050,140,80),(5300,180,100),(5550,110,80),(5800,150,100),(6050,200,80)],
      "enemy":[(500,GROUND_Y-30,0,1),(1000,GROUND_Y-30,1,1.8),(1500,GROUND_Y-30,0,1),(2000,260,2,1.5),(2400,GROUND_Y-30,1,1.8),(2800,GROUND_Y-30,0,1),(3200,240,2,1.5),(3600,GROUND_Y-30,1,1.8),(4000,GROUND_Y-30,0,1),(4400,220,2,1.5),(4800,GROUND_Y-30,1,1.8),(5200,GROUND_Y-30,0,1),(5600,GROUND_Y-30,1,1.8),(1800,GROUND_Y-30,3,1.8),(3400,GROUND_Y-30,3,2.0),(5000,GROUND_Y-30,3,2.2)],
     "coin":[(300,430),(550,370),(800,410),(1050,340),(1300,380),(1550,310),(1800,350),(2050,280),(2300,320),(2550,250),(2800,290),(3050,220),(3300,260),(3550,190),(3800,230),(4050,160),(4300,200),(4550,130),(4800,170),(5050,100),(5300,140),(5550,70),(5800,110),(6050,160)],
           "pu":[(1300,420,0),(3050,260,2)],"qb":[(800,410,0),(2050,280,1),(4300,200,0)],"pipe":[(600,GROUND_Y,3),(2800,GROUND_Y,2)],"flag":6300,"mc":11,"me":5,"cp":[1500,3200,5200]},
    {"ground":[(0,1000),(1100,2000),(2100,3000),(3100,4000),(4100,5000),(5100,6200)],"plat":[(300,460,80),(600,390,80),(900,430,80),(1200,360,80),(1500,400,80),(1800,330,80),(2100,370,80),(2400,300,80),(2700,340,80),(3000,270,80),(3300,310,80),(3600,240,80),(3900,280,80),(4200,210,80),(4500,250,80),(4800,180,80),(5100,220,80),(5400,150,80),(5700,190,80),(6000,120,80)],
      "enemy":[(400,GROUND_Y-30,0,1),(800,GROUND_Y-30,1,1.8),(1300,GROUND_Y-30,0,1),(1800,250,2,1.8),(2300,GROUND_Y-30,1,1.8),(2800,GROUND_Y-30,0,1),(3300,230,2,1.8),(3800,GROUND_Y-30,1,1.8),(4300,GROUND_Y-30,0,1),(4800,210,2,1.8),(5300,GROUND_Y-30,1,1.8),(5800,GROUND_Y-30,0,1),(1500,GROUND_Y-30,3,1.8),(3000,GROUND_Y-30,3,2.0),(4500,GROUND_Y-30,3,2.2)],
     "coin":[(300,420),(600,350),(900,390),(1200,320),(1500,360),(1800,290),(2100,330),(2400,260),(2700,300),(3000,230),(3300,270),(3600,200),(3900,240),(4200,170),(4500,210),(4800,140),(5100,180),(5400,110),(5700,150),(6000,80)],
           "pu":[(1200,360,0)],"qb":[(600,350,0),(2400,260,1),(4500,210,0)],"pipe":[(700,GROUND_Y,2),(3500,GROUND_Y,3)],"flag":6000,"mc":8,"me":6,"cp":[800,2500,4500]},
    {"ground":[(0,900),(1000,1900),(2000,3100),(3200,4300),(4400,5500),(5600,6800)],"plat":[(300,450,80),(600,380,80),(900,420,80),(1200,350,80),(1500,390,80),(1800,320,80),(2100,360,80),(2400,290,80),(2700,330,80),(3000,260,80),(3300,300,80),(3600,230,80),(3900,270,80),(4200,200,80),(4500,240,80),(4800,170,80),(5100,210,80),(5400,140,80),(5700,180,80),(6000,110,80),(6300,150,80)],
      "enemy":[(400,GROUND_Y-30,0,1),(800,GROUND_Y-30,1,1.8),(1200,GROUND_Y-30,0,1),(1600,250,2,1.8),(2100,GROUND_Y-30,1,1.8),(2500,GROUND_Y-30,0,1),(3000,230,2,1.8),(3400,GROUND_Y-30,1,1.8),(3800,GROUND_Y-30,0,1),(4200,200,2,1.8),(4600,GROUND_Y-30,1,1.8),(5000,GROUND_Y-30,0,1),(5400,GROUND_Y-30,1,1.8),(5800,GROUND_Y-30,0,1),(1500,GROUND_Y-30,3,1.8),(3200,GROUND_Y-30,3,2.0),(4800,GROUND_Y-30,3,2.2),(6200,GROUND_Y-30,3,2.5)],
     "coin":[(300,410),(600,340),(900,380),(1200,310),(1500,350),(1800,280),(2100,320),(2400,250),(2700,290),(3000,220),(3300,260),(3600,190),(3900,230),(4200,160),(4500,200),(4800,130),(5100,170),(5400,100),(5700,140),(6000,70),(6300,110)],
           "pu":[(1800,320,0)],"qb":[(600,340,0),(2400,250,1),(4800,130,1)],"pipe":[(500,GROUND_Y,2),(3500,GROUND_Y,3)],"flag":6600,"mc":7,"me":7,"cp":[800,2500,4500,6000]},
    {"ground":[(0,800),(1000,1800),(2500,3500),(4200,5500),(6000,7500)],"plat":[(300,450,80),(600,370,80),(900,410,80),(1200,340,80),(1500,380,80),(1800,310,80),(2100,350,80),(2400,280,80),(2700,320,80),(3000,250,80),(3300,290,80),(3600,220,80),(3900,260,80),(4200,190,80),(4500,230,80),(4800,160,80),(5100,200,80),(5400,130,80),(5700,170,80),(6000,100,80),(6300,140,80),(6600,70,80),(6900,110,80)],
      "enemy":[(400,GROUND_Y-30,0,1),(700,GROUND_Y-30,1,1.8),(1100,GROUND_Y-30,0,1),(1400,240,2,1.8),(1700,GROUND_Y-30,1,1.8),(2000,GROUND_Y-30,0,1),(2600,220,2,1.8),(2900,GROUND_Y-30,1,1.8),(3200,GROUND_Y-30,0,1),(3600,200,2,1.8),(4000,GROUND_Y-30,1,1.8),(4500,GROUND_Y-30,0,1),(4900,180,2,1.8),(5200,GROUND_Y-30,1,1.8),(5600,GROUND_Y-30,0,1),(6200,GROUND_Y-30,1,1.8),(6600,GROUND_Y-30,0,1),(1500,GROUND_Y-30,3,2.0),(3000,GROUND_Y-30,3,2.2),(4500,GROUND_Y-30,3,2.5),(6300,GROUND_Y-30,3,2.8)],
     "coin":[(300,410),(600,330),(900,370),(1200,300),(1500,340),(1800,270),(2100,310),(2400,240),(2700,280),(3000,210),(3300,250),(3600,180),(3900,220),(4200,150),(4500,190),(4800,120),(5100,160),(5400,90),(5700,130),(6000,60),(6300,100),(6600,30),(6900,70)],
           "pu":[(1500,380,0)],"qb":[(900,370,0),(3000,210,1)],"pipe":[(600,GROUND_Y,3),(2500,GROUND_Y,2)],"flag":7300,"mc":6,"me":8,"cp":[700,2800,5000]},
]
TOTAL_LVLS = len(LVL_DATA)

# ------------------------------------------------------------------ CHECKPOINT
class Checkpoint:
    def __init__(self, x):
        self.x = x
        self.rect = pygame.Rect(x-10, GROUND_Y-60, 20, 60)
        self.reached = False
    def draw(self, surf, ox):
        sx = self.x - ox
        if sx < -30 or sx > SCREEN_W+30: return
        if self.reached:
            col = (100, 255, 100)
            gcol = (0, 200, 0)
        else:
            col = (255, 255, 100)
            gcol = (200, 200, 0)
        # Pole
        pygame.draw.rect(surf, (150, 150, 150), (sx-2, GROUND_Y-60, 4, 60))
        # Flag
        pts = [(sx+2, GROUND_Y-55), (sx+2, GROUND_Y-35), (sx+20, GROUND_Y-45)]
        pygame.draw.polygon(surf, col, pts)
        pygame.draw.polygon(surf, gcol, pts, 2)
        # Glow when reached
        if self.reached:
            draw_glow(surf, (100, 255, 100, 30), (sx+8, GROUND_Y-45), 30, 15)

# ------------------------------------------------------------------ FLOWER
class Flower:
    def __init__(self, x, y, cols, size=6):
        self.x = x; self.y = y; self.cols = cols; self.size = size; self.phase = random.uniform(0, math.tau)
    def draw(self, surf, ox):
        sx = self.x - ox
        if sx < -20 or sx > SCREEN_W + 20: return
        sway = math.sin(pygame.time.get_ticks() * 0.002 + self.phase) * 2
        # Stem
        pygame.draw.line(surf, (50, 150, 50), (sx, self.y), (sx + sway, self.y - 12), 2)
        # Leaves
        pygame.draw.ellipse(surf, (60, 170, 60), (sx - 3 + sway, self.y - 10, 5, 3))
        pygame.draw.ellipse(surf, (60, 170, 60), (sx + 1 + sway, self.y - 8, 5, 3))
        # Petals
        for i, c in enumerate(self.cols):
            a = i * math.pi / len(self.cols) + self.phase * 0.1
            px = sx + int(math.cos(a) * 4) + sway
            py = self.y - 12 + int(math.sin(a) * 4)
            pygame.draw.circle(surf, c, (px, py), 3)
        # Center
        pygame.draw.circle(surf, (255, 215, 0), (int(sx + sway), self.y - 12), 3)

# ------------------------------------------------------------------ BUILD
class Level:
    def __init__(self, idx):
        self.idx = idx; d = LVL_DATA[idx]; t = THEMES[idx]
        self.name = t['name']; self.theme = t; self.width = d['flag'] + 400
        self.platforms = []; self.ground_r = []
        for g in d['ground']:
            r = pygame.Rect(g[0], GROUND_Y, g[1]-g[0], SCREEN_H-GROUND_Y)
            self.ground_r.append(r); self.platforms.append(r)
        for p in d['plat']:
            self.platforms.append(pygame.Rect(p[0], p[1], p[2], TILE))
        self.enemies = [Enemy(e[0], e[1], e[2], e[3]) for e in d['enemy']]
        self.coins = [Coin(c[0], c[1]) for c in d['coin']]
        self.powerups = [PowerUp(p[0], p[1], p[2]) for p in d.get('pu',[])]
        self.qblocks = [QBlock(q[0], q[1], q[2]) for q in d.get('qb',[])]
        self.pipes = [Pipe(pp[0], pp[1], pp[2]) for pp in d.get('pipe',[])]
        self.pipe_rects = set(id(pp.rect) for pp in self.pipes)
        for pp in self.pipes: self.platforms.append(pp.rect)
        self.flagpole = FlagPole(d['flag'])
        self.checkpoints = [Checkpoint(cx) for cx in d.get('cp', [])]
        self.mc = d['mc']; self.me = d['me']
        self.ambient = []
        for _ in range(25):
            self.ambient.append({'x':random.uniform(0,self.width),'y':random.uniform(0,SCREEN_H),'vx':random.uniform(-0.15,0.15),'vy':random.uniform(-0.2,-0.02),'size':random.uniform(2,5),'alpha':random.randint(15,40),'color':random.choice(t['amb'])})
        # Animated clouds
        self.clouds = []
        for _ in range(6):
            cx = random.uniform(0, self.width)
            cy = random.uniform(40, 160)
            cw = random.uniform(80, 180)
            ch = random.uniform(25, 45)
            cs = random.uniform(0.15, 0.4)
            self.clouds.append({'x':cx, 'y':cy, 'w':cw, 'h':ch, 'speed':cs, 'puffs':random.randint(2,4)})
        # Birds
        self.birds = []
        for _ in range(3):
            self.birds.append({'x':random.uniform(0,self.width), 'y':random.uniform(80,200), 'speed':random.uniform(1,2.5), 'phase':random.uniform(0,math.tau), 'alive':True})
        # Trees in background
        self.trees = []
        for g in d['ground']:
            for tx in range(g[0]+80, g[1]-80, random.randint(100, 180)):
                if random.random() < 0.35:
                    th = random.randint(60, 120)
                    tw = random.randint(30, 50)
                    tc = random.choice([(60,110,50),(70,120,60),(50,100,45)])
                    self.trees.append({'x':tx, 'y':GROUND_Y, 'w':tw, 'h':th, 'color':tc, 'sway':random.uniform(0,math.tau)})
        # Fireflies (level-specific)
        self.fireflies = []
        if idx not in (1, 5, 7, 8, 9):  # desert, stormy, lava, haunted, void
            for _ in range(8 + idx * 3):
                self.fireflies.append({'x':random.uniform(0,self.width), 'y':random.uniform(GROUND_Y-80,GROUND_Y-20), 'vx':random.uniform(-0.2,0.2), 'vy':random.uniform(-0.1,0.1), 'phase':random.uniform(0,math.tau), 'size':random.uniform(2,4)})
        # Waterfall particles (levels with waterfalls)
        self.waterfalls = []
        if idx == 0:
            for wx in [800, 3500]:
                self.waterfalls.append({'x':wx, 'y':GROUND_Y-100, 'height':100, 'particles':[], 'color':(100,180,255)})
        elif idx == 2:
            for wx in [1500, 4000]:
                self.waterfalls.append({'x':wx, 'y':GROUND_Y-100, 'height':100, 'particles':[], 'color':(180,200,255)})
        elif idx == 4:
            for wx in [1200, 3500]:
                self.waterfalls.append({'x':wx, 'y':GROUND_Y-100, 'height':100, 'particles':[], 'color':(140,110,240)})
        elif idx == 6:
            for wx in [2000, 4500]:
                self.waterfalls.append({'x':wx, 'y':GROUND_Y-100, 'height':120, 'particles':[], 'color':(85,190,85)})

        # Flowers
        flower_palettes = {
            0: [(255,150,200),(255,200,150),(255,100,150)],
            1: [(255,200,100),(255,180,50),(255,220,150)],
            2: [(200,220,255),(180,200,255),(150,180,255)],
            3: [(255,100,50),(255,150,50),(255,200,100)],
            4: [(170,130,255),(200,160,255),(140,100,230)],
            5: [(180,180,200),(200,200,220),(160,160,180)],
            6: [(100,255,100),(150,200,100),(80,230,80)],
            7: [(255,120,50),(255,160,80),(200,80,30)],
            8: [(200,160,255),(230,190,255),(170,130,230)],
            9: [(100,100,200),(130,130,230),(80,80,180)],
        }
        fcols = flower_palettes.get(idx, flower_palettes[0])
        self.flowers = []
        for g in d['ground']:
            for fx in range(g[0]+40, g[1]-40, random.randint(60, 120)):
                if random.random() < 0.45:
                    fy = GROUND_Y
                    fc = random.choice([fcols[:2], fcols[1:], [fcols[0], fcols[2]]])
                    self.flowers.append(Flower(fx, fy, fc, random.randint(4, 7)))
    def draw_bg(self, surf, ox):
        t = self.theme; now = pygame.time.get_ticks()
        # Sky gradient
        sky = t['sky']
        for y in range(SCREEN_H):
            p = y/SCREEN_H
            r = int(sky[0]*255*(1-p) + sky[3]*255*p)
            g2 = int(sky[1]*255*(1-p) + sky[4]*255*p)
            b = int(sky[2]*255*(1-p) + sky[5]*255*p)
            pygame.draw.line(surf, (r,g2,b), (0,y), (SCREEN_W,y))

        # Sun/moon glow
        sun_x = (ox * 0.1 + 400) % (SCREEN_W + 200) - 100
        sun_y = 80 + math.sin(now * 0.0002) * 15
        draw_glow(surf, (255, 220, 100), (int(sun_x), int(sun_y)), 60, 25)
        if self.idx != 1:
            pygame.draw.circle(surf, (255, 240, 180), (int(sun_x), int(sun_y)), 20)
            pygame.draw.circle(surf, (255, 250, 230), (int(sun_x), int(sun_y)), 12)

        # Animated clouds (parallax 0.3x)
        for c in self.clouds:
            c['x'] += c['speed']
            if c['x'] - ox * 0.3 > SCREEN_W + 200: c['x'] = ox * 0.3 - 200
            cx = c['x'] - ox * 0.3
            if cx < -200 or cx > SCREEN_W + 200: continue
            cy = c['y'] + math.sin(now * 0.0005 + c['x'] * 0.01) * 3
            cloud_surf = pygame.Surface((int(c['w']+20), int(c['h']+20)), pygame.SRCALPHA)
            for p in range(c['puffs']):
                px = p * c['w'] / (c['puffs']-1) + 10
                py = c['h']/2 + math.sin(p * 1.7) * c['h'] * 0.2
                pr = c['h'] * (0.4 + 0.3 * math.sin(p * 2.3))
                pygame.draw.circle(cloud_surf, (255,255,255,180), (int(px), int(py)), int(pr))
                pygame.draw.circle(cloud_surf, (255,255,255,120), (int(px-3), int(py-2)), int(pr*0.7))
            surf.blit(cloud_surf, (int(cx-10), int(cy-c['h']/2-10)))

        # Flying birds (parallax 0.2x)
        for b in self.birds:
            b['x'] += b['speed']
            if b['x'] - ox * 0.2 > SCREEN_W + 100: b['x'] = ox * 0.2 - 100
            bx = b['x'] - ox * 0.2
            if bx < -100 or bx > SCREEN_W + 100: continue
            by2 = b['y'] + math.sin(now * 0.003 + b['phase']) * 8
            wing = math.sin(now * 0.008 + b['phase']) * 6
            # Body
            pygame.draw.ellipse(surf, (40, 35, 30), (bx-4, by2-2, 8, 4))
            # Wings
            pygame.draw.polygon(surf, (50, 45, 40), [(bx-2, by2-1), (bx-8, by2-5-wing), (bx-4, by2-1)])
            pygame.draw.polygon(surf, (50, 45, 40), [(bx+2, by2-1), (bx+8, by2-5+wing), (bx+4, by2-1)])
            # Beak
            pygame.draw.polygon(surf, (255, 180, 50), [(bx+4, by2), (bx+8, by2+1), (bx+4, by2+2)])

        # Trees (parallax 0.5x)
        for tr in self.trees:
            tx = tr['x'] - ox * 0.5
            if tx < -tr['w'] or tx > SCREEN_W + tr['w']: continue
            sway = math.sin(now * 0.001 + tr['sway']) * 2
            # Trunk
            trunk_w = max(4, tr['w'] // 6)
            pygame.draw.rect(surf, (80, 50, 30), (tx - trunk_w//2, tr['y']-tr['h']*0.6, trunk_w, int(tr['h']*0.6)))
            # Foliage (circle layers)
            for layer in range(3):
                ly = tr['y'] - tr['h'] + layer * tr['h'] * 0.25
                lr = tr['w'] * (0.5 - layer * 0.1) + sway * (0.5 - layer * 0.15)
                lx = tx + sway * 0.3
                c = (tr['color'][0]+layer*10, tr['color'][1]+layer*15, tr['color'][2]+layer*5)
                pygame.draw.circle(surf, c, (int(lx), int(ly)), int(lr))

        # Background hills
        for i, bg in enumerate(t['bg_col']):
            by2 = SCREEN_H - 80 - i*40
            hill_off = math.sin(now * 0.0003 + i) * 5
            for x in range(0, SCREEN_W, 4):
                wx = x+ox; h = 30+math.sin(wx*0.005+i*2)*20+math.sin(wx*0.01+i)*10 + hill_off
                s = pygame.Surface((4, max(1,int(h))), pygame.SRCALPHA); s.fill(bg); surf.blit(s, (x, by2-int(h)))

        # Waterfalls
        for wf in self.waterfalls:
            wx = wf['x'] - ox
            if wx < -50 or wx > SCREEN_W + 50: continue
            # Water stream
            for i in range(12):
                offset = math.sin(now * 0.005 + i * 2) * 4
                alpha = 60 + 30 * math.sin(now * 0.003 + i)
                w, h = 6, wf['height'] // 12
                ry = wf['y'] + i * h
                pygame.draw.rect(surf, (*wf['color'], alpha), (wx + offset, ry, 4, h))
            # Splash at bottom
            for s in range(6):
                sa = 40 + 20 * math.sin(now * 0.004 + s)
                sx2 = wx + math.sin(now * 0.003 + s * 1.5) * 15
                sy2 = wf['y'] + wf['height']
                pygame.draw.circle(surf, (*wf['color'], sa), (int(sx2), int(sy2)), 3)

        # Fireflies
        for ff in self.fireflies:
            ff['x'] += ff['vx']
            ff['y'] += ff['vy']
            ffx = ff['x'] - ox
            if ffx < -10 or ffx > SCREEN_W + 10:
                ff['x'] = ox + random.uniform(20, SCREEN_W-20)
                ff['y'] = random.uniform(GROUND_Y-80, GROUND_Y-20)
            glow_a = 30 + 25 * math.sin(now * 0.003 + ff['phase'])
            draw_glow(surf, (255, 220, 100), (int(ffx), int(ff['y'])), int(ff['size']*4), int(glow_a))
            pygame.draw.circle(surf, (255, 255, 200), (int(ffx), int(ff['y'])), int(ff['size']))

        # Ambient particles
        for a in self.ambient:
            a['x'] += a['vx']; a['y'] += a['vy']
            sx = a['x']-ox
            if sx < -20 or sx > SCREEN_W+20: a['x'] = ox+random.uniform(0,SCREEN_W); a['y'] = random.uniform(0,SCREEN_H)
            if a['y'] < -20: a['y'] = SCREEN_H + 20
            s = pygame.Surface((a['size']*2, a['size']*2), pygame.SRCALPHA)
            pygame.draw.circle(s, (*a['color'], a['alpha']), (int(a['size']), int(a['size'])), int(a['size']))
            surf.blit(s, (sx-a['size'], a['y']-a['size']))
    def draw_ground(self, surf, ox):
        t = self.theme
        # Dark layer behind ground for seamless joins
        for g in self.ground_r:
            x = g.x-ox; w = g.w
            if x > SCREEN_W + TILE or x + w < -TILE: continue
            # Fill gaps between ground segments
            rr(surf, (t['g'][0][0]-10, t['g'][0][1]-10, t['g'][0][2]-10), (x, g.y+8, w, g.h-8), 3)
        # Main ground pass
        for g in self.ground_r:
            x = g.x-ox; w = g.w; y = g.y
            if x > SCREEN_W + TILE or x + w < -TILE: continue
            clip_x = max(0, x); clip_w = w
            if x < 0: clip_w = w + x; clip_x = 0
            if x + w > SCREEN_W: clip_w = SCREEN_W - x
            if clip_w <= 0: continue
            # Ground body
            rr(surf, t['g'][0], (x, y, w, g.h), 4)
            # Grass gradient
            grass_h = 14
            for i in range(grass_h):
                p = i / grass_h
                r = int(t['g'][1][0]*(1-p)+t['g'][0][0]*p)
                g2 = int(t['g'][1][1]*(1-p)+t['g'][0][1]*p)
                b = int(t['g'][1][2]*(1-p)+t['g'][0][2]*p)
                pygame.draw.line(surf, (r,g2,b), (x, y+i), (x+w, y+i))
            # Grass blades (deterministic)
            def blade_h(i): return 3 + ((g.x * 7 + i * 13) % 6)
            for bx in range(x, x+w, 5):
                if bx < -5 or bx > SCREEN_W+5: continue
                bh = blade_h(bx)
                bc = (clamp(t['g'][1][0]+25, 0, 255), clamp(t['g'][1][1]+25, 0, 255), clamp(t['g'][1][2]+15, 0, 255))
                pygame.draw.line(surf, bc, (bx, y), (bx, y-bh), 1)
            # Soil dots (deterministic)
            def soil_dot(i):
                dx = x + ((g.x * 11 + i * 17) % max(1, w))
                dy = y + 16 + ((g.x * 3 + i * 7) % (g.h - 24))
                return dx, dy
            for i in range(max(1, w // 25)):
                dx, dy = soil_dot(i)
                dc = (clamp(t['g'][0][0]-20, 0, 255), clamp(t['g'][0][1]-15, 0, 255), clamp(t['g'][0][2]-8, 0, 255))
                pygame.draw.circle(surf, dc, (dx, dy), 1 + ((i * 5) % 3))
            # Bottom shadow
            for i in range(5):
                a = 15 + i * 12
                pygame.draw.line(surf, (0,0,0,a), (x, y+g.h-5+i), (x+w, y+g.h-5+i))
        # Flowers drawn ONCE outside ground loop
        for f in self.flowers:
            f.draw(surf, ox)
    def draw_plats(self, surf, ox):
        t = self.theme
        for p in self.platforms:
            if p in self.ground_r: continue
            if id(p) in self.pipe_rects: continue
            x = p.x-ox; y = p.y
            if x < -TILE or x > SCREEN_W+TILE: continue
            rr(surf, t['p'][0], (x, y, p.w, TILE), 4)
            pygame.draw.rect(surf, t['p'][1], (x, y, p.w, 6), border_radius=2)
            rr(surf, (0,0,0,30), (x+2, y+TILE, p.w, 4), 2)

# ------------------------------------------------------------------ HUD
class HUD:
    def draw(self, surf, player, level, lives=3):
        t = level.theme
        # Health
        rr(surf, (40,40,40,180), (20,20,160,22), 6)
        if player.health > 0:
            fw = int(152 * player.health / 3)
            c = (60,220,60) if player.health>1 else (255,200,40) if player.health>0 else (255,50,50)
            rr(surf, c, (24,24,fw,14), 4)
        # Score / Coins / Kills
        shadow_txt(surf, f"SCORE: {player.score}", 28, SCREEN_W-20, 20, (255,255,255), off=2)
        shadow_txt(surf, f"COINS: {player.coins}", 22, SCREEN_W-20, 46, (255,215,0), off=2)
        shadow_txt(surf, f"KILLS: {player.kills}", 22, SCREEN_W-20, 68, (255,100,100), off=2)
        shadow_txt(surf, t['name'], 22, 20, 48, (200,200,255), off=2)
        # Lives
        shadow_txt(surf, f"LIVES: {'♥' * max(0, lives)}", 20, SCREEN_W//2, 20, (255,80,80), off=2)
        # Powerup
        py = 70
        if player.has_dj: shadow_txt(surf, "^ DOUBLE JUMP", 18, 20, py, (100,200,255), off=1); py += 20
        if player.speed_boost: shadow_txt(surf, f"> SPEED {player.speed_timer//60}s", 18, 20, py, (255,180,50), off=1); py += 20
        if player.invincible: shadow_txt(surf, f"* INVINCIBLE {player.inv_timer//60}s", 18, 20, py, (255,255,100), off=1)
        # Missions
        mx = SCREEN_W - 200; my = SCREEN_H - 85
        fd = level.flagpole.reached; cd = player.coins >= level.mc; ed = player.kills >= level.me
        rows = 3
        rr(surf, (0,0,0,140), (mx, my, 190, 16+rows*18), 6)
        shadow_txt(surf, "MISSIONS", 18, mx+95, my+4, (200,200,255), off=1, center=True)
        shadow_txt(surf, f"{'✓' if fd else '○'} Flagpole", 14, mx+8, my+20, (255,215,0) if fd else (180,180,180), off=1)
        shadow_txt(surf, f"{'✓' if cd else '○'} {player.coins}/{level.mc} Coins", 14, mx+8, my+38, (255,215,0) if cd else (180,180,180), off=1)
        shadow_txt(surf, f"{'✓' if ed else '○'} {player.kills}/{level.me} Kills", 14, mx+8, my+56, (255,100,100) if ed else (180,180,180), off=1)

# ------------------------------------------------------------------ GAME
class Game:
    def __init__(self):
        self.clock = clock; self.screen = screen; self.running = True
        self.state = 'menu'; self.level_idx = 0
        self.player = None; self.level = None; self.cam = None
        self.parts = Particles(); self.popups = []; self.hud = HUD()
        self.projectiles = []
        self.lives = 3
        self._dying = False
        self.respawn_timer = 0
        self.timer = 0
        self.rand_pop_timer = 0

    def load(self, idx, keep_lives=False):
        if not keep_lives: self.lives = 3
        self.level_idx = idx; self.level = Level(idx)
        self.player = Player(100, GROUND_Y-PLAYER_H)
        self.cam = Camera(self.level.width)
        self.parts.clear(); self.popups.clear(); self.projectiles.clear()
        logger.info("Loaded level %d (%s) | lives=%d keep=%s", idx, THEMES[idx]['name'], self.lives, keep_lives)

    def add_pop(self, x, y, t, c=(255,255,255)):
        self.popups.append(Popup(x, y, t, c))

    def run(self):
        try:
            while self.running:
                self.timer += 1
                for event in pygame.event.get():
                    if event.type == pygame.QUIT: self.running = False
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_ESCAPE:
                            if self.state in ('play', 'respawn'):
                                logger.info("ESC pressed -> menu (was %s)", self.state)
                                self.state = 'menu'
                            else: self.running = False
                        if event.key == pygame.K_RETURN:
                            if self.state == 'menu':
                                play('select'); self.load(0); self.state = 'play'
                                logger.info("ENTER menu -> play level 0")
                            elif self.state == 'win':
                                self.state = 'menu'
                                logger.info("ENTER win -> menu")
                            elif self.state == 'lvl_c':
                                self.level_idx += 1
                                if self.level_idx >= TOTAL_LVLS:
                                    self.state = 'win'
                                    logger.info("All levels cleared -> win screen")
                                else:
                                    play('select'); self.load(self.level_idx, keep_lives=True); self.state = 'play'
                                    logger.info("ENTER lvl_c -> next level %d", self.level_idx)
                            elif self.state == 'over':
                                play('select'); self.state = 'menu'
                                logger.info("ENTER over -> menu")

                # UPDATE
                if self.state == 'play':
                    self.update_game()
                elif self.state == 'respawn':
                    self.respawn_timer -= 1
                    if self.respawn_timer <= 0:
                        p = self.player
                        sp = (p.checkpoint, GROUND_Y-PLAYER_H) if p.checkpoint else (100, GROUND_Y-PLAYER_H)
                        logger.info("Respawn at x=%d y=%d (checkpoint=%s) lives=%d", sp[0], sp[1], p.checkpoint, self.lives)
                        p.fx, p.fy = sp
                        p.rect.x, p.rect.y = sp
                        p.vx = 0; p.vy = 0; p.health = 3; p.alive = True
                        p.inv_frames = 120
                        p.on_ground = True; p.jumping = False; p.jump_buffer = 0
                        self.cam.add_shake(5)
                        self.state = 'play'

                # DRAW
                screen.fill((0,0,0))
                if self.state == 'menu':
                    self.draw_menu()
                elif self.state == 'play':
                    self.draw_game()
                elif self.state == 'lvl_c':
                    self.draw_game()
                    self.draw_overlay("LEVEL COMPLETE!", (255,215,0), f"Score: {self.player.score}", "PRESS ENTER TO CONTINUE")
                elif self.state == 'over':
                    self.draw_game()
                    self.draw_overlay("GAME OVER", (255,50,50), f"Score: {self.player.score if self.player else 0}", "PRESS ENTER TO MENU")
                elif self.state == 'respawn':
                    self.draw_game()
                    p = self.player
                    if p:
                        lives_txt = f"x {self.lives}  " + ("♥" * self.lives)
                        shadow_txt(screen, lives_txt, 36, SCREEN_W//2, SCREEN_H//2, (255,80,80), (0,0,0), 3, True)
                        shadow_txt(screen, "RESPAWNING...", 22, SCREEN_W//2, SCREEN_H//2+50, (200,200,200), (0,0,0), 2, True)
                elif self.state == 'win':
                    self.draw_win()

                pygame.display.flip()
                self.clock.tick(FPS)
            logger.info("Game loop ended (running=%s)", self.running)
        except Exception as e:
            logger.exception("CRASH: %s", e)
            raise
        pygame.quit(); sys.exit()

    def player_die(self):
        if self._dying:
            logger.warning("player_die blocked by _dying flag")
            return
        self._dying = True
        try:
            p = self.player
            if not p or not p.alive:
                logger.warning("player_die blocked: p=%s alive=%s", p, p.alive if p else 'N/A')
                return
            play('death'); self.cam.add_shake(10)
            self.parts.burst(p.rect.centerx, p.rect.centery, (255,50,50), 20, 5, 30, 4, 0.2)
            p.health = 3; p.alive = False; p.inv_frames = 120; self.lives -= 1
            logger.info("Player died | lives=%d checkpoint=%s", self.lives, p.checkpoint)
            if self.lives > 0:
                self.state = 'respawn'
                self.respawn_timer = 90
            else:
                self.state = 'over'
                logger.info("Game over – no lives remaining")
        finally:
            self._dying = False

    def update_game(self):
        p = self.player; l = self.level
        if not p or not l: return
        p.update(l.platforms, self.parts, self.cam)
        # Shooting
        keys = pygame.key.get_pressed()
        if keys[pygame.K_f] or keys[pygame.K_j]:
            b = p.shoot()
            if b: self.projectiles.append(b)
        # QBlocks
        for q in l.qblocks:
            q.update()
            if not q.used and p.rect.colliderect(q.rect) and p.vy < 0:
                r = q.hit()
                if r is not None:
                    if r == 0: p.coins+=1; p.score+=100; play('coin'); self.parts.burst(q.rect.centerx, q.rect.top, (255,215,0), 6, 3, 15, 2, 0)
                    elif r == 1: p.has_dj=True; play('powerup'); self.parts.burst(q.rect.centerx, q.rect.top, (100,200,255), 10, 4, 20, 3, 0)
                    self.add_pop(q.rect.centerx, q.rect.top-10, '+100', (255,255,100))
                    logger.debug("QBlock hit at (%d,%d) reward=%d", q.rect.x, q.rect.y, r)
        # Fall
        if p.alive and p.inv_frames <= 0 and p.rect.top > SCREEN_H + 100:
            logger.info("Player fell off screen at x=%d", p.rect.x)
            p.health = 0; self.player_die()
        # Coins
        for c in l.coins:
            if c.update(p, self.parts): self.add_pop(c.rect.centerx, c.rect.y, '+100', (255,215,0))
        # Powerups
        for pu in l.powerups:
            if pu.update(p, self.parts): self.add_pop(pu.rect.centerx, pu.rect.y-10, 'POWER UP!', (100,200,255))
        # Enemies
        for e in l.enemies[:]:
            ok, bullet = e.update(l.platforms, self.parts, p)
            if bullet: self.projectiles.append(bullet)
            if not ok and not e.alive and e.death_timer <= 0: l.enemies.remove(e); continue
            if e.alive and p.alive and p.rect.colliderect(e.rect):
                if p.vy > 0 and p.rect.bottom <= e.rect.centery + 10:
                    e.die(self.parts); p.vy = -8; p.score += e.score_v; p.kills += 1; self.cam.add_shake(4)
                    self.add_pop(e.rect.centerx, e.rect.y-10, f'+{e.score_v}', (255,200,100))
                    logger.debug("Stomped enemy at (%d,%d) score=%d", e.rect.x, e.rect.y, e.score_v)
                elif p.invincible:
                    e.die(self.parts); p.score += e.score_v; p.kills += 1
                    self.add_pop(e.rect.centerx, e.rect.y-10, f'+{e.score_v}', (255,200,100))
                elif p.inv_frames <= 0:
                    p.health -= 1; p.inv_frames = 60; self.cam.add_shake(6); play('hit')
                    logger.debug("Player hit by enemy – health=%d", p.health)
                    if p.health <= 0: self.player_die()
            # Player bullets hit enemy
            for b in self.projectiles[:]:
                if not b.enemy and b.alive and e.alive and b.rect.colliderect(e.rect):
                    b.alive = False; e.die(self.parts); p.score += e.score_v; p.kills += 1
                    self.add_pop(e.rect.centerx, e.rect.y-10, f'+{e.score_v}', (255,200,100))
                    self.parts.burst(b.rect.centerx, b.rect.centery, (100,200,255), 6, 3, 15, 2, 0)
        # Enemy projectiles hit player
        for b in self.projectiles[:]:
            if b.enemy and b.alive and p.alive and p.rect.colliderect(b.rect):
                b.alive = False
                if p.inv_frames <= 0:
                    p.health -= 1; p.inv_frames = 60; self.cam.add_shake(8); play('hit')
                    self.parts.burst(b.rect.centerx, b.rect.centery, (255,50,50), 8, 3, 15, 2, 0)
                    if p.health <= 0: self.player_die()
        # Projectile update
        for b in self.projectiles[:]:
            b.update()
            if not b.alive: self.projectiles.remove(b)
        # Flag
        if l.flagpole.check(p):
            l.flagpole.reached = True; play('win')
            bonus = p.health * 500
            if p.coins >= l.mc: bonus += 1000; self.add_pop(l.flagpole.rect.centerx-30, l.flagpole.rect.y-50, '+1000 COINS!', (255,215,0))
            if p.kills >= l.me: bonus += 1000; self.add_pop(l.flagpole.rect.centerx+30, l.flagpole.rect.y-50, '+1000 KILLS!', (255,100,100))
            p.score += bonus
            self.add_pop(l.flagpole.rect.centerx, l.flagpole.rect.y-20, f'LEVEL {self.level_idx+1} COMPLETE!', (255,215,0))
            self.state = 'lvl_c'
            self.timer = 0
            logger.info("Flagpole reached – level %d complete (score=%d)", self.level_idx+1, p.score)
        # Checkpoints
        for cp in l.checkpoints:
            if not cp.reached and p.rect.centerx >= cp.x:
                cp.reached = True; p.checkpoint = cp.x; play('select')
                self.add_pop(cp.x, GROUND_Y-70, 'CHECKPOINT!', (100,255,100))
                logger.info("Checkpoint activated at x=%d", cp.x)
        # Camera
        self.cam.follow(p)
        self.popups = [pp for pp in self.popups if pp.alive]
        for pp in self.popups: pp.update()
        self.parts.update()
        self.rand_pop_timer -= 1
        if self.rand_pop_timer <= 0 and p.alive:
            self.rand_pop_timer = random.randint(30, 80)
            texts = ['+1', '✨', '★', '♪', '+2', '💫', '⚡', '🔥', '0', '42', '7', '🍀', '★']
            t = random.choice(texts)
            cx = p.rect.centerx + random.randint(-60, 60)
            cy = p.rect.centery + random.randint(-80, 20)
            self.add_pop(cx, cy, t, (random.randint(200,255), random.randint(150,255), random.randint(100,255)))


    def draw_menu(self):
        for y in range(SCREEN_H):
            t = y/SCREEN_H
            pygame.draw.line(screen, (int(30+100*t), int(20+80*t), int(60+150*t)), (0,y), (SCREEN_W,y))
        for i in range(20):
            x = (i*137+self.timer*0.5)%SCREEN_W; y = (i*89+math.sin(self.timer*0.02+i)*50)%SCREEN_H
            s = pygame.Surface((12,12), pygame.SRCALPHA)
            pygame.draw.circle(s, (min(255,100+i*10),200,255,min(80,20+i*3)), (6,6), 6)
            screen.blit(s, (x,y))
        shadow_txt(screen, "SUPER PIXEL QUEST", 72, SCREEN_W//2, 130, (255,215,0), (100,80,0), 4, True)
        shadow_txt(screen, "~ Modern 2D Platformer ~", 28, SCREEN_W//2, 190, (200,200,255), (0,0,0), 2, True)
        a = 128+127*math.sin(self.timer*0.025)
        s = pygame.Surface((350,30), pygame.SRCALPHA)
        shadow_txt(s, "PRESS ENTER TO START", 26, 175, 15, (255,255,255), (0,0,0), 2, True)
        s.set_alpha(int(a)); screen.blit(s, (SCREEN_W//2-175, 310))
        ctrl = ["ARROW KEYS / WASD - Move","SPACE / UP / W - Jump (hold for higher)","F / J - Shoot", "COLLECT COINS - DEFEAT ENEMIES","REACH THE FLAGPOLE TO WIN"]
        for i,t in enumerate(ctrl): shadow_txt(screen, t, 20, SCREEN_W//2, 390+i*30, (180,180,180), (0,0,0), 1, True)
        shadow_txt(screen, f"{TOTAL_LVLS} LEVELS WITH UNIQUE THEMES", 18, SCREEN_W//2, 530, (150,150,200), (0,0,0), 1, True)

    def draw_game(self):
        if not self.level or not self.player: return
        ox, _ = self.cam.off() if self.cam else (0,0)
        self.level.draw_bg(screen, ox)
        self.level.draw_ground(screen, ox)
        self.level.draw_plats(screen, ox)
        for p in self.level.pipes: p.draw(screen, ox, 0)
        for q in self.level.qblocks: q.draw(screen, ox, 0)
        for cp in self.level.checkpoints: cp.draw(screen, ox)
        for c in self.level.coins: c.draw(screen, ox, 0)
        for pu in self.level.powerups: pu.draw(screen, ox, 0)
        for e in self.level.enemies: e.draw(screen, ox, 0)
        for b in self.projectiles: b.draw(screen, ox, 0)
        self.level.flagpole.draw(screen, ox, 0)
        self.player.draw(screen, ox, 0)
        self.parts.draw(screen, ox, 0)
        for pp in self.popups: pp.draw(screen, ox, 0)
        self.hud.draw(screen, self.player, self.level, self.lives)

    def draw_overlay(self, title, tcolor, score, prompt):
        s = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA); s.fill((0,0,0,130)); screen.blit(s, (0,0))
        pw, ph = 400, 220; px, py = (SCREEN_W-pw)//2, (SCREEN_H-ph)//2
        rr(screen, (0,0,0,200), (px, py, pw, ph), 16)
        rr(screen, (*tcolor[:3], 30), (px+2, py+2, pw-4, ph-4), 15)
        shadow_txt(screen, title, 48, SCREEN_W//2, py+50, tcolor, (0,0,0), 3, True)
        shadow_txt(screen, score, 26, SCREEN_W//2, py+110, (255,255,255), (0,0,0), 2, True)
        shadow_txt(screen, prompt, 22, SCREEN_W//2, py+ph-25, (200,200,200), (0,0,0), 2, True)

    def draw_win(self):
        for y in range(SCREEN_H):
            t = y/SCREEN_H; pygame.draw.line(screen, (int(20+40*t), int(10+30*t), int(40+80*t)), (0,y), (SCREEN_W,y))
        for i in range(30):
            x = (i*97+self.timer*0.3)%SCREEN_W; y = (i*53+math.sin(self.timer*0.02+i*2)*150)%SCREEN_H
            c = [(255,215,0),(255,100,100),(100,200,255),(100,255,100)][i%4]
            pygame.draw.circle(screen, c, (int(x), int(y)), random.randint(2,4))
        draw_glow(screen, (255,215,0), (SCREEN_W//2, 180), 150, 50)
        shadow_txt(screen, "YOU WIN!", 80, SCREEN_W//2, 160, (255,215,0), (0,0,0), 4, True)
        shadow_txt(screen, "All 4 levels completed!", 28, SCREEN_W//2, 240, (255,255,255), (0,0,0), 2, True)
        if self.player: shadow_txt(screen, f"Final Score: {self.player.score}", 32, SCREEN_W//2, 290, (200,200,255), (0,0,0), 2, True)
        shadow_txt(screen, "PRESS ENTER TO MENU", 28, SCREEN_W//2, 480, (200,200,200), (0,0,0), 2, True)

if __name__ == "__main__":
    try:
        Game().run()
    except Exception as e:
        log_err(e)
        logger.info("=== Game terminated with error ===")
        raise
    finally:
        logging.shutdown()
