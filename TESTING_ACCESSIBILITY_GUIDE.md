# Pod Video & Whiteboard - Testing & Accessibility Guide

## Phase 2.8 Testing & Polish Documentation

### Functional Testing Checklist

#### Video Conferencing Tests
- [ ] Join meeting without camera/mic permission (should request)
- [ ] Join meeting with camera/mic enabled
- [ ] Toggle camera on/off during session
- [ ] Toggle microphone on/off during session
- [ ] Share screen functionality
- [ ] Leave session and verify cleanup
- [ ] Connection quality indicator updates correctly
- [ ] Participant count increments/decrements correctly
- [ ] Error states display with retry option
- [ ] Waiting for host state displays properly
- [ ] Reconnection attempts work (up to 3 tries)
- [ ] Fullscreen mode on desktop
- [ ] Mobile controls are all accessible (44x44px+)

#### Whiteboard Tests
- [ ] Draw with pen tool
- [ ] Draw shapes (square, circle)
- [ ] Use text tool
- [ ] Use eraser tool
- [ ] Pan/move canvas with select tool
- [ ] Undo/redo functionality works
- [ ] Color picker selects colors correctly
- [ ] Line width adjustment works
- [ ] Zoom in/out functionality
- [ ] Reset view returns to defaults
- [ ] Export to PNG downloads correctly
- [ ] Save to localStorage persists data
- [ ] Clear canvas with confirmation dialog
- [ ] Template shapes insert correctly (grid, flowchart, mindmap)
- [ ] Touch drawing works on mobile/tablet
- [ ] Responsive canvas sizing on breakpoints

#### UI/UX Tests
- [ ] Tab switching works (Overview, Classroom, Activity, etc)
- [ ] Sidebar tabs switch properly (Controls, Members, Notes)
- [ ] Resources load and display correctly
- [ ] Quick action buttons are functional
- [ ] Session controls visible when in session
- [ ] No overlapping UI elements

### Browser Compatibility

Test across these browsers:
- [ ] Chrome 120+ (Latest)
- [ ] Firefox 121+ (Latest)
- [ ] Safari 17+ (Latest on macOS/iOS)
- [ ] Edge 120+ (Latest)

### Device Testing

**Mobile (Small screens < 640px):**
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] Pixel 6 (412px)
- Video controls are 44x44px minimum
- Whiteboard toolbar collapses
- Sidebar stacks properly

**Tablet (Medium screens 640-1024px):**
- [ ] iPad (768px width)
- [ ] Android tablets
- Classroom layout uses md breakpoint
- Sidebar visible on right

**Desktop (Large screens > 1024px):**
- [ ] 1280px viewport
- [ ] 1920px viewport
- Full 3-column layout
- All controls visible

### Performance Testing

```javascript
// Measure performance
const startTime = performance.now()
// ... video/whiteboard operations
const endTime = performance.now()
console.log(`Operation took ${endTime - startTime}ms`)
```

Performance targets:
- [ ] Video join: < 3 seconds
- [ ] Whiteboard draw response: < 100ms
- [ ] Page load: < 3 seconds
- [ ] Undo/redo: < 50ms
- [ ] Export canvas: < 1 second
- [ ] Memory usage with 10+ sessions: < 200MB

### Accessibility (WCAG 2.1 AA)

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in menus
- [ ] Escape closes dialogs/dropdowns
- [ ] No keyboard traps
- [ ] Logical tab order

#### Screen Reader Support
- [ ] All buttons have aria-labels
- [ ] Form inputs have labels
- [ ] Icons have aria-labels
- [ ] Status updates announced (joining, reconnecting)
- [ ] Errors announced immediately
- [ ] Loading states announced

#### Visual Design
- [ ] Color contrast ratio ≥ 4.5:1 (normal text)
- [ ] Color contrast ratio ≥ 3:1 (large text)
- [ ] Don't rely solely on color to convey info
- [ ] Focus indicators visible and clear
- [ ] Text is resizable to 200% without breaking layout
- [ ] No content hidden from zoom

#### Touch Targets
- [ ] All buttons ≥ 44x44px
- [ ] Spacing between targets ≥ 8px
- [ ] Touch targets labeled clearly
- [ ] Double-tap zoom disabled on buttons

