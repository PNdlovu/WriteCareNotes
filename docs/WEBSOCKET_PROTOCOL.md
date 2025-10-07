# WebSocket Protocol Specification
## Real-Time Collaboration - Feature 2

**Version:** 1.0.0  
**Date:** October 7, 2025  
**Author:** WriteCareNotes Development Team

---

## Overview

This document specifies the WebSocket protocol for real-time policy collaboration in the WriteCareNotes platform. The protocol enables multiple users to collaborate on policy documents with real-time presence tracking, live cursors, comments, and notifications.

**WebSocket Server:** `PolicyCollaborationGateway`  
**Client Library:** `socket.io-client@4.x`  
**Transport:** WebSocket (primary), HTTP long-polling (fallback)  
**Path:** `/collaboration`  
**Port:** 5000 (development), configurable for production

---

## Connection

### Establishing Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  path: '/collaboration',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Connection Events

#### `connect`
Emitted when connection is successfully established.

**Payload:** None

**Example:**
```typescript
socket.on('connect', () => {
  console.log('Connected to collaboration server');
  console.log('Socket ID:', socket.id);
});
```

#### `disconnect`
Emitted when connection is lost.

**Payload:** Reason string

**Example:**
```typescript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Reasons: 'io server disconnect', 'io client disconnect', 'ping timeout', 'transport close', 'transport error'
});
```

#### `connect_error`
Emitted when connection fails.

**Payload:** Error object

**Example:**
```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

#### `reconnecting`
Emitted during reconnection attempts.

**Payload:** Attempt number

**Example:**
```typescript
socket.on('reconnecting', (attemptNumber) => {
  console.log(`Reconnecting... (attempt ${attemptNumber})`);
});
```

---

## Collaboration Events

### Client → Server (Outgoing)

#### `join_policy`
Join a policy collaboration session.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
  userName: string;      // Display name of user
}
```

**Response:** Server emits `presence_update` with list of active users

**Example:**
```typescript
socket.emit('join_policy', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  userName: 'John Smith'
});
```

#### `leave_policy`
Leave a policy collaboration session.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
}
```

**Response:** Server emits `user_left` to other participants

**Example:**
```typescript
socket.emit('leave_policy', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7'
});
```

#### `cursor_move`
Update cursor position in document.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
  cursor: {
    line: number;        // Line number (0-indexed)
    column: number;      // Column number (0-indexed)
    selector?: string;   // Optional CSS selector
  };
}
```

**Response:** Server broadcasts `cursor_update` to other participants

**Example:**
```typescript
socket.emit('cursor_move', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  cursor: { line: 42, column: 15, selector: '#section-3' }
});
```

#### `text_change`
Notify of document content changes.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
  content: string;       // Changed content
  changeType: string;    // Type of change: 'insert', 'delete', 'replace'
}
```

**Response:** Server broadcasts `document_updated` to other participants

**Example:**
```typescript
socket.emit('text_change', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  content: 'New policy text...',
  changeType: 'insert'
});
```

#### `add_comment`
Create a new comment on the policy.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
  userName: string;      // Display name of user
  content: string;       // Comment content (10-10000 chars)
  positionSelector?: {   // Optional position for annotations
    selector: string;    // CSS selector
    textContent: string; // Selected text
    startOffset: number; // Start offset
    endOffset: number;   // End offset
  };
  commentType: string;   // 'general', 'suggestion', 'question', 'approval', 'rejection', 'annotation'
}
```

**Response:** Server broadcasts `comment_added` to all participants

**Example:**
```typescript
socket.emit('add_comment', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  userName: 'John Smith',
  content: 'This section needs review @[user-id-123]',
  commentType: 'suggestion',
  positionSelector: {
    selector: '#section-3 > p:nth-child(2)',
    textContent: 'All residents must...',
    startOffset: 0,
    endOffset: 50
  }
});
```

