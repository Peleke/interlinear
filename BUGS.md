# Known Bugs

## Active Issues

### Sentence Highlighting Not Working During Audio Playback
**Status**: Investigating
**Priority**: Medium
**Discovered**: Epic 4 implementation

**Description**:
Sentences should highlight with golden background as audio plays, but highlighting doesn't appear during playback.

**Expected Behavior**:
- Current sentence highlights with `bg-gold-100`
- Highlight moves from sentence to sentence
- Auto-scrolls to keep current sentence visible

**Actual Behavior**:
- No highlighting appears during playback

**Possible Causes**:
1. Playback callback interval dependency issue (only runs when `isPlaying` changes, not continuously)
2. Timing calculation may be incorrect
3. Sentence grouping may not match audio timing
4. State updates not triggering re-renders

**Investigation Notes**:
- AudioPlayer interval depends on `[isPlaying, onPlaybackChange]`
- Should run continuously during playback, not just on state change
- Need to verify callback is actually firing

**Potential Fix**:
Remove `isPlaying` from interval useEffect dependencies, or add another state trigger.

---

## Fixed Issues

_None yet_
