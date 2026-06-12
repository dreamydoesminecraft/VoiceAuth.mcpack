Attaching VoiceAuth animation controller

The Resource Pack includes an `animation_controllers/vc_state_controllers.json` and
an `animations/vc_state_query.json` which manage the `voiceauth_is_unlocked` state.

To attach the controller to the player entity (so animations/queries run for players):

1. In your player entity JSON (or a cloned player entity used by the pack), add:

   "animation_controllers": {
     "controller.voiceauth.state": "controller.animation.voiceauth.state"
   }

2. Ensure the controller file path matches `animation_controllers/vc_state_controllers.json` in this RP.

3. The controller emits `/event entity @s voiceauth_lock` and `/event entity @s voiceauth_unlock`.

Notes
- Attaching controllers to the built-in player entity may not be supported on all platforms; consider applying the controller to a custom entity or use the controller in UI elements.
- Alternatively, use `player.setDynamicProperty("voiceauth_is_unlocked", ...)` from scripts to mirror unlocked state to animations.
