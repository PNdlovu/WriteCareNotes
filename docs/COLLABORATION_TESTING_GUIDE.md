# Testing Guide
## Real-Time Collaboration - Feature 2

**Version:** 1.0.0  
**Date:** October 7, 2025  
**Author:** WriteCareNotes Development Team

---

## Overview

This guide provides comprehensive testing procedures for the real-time policy collaboration system. It covers multi-user scenarios, manual testing checklists, expected behaviors, and edge case validation.

---

## Setup

### Prerequisites

1. **Backend Server Running:**
   ```bash
   npm run dev
   # Server should be running on http://localhost:5000
   ```

2. **Database Migrated:**
   ```bash
   npm run typeorm migration:run
   # Verify CollaborationSession and PolicyComment tables exist
   ```

3. **Multiple Test Users:**
   - User A: Primary tester
   - User B: Secondary tester
   - User C: Optional third tester
   - User D & E: Load testing (5+ users)

4. **Multiple Browser Instances:**
   - Chrome (normal window)
   - Chrome (incognito)
   - Firefox
   - Edge
   - Or use multiple devices

---

## Multi-User Test Scenarios

### Scenario 1: Two-User Basic Collaboration (15 minutes)

**Objective:** Verify basic session join, presence tracking, and commenting.

**Steps:**

1. **User A joins session:**
   - Navigate to policy detail page
   - Click "Start Collaboration" button
   - Verify session starts (green indicator)
   - Verify User A appears in active users list

2. **User B joins session:**
   - Navigate to same policy detail page
   - Click "Join Collaboration" button
   - Verify User B appears in User A's active users list
   - Verify User A appears in User B's active users list

3. **User A adds comment:**
   - Select text in policy document
   - Click "Add Comment" button
   - Enter comment: "This needs review"
   - Select comment type: "Suggestion"
   - Submit comment
   - Verify comment appears in User A's comment list
   - **Expected:** User B receives `comment_added` WebSocket event
   - **Expected:** User B sees new comment in real-time (no refresh)
   - **Expected:** User B receives toast notification "💬 New comment added"

4. **User B replies to comment:**
   - Click "Reply" button on User A's comment
   - Enter reply: "I agree, let's update it"
   - Submit reply
   - Verify reply appears nested under original comment
   - **Expected:** User A receives notification
   - **Expected:** Reply count increments

5. **User A moves cursor:**
   - Click different sections of the document
   - Move cursor to line 20, column 5
   - **Expected:** User B sees User A's cursor position overlay
   - **Expected:** User B sees User A's name next to cursor
   - **Expected:** Cursor color matches User A's assigned color

6. **User B leaves session:**
   - Click "Leave Collaboration" button
   - **Expected:** User A receives `user_left` WebSocket event
   - **Expected:** User A sees "👋 User B left the collaboration" notification
   - **Expected:** User B removed from active users list

**Pass Criteria:**
- ✅ Both users can join session simultaneously
- ✅ Active users list updates in real-time
- ✅ Comments appear instantly for all users
- ✅ Cursor positions visible to other users
- ✅ Notifications display for all events
- ✅ Users can leave cleanly without errors

---

### Scenario 2: Three-User Comment Threading & @Mentions (20 minutes)

**Objective:** Test comment threading, @mention functionality, and notification targeting.

**Steps:**

1. **All three users join session:**
   - User A, B, C join same policy
   - Verify all users see each other (3 active users)

2. **User A creates root comment:**
   - Add comment: "We need to discuss section 3"
   - Comment type: "Question"
   - Submit comment

3. **User B @mentions User C:**
   - Reply to User A's comment
   - Type: "I think @[user-c-id] should review this"
   - **Expected:** @mention autocomplete shows User C
   - Submit reply
   - **Expected:** User C receives 📢 yellow notification "You were mentioned"
   - **Expected:** Mention notification stays visible (no auto-close)
   - **Expected:** User A does NOT receive mention notification (only User C)

4. **User C responds to mention:**
   - Click notification to jump to comment
   - Reply to the thread
   - Enter: "Good point, I'll review it now"
   - Submit reply
   - **Expected:** Comment thread shows 3 levels (root → reply → reply)