### ARIA Attributes

Add to components:

```html
<!-- Video Conference -->
<div role="region" aria-label="Video conference controls">
  <button aria-label="Mute audio" aria-pressed="false">
    <Icon />
  </button>
</div>

<!-- Whiteboard -->
<div role="application" aria-label="Drawing canvas">
  <canvas aria-label="Interactive whiteboard for collaboration" />
</div>

<!-- Status Updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  Connecting to session...
</div>
```

### Error Handling Tests

- [ ] No camera/mic permission: Show clear message
- [ ] Network timeout: Show retry option
- [ ] Jitsi fails to load: Show fallback UI
- [ ] Canvas export fails: Show error toast
- [ ] Appwrite sync fails: Continue offline
- [ ] Meeting ended by host: Show message

### Edge Cases

- [ ] Join while video still loading
- [ ] Switch tabs while in session
- [ ] Close tab/window during session
- [ ] Rapid clicking of controls
- [ ] Very large number of participants
- [ ] Low bandwidth scenarios
- [ ] Device rotation on mobile
- [ ] Browser minimize/refocus
- [ ] Network reconnection
- [ ] Clock drift on timer

### Testing Commands

```bash
# Run type checking
pnpm run type-check

# Lint code
pnpm run lint

# Check a11y with axe
pnpm dlx axe-core https://localhost:3000/app/pods/[podId]

# Test with Google Lighthouse
pnpm run lighthouse

# Test accessibility with pa11y
pnpm dlx pa11y https://localhost:3000/app/pods/[podId]
```

### Manual Testing Workflow

1. **Setup**
   ```bash
   pnpm run dev
   # Open http://localhost:3000
   # Log in with test account
   ```

2. **Test Video**
   - Open pod detail page
   - Click "Classroom" tab
   - Click "Join Session"
   - Test camera/audio/screen share
   - Test mobile layout (F12 > Toggle device toolbar)

3. **Test Whiteboard**
   - Switch to "Whiteboard" view
   - Test drawing tools
   - Test export and templates

4. **Test Accessibility**
   - Disable mouse, use keyboard only
   - Enable screen reader (MacOS: Cmd+F5, Windows: NVDA)
   - Check color contrast with ColorOracle

### Known Issues & Limitations

1. **Virtual Backgrounds**
   - Requires Jitsi PRO subscription
   - Disabled in UI with opacity-50

2. **Recording**
   - Requires Jitsi PRO subscription
   - Disabled in UI with opacity-50

3. **Real-time Sync**
   - Whiteboard sync via Appwrite subscriptions (beta)
   - May have 500ms+ latency on poor networks

4. **Participant Count**
   - Tracked locally, may be out of sync
   - Full sync via Appwrite subscriptions

5. **Export Limitations**
   - PNG only (no PDF)
   - Limited to canvas size (max 4096x4096)
   - May require multiple exports for large whiteboards

### Success Metrics

After Phase 2.8, the pod video/whiteboard system should have:

✅ **Functionality**: 100% of core features working
✅ **Performance**: Page loads < 3s, zero jank
✅ **Accessibility**: WCAG AA compliant
✅ **Mobile**: Fully responsive, 44x44px targets
✅ **Reliability**: Handles network errors gracefully
✅ **UX**: Intuitive controls, clear feedback
✅ **Documentation**: Complete API docs and guides

### Deployment Checklist

Before deploying to production:

- [ ] Run full test suite
- [ ] Check Lighthouse score (>90)
- [ ] Verify all error messages are user-friendly
- [ ] Test on real devices (not just emulator)
- [ ] Check loading states for slow networks
- [ ] Verify GDPR/privacy compliance (no analytics tracking)
- [ ] Set up error logging (Sentry/etc)
- [ ] Create user documentation
- [ ] Set up monitoring and alerts
- [ ] Plan rollback strategy

---

## Next Steps

After Phase 2.8 completion:
- Phase 3: Analytics & Insights
- Phase 4: Advanced Features (breakout rooms, etc)
- Phase 5: Performance Optimization