#### `typing_start`
Indicate user started typing.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
  userName: string;      // Display name of user
}
```

**Response:** Server broadcasts `typing_indicator` with `isTyping: true`

**Example:**
```typescript
socket.emit('typing_start', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  userName: 'John Smith'
});
```

#### `typing_stop`
Indicate user stopped typing.

**Payload:**
```typescript
{
  policyId: string;      // UUID of policy document
  userId: string;        // UUID of user
}
```

**Response:** Server broadcasts `typing_indicator` with `isTyping: false`

**Example:**
```typescript
socket.emit('typing_stop', {
  policyId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7'
});
```

---

### Server → Client (Incoming)

#### `user_joined`
Another user joined the collaboration session.

**Payload:**
```typescript
{
  userId: string;        // UUID of user who joined
  userName: string;      // Display name of user
}
```

**Example:**
```typescript
socket.on('user_joined', (data) => {
  console.log(`${data.userName} joined the collaboration`);
  // Update active users list
});
```

#### `user_left`
Another user left the collaboration session.

**Payload:**
```typescript
{
  userId: string;        // UUID of user who left
  userName: string;      // Display name of user
}
```

**Example:**
```typescript
socket.on('user_left', (data) => {
  console.log(`${data.userName} left the collaboration`);
  // Remove from active users list
});
```

#### `cursor_update`
Another user's cursor position changed.

**Payload:**
```typescript
{
  userId: string;        // UUID of user
  userName: string;      // Display name of user
  cursor: {
    line: number;        // Line number
    column: number;      // Column number
    selector?: string;   // Optional CSS selector
  };
}
```

**Example:**
```typescript
socket.on('cursor_update', (data) => {
  console.log(`${data.userName} cursor at line ${data.cursor.line}, column ${data.cursor.column}`);
  // Update cursor overlay
});
```

#### `document_updated`
Another user changed the document content.

**Payload:**
```typescript
{
  userId: string;        // UUID of user who made the change
  content: string;       // Changed content
  changeType: string;    // Type of change
}
```

**Example:**
```typescript
socket.on('document_updated', (data) => {
  console.log(`Document updated by user ${data.userId}`);
  // Apply changes to document
});
```

#### `comment_added`
A new comment was added to the policy.

**Payload:**
```typescript
{
  comment: {
    id: string;          // UUID of comment
    policyId: string;    // UUID of policy
    userId: string;      // UUID of author
    userName: string;    // Display name of author
    content: string;     // Comment content
    positionSelector?: object; // Position data
    status: string;      // 'active', 'resolved', 'deleted'
    commentType: string; // Comment type
    mentionedUsers: string[]; // Array of mentioned user IDs
    likeCount: number;   // Number of likes
    isPinned: boolean;   // Pinned status
    createdAt: string;   // ISO timestamp
    replies?: any[];     // Nested replies
  };
}
```

**Example:**
```typescript
socket.on('comment_added', (data) => {
  console.log(`New comment by ${data.comment.userName}`);
  // Add to comments list
  // Check if current user is mentioned
});
```

#### `typing_indicator`
Another user's typing status changed.

**Payload:**
```typescript
{
  userId: string;        // UUID of user
  userName: string;      // Display name of user
  isTyping: boolean;     // Typing status
}
```

**Example:**
```typescript
socket.on('typing_indicator', (data) => {
  if (data.isTyping) {
    console.log(`${data.userName} is typing...`);
  } else {
    console.log(`${data.userName} stopped typing`);
  }
  // Update typing indicators list
});
```

#### `presence_update`
Complete list of active users in the session.

**Payload:**
```typescript
{
  users: Array<{
    userId: string;      // UUID of user
    userName: string;    // Display name
    isEditing: boolean;  // Currently editing
    cursor?: object;     // Cursor position
    lastActivity: string; // ISO timestamp
    color: string;       // Assigned color for UI
  }>;
}
```

**Example:**
```typescript
socket.on('presence_update', (data) => {
  console.log(`Active users: ${data.users.length}`);
  // Update active users list with complete state
});
```

---

## Room Isolation

Each policy document has its own isolated room for collaboration:

**Room Name Format:** `policy:${policyId}`

**Example:** `policy:550e8400-e29b-41d4-a716-446655440000`

### Benefits:
- Events only sent to users in the same room
- Prevents cross-policy event leakage
- Scalable architecture for multiple concurrent sessions

---

## Automatic Cleanup

The server automatically cleans up stale sessions:

**Cleanup Interval:** Every 5 minutes  
**Stale Threshold:** 30 minutes of inactivity

**Process:**
1. Server checks `lastActivity` timestamp
2. If > 30 minutes ago, user is marked as disconnected
3. `user_left` event broadcasted to room
4. Session status updated to `disconnected`

---

## Error Handling

### Connection Errors
```typescript
socket.on('connect_error', (error) => {
  // Handle: Network issues, server down, authentication failure
  console.error('Connection failed:', error.message);
  // Retry logic handled by socket.io automatically
});
```

### Reconnection Strategy
- **Attempts:** 5 reconnection attempts
- **Delay:** 1 second between attempts
- **Exponential Backoff:** Not implemented (uses fixed delay)
- **Auto-Reconnect:** Enabled by default

### Event Validation
Server validates all incoming events:
- UUID format validation
- Content length limits (10-10000 chars for comments)
- Required field validation
- Policy access authorization (TODO: Implement)

---

## Best Practices

### 1. Join/Leave Lifecycle
```typescript
useEffect(() => {
  joinPolicy(policyId, userId, userName);
  return () => leavePolicy(); // Always clean up
}, [policyId, userId, userName]);
```

### 2. Throttle Cursor Updates
```typescript
const throttledCursorUpdate = throttle((cursor) => {
  updateCursor(cursor);
}, 100); // Max 10 updates/second
```

### 3. Typing Indicator Timeout
```typescript
let typingTimeout;
const handleTyping = () => {
  startTyping();
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => stopTyping(), 3000);
};
```

### 4. Connection Status Monitoring
```typescript
const [isConnected, setIsConnected] = useState(false);

