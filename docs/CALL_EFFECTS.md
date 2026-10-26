# Call reactions and Snap

Available in the shared call stage used by direct, group and Pod calls. Open **Reactions** while in a call. Reaction buttons also work with the camera off.

## Use the camera effects

1. Turn on your camera, open Reactions, then enable **Camera magic**. The first load prepares the local vision models.
2. Choose **Set up background**, keep the camera still and step completely out of view. The countdown gives you three seconds; capture waits until the person mask sees an empty frame. Come back into view when the background is ready.
3. Touch thumb and middle finger together and release quickly, keeping the hand visible. This visual snap dissolves your person mask into particles. Snap again to reappear. The **Try Snap / Snap back** buttons do the same thing; **Return instantly** is always available while invisible.
4. Show a thumbs up, a two-hand heart, a peace sign, or hold an open palm. You can also trace a closed heart with your index finger. Brief movements are ignored; reactions have a cooldown and require a neutral hand before repeating.

Capture must be repeated after switching the camera or changing portrait/landscape dimensions. This effect reveals a real captured background; it cannot infer furniture hidden behind your body. Keep the device still and use reasonable lighting. Camera-based snap recognition can miss very fast finger movements, particularly on slow devices; buttons remain available.

Camera effects start off on each call. Turning them off restores the original LiveKit camera track. Switching away from the browser tab disables them, releasing model resources. They can be enabled again on return. Muting the camera suspends processing; screen sharing uses a separate untouched track. The microphone is unaffected. The camera stays active while you are invisible so another gesture can bring you back.

## Implementation

- `CallEffectsProcessor` implements the installed LiveKit track processor interface. Processing happens before the published video is encrypted by the existing LiveKit pipeline. Peers receive the processed camera stream without needing the models themselves.
- Hand landmarks and foreground confidence masks run in a dedicated worker using pinned, same-origin MediaPipe assets. Raw frames, landmarks, background plates and masks stay in memory on the sending device. No inference API, recording, camera upload or new backend data collection is added.
- A canvas compositor keeps the captured room visible while dissolving only the foreground. The output preserves the source aspect ratio, with a longest edge of at most 960 pixels and 25 FPS. Inference is bounded and adapts its interval to processing time; at most one bitmap is in flight.
- Ordinary reactions use a versioned LiveKit data topic. Names and identity come from the actual room participant, not supplied payload fields. Packets are size limited, validated, deduplicated and rate limited per sender. Effects are decorative and never change another participant's camera or call permissions.
- The panel follows the existing cream, plum and muted-teal palette. It becomes a bottom sheet on mobile, traps keyboard focus, supports Escape, and follows the system reduced-motion preference. **Gentle motion** replaces particle effects with a soft fade and static reaction icons.
- Model/worker failure restores the original camera through the SDK. The rest of the call can continue, and reaction buttons stay available. Hand recognition and clean segmentation vary with lighting, occlusion, camera quality and processing speed.

The production CSP includes `wasm-unsafe-eval` for the local WebAssembly runtime; it does not enable general JavaScript eval in production. The existing worker policy already permits same-origin workers.

## Assets and reproducibility

`@mediapipe/tasks-vision` is pinned to 0.10.32. `scripts/setup-call-effects.mjs` copies its browser runtime and downloads version-1 hand/segmentation models, verifying fixed SHA-256 hashes. The ready-to-serve files are included in `public/call-effects`; production does not fetch models from a third-party host at runtime. Original source URLs and hashes are in `assets.json`. Apache licensing notices accompany the runtime.

To refresh/reproduce assets after installing dependencies:

```powershell
node scripts/setup-call-effects.mjs
```

## Verification (26 October 2026)

- Eight domain tests cover snap timing, cooldowns, lost tracking, held reactions, heart tracing, packet validation, replay protection and dissolve endpoints. The existing eleven calling-domain tests also pass.
- Headless Chromium tests load both actual MediaPipe models under a production-style CSP, identify people and hands in checksum-verified official Google fixtures, and verify an empty background.
- Canvas tests confirm that background pixels remain identical when the person disappears and that returning restores the person. Resizing invalidates the background plate.
- A real `LocalVideoTrack.setProcessor` and two local WebRTC peers verify that the receiver gets the processed 640×360 video, and that `stopProcessor` restores the original sender while keeping its source alive.
- Processor lifecycle tests verify live output, successful empty-background capture and disposal of owned output/model resources without stopping the input camera.
- The actual React effects panel is tested at desktop and 390×844 mobile sizes, including reaction and return controls, no horizontal overflow, focus cycling, Escape and gentle motion.
- These tests use synthetic camera input and official test photos, with no access to the user's camera or microphone. A live multi-person call with physical finger gestures and phone cameras remains a useful acceptance test; it has not been performed by this automated harness.
- Deliberately failing the model download leaves the original LiveKit camera and sender alive. Voice-call UI checks confirm that reaction buttons remain usable with the camera switch disabled.
- The production build, TypeScript checks and the existing 47 source/contract checks passed. Targeted lint reports no errors; the call stage retains its existing broad-type warnings.

Run:

```powershell
node --experimental-strip-types --test tests/call-effects-domain.test.ts tests/calls-domain.test.ts
node scripts/setup-call-effects-test-assets.mjs
$env:CALL_EFFECTS_MODEL_FIXTURES='1'
# Optional if Chromium is installed in a different location:
# $env:CALL_EFFECTS_CHROMIUM='C:/path/to/chrome.exe'
node tests/call-effects.browser.mjs
```

The browser harness creates its fixtures and screenshots under ignored `test-results/call-effects/`. It uses an isolated local server and does not create calls, users, posts or Appwrite records.

References: [LiveKit custom video processing](https://github.com/livekit/track-processors-js), [MediaPipe hand landmarks](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js), [MediaPipe segmentation](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js).