5. **User A resolves comment:**
   - Click "Resolve" button on root comment
   - **Expected:** All replies in thread marked as resolved (cascade)
   - **Expected:** Comment status changes to "Resolved" with green checkmark
   - **Expected:** All users see ✅ "Comment resolved" notification
   - **Expected:** Resolved comments move to "Resolved" tab

6. **User B likes User C's reply:**
   - Click "Like" button on User C's reply
   - **Expected:** Like count increments to 1
   - **Expected:** Like button changes color to indicate "liked"
   - **Expected:** Other users see updated like count in real-time

7. **User A pins important comment:**
   - Create new comment: "IMPORTANT: Deadline is Friday"
   - Click "Pin" button
   - **Expected:** Comment moves to top of list
   - **Expected:** Pin icon appears
   - **Expected:** Pinned section shows 1 comment

**Pass Criteria:**
- ✅ @mention autocomplete works correctly
- ✅ Mentioned users receive targeted notifications
- ✅ Non-mentioned users do NOT receive mention notifications
- ✅ Comment threading displays nested structure
- ✅ Resolve operation cascades to all replies
- ✅ Likes update in real-time for all users
- ✅ Pinned comments stay at top

---

### Scenario 3: Five-User Presence & Cursor Tracking (25 minutes)

**Objective:** Stress test presence accuracy, cursor overlay performance, and typing indicators.

**Steps:**

1. **Five users join session:**
   - User A, B, C, D, E join same policy
   - **Expected:** All users see 5 active participants
   - **Expected:** Each user assigned unique color

2. **All users move cursors simultaneously:**
   - Each user clicks different sections
   - User A: Line 10, User B: Line 20, User C: Line 30, User D: Line 40, User E: Line 50
   - **Expected:** All users see 4 other cursor overlays (not their own)
   - **Expected:** Cursor positions accurate (±1 line tolerance)
   - **Expected:** No cursor overlap confusion
   - **Expected:** Smooth cursor movement animations