socket.on('connect', () => setIsConnected(true));
socket.on('disconnect', () => setIsConnected(false));

// Show UI indicator
{!isConnected && <div>Reconnecting...</div>}
```

---

## Security Considerations

### Authentication (TODO)
Currently using temporary header-based auth:
```typescript
// TODO: Implement JWT authentication middleware
const token = localStorage.getItem('token');
socket.io.opts.query = { token };
```

### Authorization (TODO)
Verify user has access to policy:
```typescript
// Server-side check before joining room
const hasAccess = await checkPolicyAccess(userId, policyId);
if (!hasAccess) {
  socket.emit('error', { message: 'Access denied' });
  return;
}
```

### Rate Limiting (TODO)
Implement rate limits to prevent abuse:
- Max 100 events/minute per user
- Max 10 comments/minute per user
- Max 20 cursor updates/second per user

---

## Performance Optimization

### Efficient Payload Sizes
- Cursor updates: ~100 bytes
- Typing indicators: ~80 bytes
- Comments: Variable (10-10KB)
- Presence updates: ~500 bytes per user

### Batch Updates
Consider batching cursor updates:
```typescript
const cursorBuffer = [];
setInterval(() => {
  if (cursorBuffer.length > 0) {
    socket.emit('cursor_batch', cursorBuffer);
    cursorBuffer.length = 0;
  }
}, 100);
```

### Compression
Socket.io automatically uses compression for payloads > 1KB.

---

## Testing

### Manual Testing
1. Open 2-3 browser tabs
2. Join same policy with different users
3. Verify events are received in all tabs
4. Test cursor movements, typing indicators, comments
5. Disconnect one tab, verify `user_left` event

### Automated Testing
```typescript
// Example test with socket.io-client
import { io } from 'socket.io-client';

describe('WebSocket Collaboration', () => {
  let socket1, socket2;

  beforeEach(() => {
    socket1 = io('http://localhost:5000', { path: '/collaboration' });
    socket2 = io('http://localhost:5000', { path: '/collaboration' });
  });

  it('should broadcast user_joined event', (done) => {
    socket2.on('user_joined', (data) => {
      expect(data.userName).toBe('Test User 1');
      done();
    });

    socket1.emit('join_policy', {
      policyId: 'test-policy-id',
      userId: 'user-1',
      userName: 'Test User 1'
    });
  });
});
```

---

## Troubleshooting

### Issue: Socket not connecting
**Cause:** Server not running or wrong URL  
**Solution:** Verify server is running on correct port, check CORS configuration

### Issue: Events not received
**Cause:** Not joined to room or disconnected  
**Solution:** Ensure `join_policy` was called, check connection status

### Issue: Duplicate events
**Cause:** Multiple socket instances or event listeners  
**Solution:** Clean up socket on unmount, remove event listeners

### Issue: High latency
**Cause:** Network issues or server overload  
**Solution:** Check network conditions, optimize payload sizes, use compression

---

## Version History

- **1.0.0** (Oct 7, 2025): Initial protocol specification
  - 7 client events (join, leave, cursor, text, comment, typing)
  - 7 server events (user_joined, user_left, cursor_update, document_updated, comment_added, typing_indicator, presence_update)
  - Room-based isolation
  - Automatic cleanup

---

**End of WebSocket Protocol Specification**
