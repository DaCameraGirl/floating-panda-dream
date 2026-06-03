from __future__ import annotations

import math
import random
from dataclasses import dataclass

from direct.gui.OnscreenText import OnscreenText
from direct.showbase.ShowBase import ShowBase
from direct.task import Task
from panda3d.core import (
    AmbientLight,
    CardMaker,
    DirectionalLight,
    LColor,
    TextNode,
    TransparencyAttrib,
    Vec3,
    WindowProperties,
)


LANE_Y = 14
PLAY_MIN_X = -9.0
PLAY_MAX_X = 9.0
PLAY_MIN_Z = -4.5
PLAY_MAX_Z = 7.5


@dataclass
class ArcadeObject:
    kind: str
    node: object
    pos: Vec3
    radius: float
    value: int
    drift: float = 0.0
    taken: bool = False


class FloatingPandaDream(ShowBase):
    def __init__(self) -> None:
        super().__init__()

        props = WindowProperties()
        props.setTitle("Floating Panda Dream")
        props.setSize(1000, 700)
        self.win.requestProperties(props)

        self.disableMouse()
        self.setBackgroundColor(0.05, 0.06, 0.13, 1)
        self.rng = random.Random(42)

        self.keys = {
            "left": False,
            "right": False,
            "up": False,
            "down": False,
            "dash": False,
        }
        self.score = 0
        self.streak = 0
        self.energy = 100
        self.time_left = 75.0
        self.elapsed = 0.0
        self.game_over = False
        self.dash_cooldown = 0.0

        self.objects: list[ArcadeObject] = []
        self.player_pos = Vec3(0, LANE_Y, 0)
        self.player_velocity = Vec3(0, 0, 0)

        self._setup_lights()
        self._build_world()
        self._build_player()
        self._build_hud()
        self._bind_input()
        self._restart_world()

        self.taskMgr.add(self._update, "game-update")

    def _setup_lights(self) -> None:
        ambient = AmbientLight("ambient")
        ambient.setColor(LColor(0.34, 0.37, 0.55, 1))
        self.render.setLight(self.render.attachNewNode(ambient))

        moon = DirectionalLight("moon")
        moon.setColor(LColor(0.85, 0.9, 1.0, 1))
        moon_np = self.render.attachNewNode(moon)
        moon_np.setHpr(-35, -55, 0)
        self.render.setLight(moon_np)

    def _build_world(self) -> None:
        self.sky_cards = []
        for i in range(5):
            card = self._make_card(
                f"sky_island_{i}",
                size=1.0,
                color=(0.12 + i * 0.025, 0.14, 0.28 + i * 0.04, 0.82),
            )
            card.setScale(4.2, 1, 1.2)
            card.setPos(-8 + i * 4.2, LANE_Y + 4.5, -5.7 - (i % 2) * 0.35)
            self.sky_cards.append(card)

        self.moon = self._make_card("moon", 1.0, (1.0, 0.86, 0.44, 0.92))
        self.moon.setScale(1.6)
        self.moon.setPos(7.5, LANE_Y + 6, 7.5)

    def _build_player(self) -> None:
        try:
            self.panda = self.loader.loadModel("panda")
        except Exception:
            self.panda = self._make_card("fallback_panda", 1.0, (0.92, 0.92, 0.96, 1))
            self.panda.setScale(1.2, 1, 0.8)

        self.panda.reparentTo(self.render)
        self.panda.setScale(0.22)
        self.panda.setPos(self.player_pos)
        self.panda.setH(180)

        self.trail = self._make_card("dream_trail", 0.45, (0.38, 0.85, 1.0, 0.45))
        self.trail.setPos(self.player_pos + Vec3(0, -0.1, -0.45))

    def _build_hud(self) -> None:
        self.title_text = OnscreenText(
            text="FLOATING PANDA DREAM",
            pos=(-1.28, 0.92),
            scale=0.052,
            fg=(0.67, 0.91, 1.0, 1),
            align=TextNode.ALeft,
        )
        self.status_text = OnscreenText(
            text="",
            pos=(-1.28, 0.83),
            scale=0.044,
            fg=(1.0, 0.86, 0.45, 1),
            align=TextNode.ALeft,
            mayChange=True,
        )
        self.help_text = OnscreenText(
            text="WASD/ARROWS move  |  SPACE dash  |  R restart  |  ESC quit",
            pos=(0, -0.92),
            scale=0.04,
            fg=(0.78, 0.78, 0.9, 1),
            align=TextNode.ACenter,
        )
        self.message_text = OnscreenText(
            text="",
            pos=(0, 0.0),
            scale=0.072,
            fg=(1.0, 0.55, 0.86, 1),
            align=TextNode.ACenter,
            mayChange=True,
        )

    def _bind_input(self) -> None:
        bindings = {
            "arrow_left": ("left", True),
            "arrow_left-up": ("left", False),
            "a": ("left", True),
            "a-up": ("left", False),
            "arrow_right": ("right", True),
            "arrow_right-up": ("right", False),
            "d": ("right", True),
            "d-up": ("right", False),
            "arrow_up": ("up", True),
            "arrow_up-up": ("up", False),
            "w": ("up", True),
            "w-up": ("up", False),
            "arrow_down": ("down", True),
            "arrow_down-up": ("down", False),
            "s": ("down", True),
            "s-up": ("down", False),
            "space": ("dash", True),
            "space-up": ("dash", False),
        }
        for event, payload in bindings.items():
            self.accept(event, self._set_key, payload)

        self.accept("r", self._restart_world)
        self.accept("escape", self.userExit)

    def _restart_world(self) -> None:
        for obj in self.objects:
            obj.node.removeNode()
        self.objects.clear()

        self.score = 0
        self.streak = 0
        self.energy = 100
        self.time_left = 75.0
        self.elapsed = 0.0
        self.game_over = False
        self.dash_cooldown = 0.0
        self.player_pos = Vec3(0, LANE_Y, 0)
        self.player_velocity = Vec3(0, 0, 0)
        self.message_text.setText("")

        for _ in range(18):
            self._spawn_object("candy")
        for _ in range(8):
            self._spawn_object("ring")
        for _ in range(7):
            self._spawn_object("ghost")

    def _spawn_object(self, kind: str) -> None:
        x = self.rng.uniform(PLAY_MIN_X, PLAY_MAX_X)
        z = self.rng.uniform(PLAY_MIN_Z, PLAY_MAX_Z)
        pos = Vec3(x, LANE_Y + self.rng.uniform(-0.7, 0.7), z)

        if kind == "candy":
            node = self._make_card("moon_candy", 0.32, (1.0, 0.68, 0.22, 0.95))
            value = 50
            radius = 0.65
        elif kind == "ring":
            node = self._make_card("lantern_ring", 0.52, (0.35, 0.95, 1.0, 0.7))
            value = 150
            radius = 0.82
        else:
            node = self._make_card("ghost_cloud", 0.72, (0.82, 0.82, 0.92, 0.58))
            value = -20
            radius = 0.9

        node.setPos(pos)
        self.objects.append(
            ArcadeObject(
                kind=kind,
                node=node,
                pos=pos,
                radius=radius,
                value=value,
                drift=self.rng.uniform(0.7, 1.5),
            )
        )

    def _make_card(self, name: str, size: float, color: tuple[float, float, float, float]):
        maker = CardMaker(name)
        maker.setFrame(-size, size, -size, size)
        node = self.render.attachNewNode(maker.generate())
        node.setColor(*color)
        node.setTransparency(TransparencyAttrib.MAlpha)
        node.setBillboardPointEye()
        return node

    def _set_key(self, key: str, value: bool) -> None:
        self.keys[key] = value

    def _update(self, task) -> int:
        dt = globalClock.getDt()
        self.elapsed += dt

        if not self.game_over:
            self.time_left = max(0.0, self.time_left - dt)
            self._update_player(dt)
            self._update_objects(dt)
            self._check_collisions()
            if self.time_left <= 0 or self.energy <= 0:
                self.game_over = True
                self.message_text.setText(f"Dream over! Score {self.score}  |  Press R")

        self._update_camera()
        self._update_hud()
        return Task.cont

    def _update_player(self, dt: float) -> None:
        direction = Vec3(0, 0, 0)
        if self.keys["left"]:
            direction.x -= 1
        if self.keys["right"]:
            direction.x += 1
        if self.keys["up"]:
            direction.z += 1
        if self.keys["down"]:
            direction.z -= 1

        if direction.lengthSquared() > 0:
            direction.normalize()

        speed = 8.0
        if self.keys["dash"] and self.dash_cooldown <= 0 and direction.lengthSquared() > 0:
            self.player_velocity += direction * 11.0
            self.dash_cooldown = 0.55

        self.dash_cooldown = max(0.0, self.dash_cooldown - dt)
        self.player_velocity += direction * speed * dt * 8.0
        self.player_velocity *= 0.88
        self.player_pos += self.player_velocity * dt
        self.player_pos.x = max(PLAY_MIN_X, min(PLAY_MAX_X, self.player_pos.x))
        self.player_pos.z = max(PLAY_MIN_Z, min(PLAY_MAX_Z, self.player_pos.z))

        bob = math.sin(self.elapsed * 4.0) * 0.22
        self.panda.setPos(self.player_pos + Vec3(0, 0, bob))
        self.panda.setH(180 - self.player_velocity.x * 5.5)
        self.panda.setR(-self.player_velocity.x * 2.0)
        self.trail.setPos(self.player_pos + Vec3(-self.player_velocity.x * 0.03, -0.2, -0.55))

    def _update_objects(self, dt: float) -> None:
        for obj in self.objects:
            if obj.taken:
                continue
            wobble = math.sin(self.elapsed * obj.drift + obj.pos.x) * 0.14
            if obj.kind == "ghost":
                obj.pos.x += math.sin(self.elapsed * obj.drift + obj.pos.z) * dt * 0.9
            obj.node.setPos(obj.pos + Vec3(0, 0, wobble))
            obj.node.setH(obj.node.getH() + dt * (60 if obj.kind != "ghost" else -35))

    def _check_collisions(self) -> None:
        for obj in self.objects:
            if obj.taken:
                continue
            dx = self.player_pos.x - obj.pos.x
            dz = self.player_pos.z - obj.pos.z
            if math.sqrt(dx * dx + dz * dz) > obj.radius:
                continue

            if obj.kind == "ghost":
                self.energy = max(0, self.energy - 18)
                self.streak = 0
                obj.pos.x = self.rng.uniform(PLAY_MIN_X, PLAY_MAX_X)
                obj.pos.z = self.rng.uniform(PLAY_MIN_Z, PLAY_MAX_Z)
                self.message_text.setText("ghost bump!")
            else:
                obj.taken = True
                obj.node.hide()
                self.streak += 1
                bonus = min(self.streak, 10) * 10
                self.score += obj.value + bonus
                self.message_text.setText("streak x%s" % self.streak)
                self._spawn_object(obj.kind)

    def _update_camera(self) -> None:
        self.camera.setPos(self.player_pos.x * 0.35, -18, self.player_pos.z + 3.2)
        self.camera.lookAt(self.player_pos + Vec3(0, 0, 0.6))

    def _update_hud(self) -> None:
        self.status_text.setText(
            "Score %s   Streak x%s   Energy %s   Time %02d"
            % (self.score, self.streak, self.energy, int(self.time_left))
        )


if __name__ == "__main__":
    FloatingPandaDream().run()