3. **User A starts typing:**
   - Focus on document text area
   - Start typing (don't submit yet)
   - **Expected:** Other users see "User A is typing..." indicator
   - **Expected:** Typing indicator appears within 500ms
   - **Expected:** Typing indicator color matches User A's color

4. **User A stops typing:**
   - Stop typing for 3+ seconds
   - **Expected:** Typing indicator disappears after 3-second timeout
   - **Expected:** No residual indicators remain

5. **Three users type simultaneously:**
   - User A, B, C all start typing at once
   - **Expected:** Typing indicators show "User A, User B, User C are typing..."
   - **Expected:** List truncates if more than 3 typers
   - **Expected:** No performance degradation

6. **User D disconnects (network drop):**
   - Simulate network disconnect (turn off Wi-Fi or close tab)
   - Wait 5-10 seconds
   - **Expected:** Other users receive `user_left` event
   - **Expected:** User D removed from active users list
   - **Expected:** User D's cursor overlay disappears

7. **User D reconnects:**
   - Restore network / reopen tab
   - Rejoin collaboration
   - **Expected:** User D rejoins successfully
   - **Expected:** User D receives current state (active users, comments)
   - **Expected:** Other users receive `user_joined` event

8. **All users leave simultaneously:**
   - All 5 users click "Leave" at the same time
   - **Expected:** Session status updates to "ended"
   - **Expected:** No orphaned presence records
   - **Expected:** Database cleaned up properly

**Pass Criteria:**
- ✅ Cursor positions accurate for 5 concurrent users
- ✅ Typing indicators work for multiple simultaneous typers
- ✅ Network disconnect/reconnect handled gracefully
- ✅ No memory leaks or performance degradation
- ✅ Presence tracking remains accurate throughout
- ✅ Simultaneous leave operations don't cause errors

---

### Scenario 4: Edge Cases & Error Handling (30 minutes)

**Objective:** Validate robustness against edge cases and error conditions.

**Edge Cases to Test:**

#### 1. Rapid Commenting (Spam Protection)
- User A adds 10 comments in 10 seconds
- **Expected:** All comments created successfully
- **Expected:** No rate limiting errors (TODO: Implement rate limiting)
- **Expected:** Notifications don't overflow screen (max 5 visible)

#### 2. Simultaneous Edits (Conflict Detection)
- User A and User B edit same line simultaneously
- User A types "Version A" at line 10
- User B types "Version B" at line 10
- **Expected:** Last-write-wins (most recent edit saved)
- **Expected:** ⚠️ "Edit conflict detected" notification shown
- **Expected:** Conflict notification stays visible (manual dismiss)

#### 3. Long Comment Content
- User A creates comment with 9,000 characters (near 10,000 limit)
- Submit comment
- **Expected:** Comment created successfully
- **Expected:** Comment displays with proper wrapping
- **Expected:** WebSocket payload size acceptable (<10KB)

#### 4. Comment Exceeding Limit
- User A creates comment with 10,001 characters (over limit)
- Submit comment
- **Expected:** Validation error "Content must be 10-10000 characters"
- **Expected:** Comment not created
- **Expected:** User sees error message

#### 5. Empty Comment
- User A creates comment with 0 characters
- Submit comment
- **Expected:** Validation error "Content required"
- **Expected:** Submit button disabled for empty comments

#### 6. Invalid @Mention
- User A types "@[invalid-user-id]"
- Submit comment
- **Expected:** Comment created (mention extraction fails gracefully)
- **Expected:** No notification sent
- **Expected:** Mention text appears as plain text

#### 7. Session Already Ended
- User A joins session
- Admin ends session via API: `DELETE /sessions/:sessionId`
- User A tries to add comment
- **Expected:** Error message "Session has ended"
- **Expected:** User redirected or shown "Rejoin" button

#### 8. Network Latency (Slow Connection)
- Simulate slow network (Chrome DevTools → Network → Slow 3G)
- User A joins session
- User B adds comment
- **Expected:** Comment appears on User A's screen (delayed)
- **Expected:** Reconnection logic activates if connection drops
- **Expected:** User sees "Reconnecting..." status

#### 9. Browser Tab Inactive
- User A joins session
- Switch to different browser tab for 5+ minutes
- User B adds 10 comments
- User A switches back to tab
- **Expected:** All missed events delivered
- **Expected:** Notification queue shows recent activity
- **Expected:** Comments list updated with all new comments

#### 10. Stale Session Cleanup
- User A joins session
- Close browser without leaving session (simulate crash)
- Wait 30+ minutes
- Check database for stale sessions
- **Expected:** Automatic cleanup marks session as "disconnected"
- **Expected:** Cleanup interval runs every 5 minutes
- **Expected:** No orphaned sessions in database

---

## Manual Testing Checklist

### WebSocket Events (13 events)

**Client → Server:**
- [ ] `join_policy` - User joins session successfully
- [ ] `leave_policy` - User leaves session cleanly
- [ ] `cursor_move` - Cursor position broadcasts to others
- [ ] `text_change` - Document edits broadcast to others
- [ ] `add_comment` - Comment created and broadcasted
- [ ] `typing_start` - Typing indicator appears for others
- [ ] `typing_stop` - Typing indicator disappears after 3s

**Server → Client:**
- [ ] `user_joined` - Notification when user joins
- [ ] `user_left` - Notification when user leaves
- [ ] `cursor_update` - Other users' cursors visible
- [ ] `document_updated` - Edits appear in real-time
- [ ] `comment_added` - Comments appear instantly
- [ ] `typing_indicator` - "User is typing..." displayed
- [ ] `presence_update` - Active users list accurate

### REST API Endpoints (18 endpoints)

**Session Management:**
- [ ] `GET /sessions/:policyId` - Returns session list
- [ ] `POST /sessions` - Creates new session
- [ ] `GET /sessions/detail/:sessionId` - Returns session details
- [ ] `POST /sessions/:sessionId/join` - Joins existing session
- [ ] `DELETE /sessions/:sessionId/leave` - Leaves session
- [ ] `GET /sessions/:sessionId/participants` - Returns participants
- [ ] `GET /sessions/:sessionId/stats` - Returns statistics
- [ ] `DELETE /sessions/:sessionId` - Ends session (admin)

**Comment Management:**
- [ ] `GET /comments/policy/:policyId` - Returns comments
- [ ] `GET /comments/:commentId` - Returns single comment
- [ ] `POST /comments` - Creates new comment
- [ ] `PUT /comments/:commentId` - Updates comment
- [ ] `DELETE /comments/:commentId` - Soft deletes comment
- [ ] `POST /comments/:commentId/resolve` - Resolves comment
- [ ] `POST /comments/:commentId/reopen` - Reopens comment
- [ ] `POST /comments/:commentId/like` - Likes comment
- [ ] `DELETE /comments/:commentId/like` - Unlikes comment
- [ ] `POST /comments/:commentId/pin` - Pins comment
- [ ] `DELETE /comments/:commentId/pin` - Unpins comment
- [ ] `GET /comments/mentions/:userId` - Returns user mentions
- [ ] `GET /comments/policy/:policyId/stats` - Returns stats

### UI Components (7 components)

- [ ] `CollaborationContext` - WebSocket connection established
- [ ] `ActiveUsers` - Shows all active participants with avatars
- [ ] `CommentThread` - Displays nested comment structure
- [ ] `CommentEditor` - Rich text editor with @mention autocomplete
- [ ] `PresenceBadge` - Shows online/offline status
- [ ] `LiveCursors` - Displays other users' cursor positions
- [ ] `CollaborationNotifications` - Toast notifications for all events

### Notification Types (7 types)

- [ ] `user_joined` - 👋 Blue notification, auto-close (5s)
- [ ] `user_left` - 👋 Gray notification, auto-close (5s)
- [ ] `comment_added` - 💬 Indigo notification, auto-close (5s)
- [ ] `mention` - 📢 Yellow notification, manual dismiss
- [ ] `comment_resolved` - ✅ Green notification, auto-close (5s)
- [ ] `conflict` - ⚠️ Red notification, manual dismiss
- [ ] `connection_status` - 🔌 Purple notification, varies

### Accessibility

- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces notifications
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible

### Performance

- [ ] Page load time <2 seconds
- [ ] Cursor updates <100ms latency
- [ ] Comment creation <500ms latency
- [ ] No memory leaks after 30 minutes
- [ ] WebSocket payload sizes <10KB per event

---

## Expected Behaviors

### Presence Tracking
- Users appear in active list within 2 seconds of joining
- Users removed from list within 5 seconds of leaving
- Cursor positions update within 100ms of movement
- Colors assigned consistently per user

### Comment System
- Comments appear instantly for all users (<500ms)
- Threading displays up to 5 levels deep
- @mention autocomplete shows matching users
- Resolve cascades to all child replies
- Likes update in real-time

### Notifications
- Auto-close notifications dismiss after 5 seconds
- Manual dismiss notifications stay until clicked
- Max 5 notifications visible (overflow shows "+X more")
- Sound effects play when enabled (different frequencies per type)
- Notifications stack vertically without overlap

### Reconnection
- Automatic reconnection after network drop
- Max 5 reconnection attempts with 1-second delay
- Missed events delivered after reconnection
- User status updated correctly after reconnect

---

## Performance Benchmarks

### WebSocket Scalability
- **2 users:** <50ms latency, <1% packet loss
- **5 users:** <100ms latency, <2% packet loss
- **10 users:** <200ms latency, <5% packet loss
- **20+ users:** Consider separate rooms or load balancing

### Database Performance
- **Session creation:** <50ms
- **Comment creation:** <100ms
- **Comment query (50 items):** <200ms
- **Mention query:** <100ms

### Frontend Rendering
- **Comment list (100 items):** <300ms initial render
- **Cursor overlay updates:** 60 FPS (16.6ms per frame)
- **Notification animations:** 60 FPS

---

## Troubleshooting

### Issue: WebSocket not connecting
**Check:**
- Server running on correct port (5000)
- CORS enabled in server config
- Browser console for connection errors

### Issue: Events not received
**Check:**
- User successfully joined room (`join_policy` called)
- WebSocket connection active (`socket.connected === true`)
- Event names match exactly (case-sensitive)

### Issue: Notifications not appearing
**Check:**
- `useCollaboration` hook imported correctly
- `CollaborationNotifications` component rendered
- Notification queue not empty (check state)

### Issue: Cursor positions inaccurate
**Check:**
- Cursor data includes correct `line` and `column`
- CSS selectors valid and unique
- Throttling applied to cursor updates (max 10/second)

---

## Automated Testing (TODO)

Future improvements:
- Unit tests for services (Jest)
- Integration tests for WebSocket events (socket.io-client)
- E2E tests for multi-user scenarios (Playwright/Cypress)
- Load testing (Artillery, k6)

---

**End of Testing Guide**
