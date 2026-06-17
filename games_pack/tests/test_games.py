import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pygame
import pytest

pygame.init()
screen = pygame.display.set_mode((100, 100))

from games import GAMES

def test_all_games_import():
    assert len(GAMES) == 15

@pytest.mark.parametrize("name, game_class", GAMES)
def test_game_creation(name, game_class):
    game = game_class()
    assert hasattr(game, "reset")
    assert hasattr(game, "handle_event")
    assert hasattr(game, "update")
    assert hasattr(game, "draw")
    assert hasattr(game, "run")
    assert hasattr(game, "width")
    assert hasattr(game, "height")
    assert game.width > 0
    assert game.height > 0

@pytest.mark.parametrize("name, game_class", GAMES)
def test_game_reset(name, game_class):
    game = game_class()
    game.reset()
    assert hasattr(game, "game_over")

@pytest.mark.parametrize("name, game_class", GAMES)
def test_game_event_handling(name, game_class):
    game = game_class()
    event = pygame.event.Event(pygame.KEYDOWN, {"key": pygame.K_r})
    game.handle_event(event)
    event = pygame.event.Event(pygame.KEYDOWN, {"key": pygame.K_q})

@pytest.mark.parametrize("name, game_class", GAMES)
def test_game_update(name, game_class):
    game = game_class()
    game.update()

@pytest.mark.parametrize("name, game_class", GAMES)
def test_game_draw(name, game_class):
    game = game_class()
    game.draw(screen)

@pytest.mark.parametrize("name, game_class", GAMES)
def test_game_properties(name, game_class):
    game = game_class()
    assert isinstance(game.game_over, bool)
    assert game.width >= 200
    assert game.height >= 200

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
