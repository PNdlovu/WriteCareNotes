# User Manual
## Real-Time Collaboration

**Version:** 1.0.0  
**For:** End Users  
**Date:** October 7, 2025

---

## What is Real-Time Collaboration?

Real-time collaboration allows multiple care home staff members to work together on policy documents simultaneously. See each other's cursors, add comments, discuss changes, and get instant notifications—all without refreshing the page.

**Key Benefits:**
- 👥 Work together in real-time
- 💬 Discuss policies with threaded comments
- 🔔 Get instant notifications for changes
- ✅ Track comment resolution
- 🎯 @mention colleagues to get their attention

---

## Getting Started

### Joining a Collaboration Session

1. **Navigate to a policy document**
   - Click on any policy from your policy library
   - You'll see the policy detail page

2. **Start or join collaboration**
   - Look for the collaboration panel on the right side
   - Click **"Start Collaboration"** if you're the first user
   - Click **"Join Collaboration"** if others are already working on the policy

3. **See who's online**
   - Active users appear in the top-right corner
   - Each user has a colored avatar with their initials
   - Hover over avatars to see full names

### Leaving a Session

- Click **"Leave Collaboration"** button when you're done
- Your presence will be removed from the active users list
- You can rejoin at any time

---

## Features

### 1. Live Cursors

**What it does:** See where other users are working in the document.

**How it works:**
- Each user's cursor appears as a colored indicator with their name
- Cursors move in real-time as users navigate the document
- Your own cursor is not shown (you only see others)

**Colors:**
- User A: Blue
- User B: Green
- User C: Purple
- User D: Orange
- User E: Pink
- (Colors assigned automatically when you join)

---

### 2. Comments

#### Adding a Comment

1. **Select text** (optional)
   - Highlight the section you want to comment on
   - Or click anywhere to add a general comment

2. **Click "Add Comment" button**
   - Comment editor appears

3. **Choose comment type:**
   - **General:** Regular comment or note
   - **Suggestion:** Propose a change or improvement
   - **Question:** Ask for clarification
   - **Approval:** Approve a section or change
   - **Rejection:** Reject a proposal or change
   - **Annotation:** Highlight important information

4. **Write your comment**
   - Type your message (10-10,000 characters)
   - Use @mentions to notify specific people (see below)

5. **Submit**
   - Click **"Post Comment"** button
   - Comment appears instantly for all users

#### Comment Types Guide

| Type | Icon | When to Use |
|------|------|-------------|
| **General** | 💬 | Regular comments, observations, notes |
| **Suggestion** | 💡 | Propose changes, improvements, alternatives |
| **Question** | ❓ | Ask for clarification, request information |
| **Approval** | ✅ | Approve sections, agree with changes |
| **Rejection** | ❌ | Disagree with changes, flag issues |
| **Annotation** | 📍 | Highlight important information, mark sections |

#### Replying to Comments

1. **Click "Reply" button** on any comment
2. **Write your reply** in the nested editor
3. **Submit** to add your reply to the thread

**Threading:**
- Replies appear indented under the original comment
- You can reply to replies (up to 5 levels deep)
- All users see the full thread structure

#### Using @Mentions

**What it does:** Notify a specific user to get their attention.

**How to use:**
1. Type `@` in the comment editor
2. Start typing a user's name
3. Select the user from the autocomplete list
4. The user receives a special notification (yellow with 📢 icon)
5. They can click the notification to jump to your comment

**Example:**
```
@John Smith can you review this section?
```

**Autocomplete:**
- Shows all users currently active in the session
- Filters as you type
- Use arrow keys and Enter to select

#### Resolving Comments

**When to resolve:**
- The issue has been addressed
- The question has been answered
- The suggestion has been implemented or declined

**How to resolve:**
1. **Click "Resolve" button** on the comment
2. Comment moves to "Resolved" tab
3. All replies are resolved automatically (cascade)
4. All users receive "✅ Comment resolved" notification

**Reopening:**
- Click **"Reopen"** button to move comment back to active
- Use this if the issue needs more discussion

#### Liking Comments

- Click the **"👍 Like"** button to show agreement
- Like count appears next to the button
- All users see updated like count in real-time
- Click again to unlike

#### Pinning Comments

**What it does:** Keep important comments at the top of the list.

**How to pin:**
1. Click the **"📌 Pin"** button on a comment
2. Comment moves to the "Pinned" section at the top
3. Maximum 5 pinned comments per policy

**When to pin:**
- Critical information everyone should see
- Action items or decisions
- Important questions awaiting answers

---

### 3. Typing Indicators

**What it does:** See when others are typing.

**How it works:**
- When another user starts typing, you see: **"User is typing..."**
- Indicator appears below the comment editor
- Disappears automatically after 3 seconds of inactivity

**Multiple typers:**
- Shows up to 3 users: **"John, Jane, and Bob are typing..."**
- If more than 3, shows: **"3+ users are typing..."**

---

### 4. Notifications

All collaboration events trigger notifications in the top-right corner.

#### Notification Types

| Type | Icon | Color | Auto-Close | When It Appears |
|------|------|-------|------------|-----------------|
| **User Joined** | 👋 | Blue | Yes (5s) | Someone joins the session |
| **User Left** | 👋 | Gray | Yes (5s) | Someone leaves the session |
| **Comment Added** | 💬 | Indigo | Yes (5s) | New comment created |
| **Mention** | 📢 | Yellow | No | You're @mentioned in a comment |
| **Comment Resolved** | ✅ | Green | Yes (5s) | A comment is resolved |
| **Conflict** | ⚠️ | Red | No | Edit conflict detected |
| **Connection** | 🔌 | Purple | Varies | Connection status changes |

**Auto-Close:**
- Some notifications disappear after 5 seconds
- Important ones (mentions, conflicts) stay until you dismiss them
- Click the **"×"** button to dismiss manually

**Overflow:**
- Max 5 notifications visible at once
- If more arrive, you'll see **"+X more"** indicator
- Older notifications automatically hide

**Sound Effects (Optional):**
- Notifications can play soft beep sounds
- Different sounds for different notification types
- Enable/disable in settings (default: off)

---

### 5. Presence Indicators

**Online Status:**
- Green dot = User is active
- Gray dot = User is idle (no activity for 5+ minutes)
- Red dot = User disconnected

**Last Activity:**
- Hover over a user's avatar to see their last activity time
- Example: "Active 2 minutes ago"

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + Enter** | Submit comment |
| **Esc** | Cancel comment / Close editor |
| **@** | Start @mention autocomplete |
| **Tab** | Navigate between UI elements |
| **Enter** | Select @mention from autocomplete |

---

## Best Practices

### For Effective Collaboration

1. **Use @mentions wisely**
   - Only mention users who need to see the comment
   - Avoid mentioning everyone for general comments

2. **Choose appropriate comment types**
   - Use "Suggestion" for proposed changes
   - Use "Question" when you need clarification
   - Use "Approval" to confirm agreement

3. **Resolve comments promptly**
   - Mark comments as resolved when issues are addressed
   - Keeps the comment list clean and focused

4. **Pin important information**
   - Pin critical action items or decisions
   - Unpin once they're no longer relevant

5. **Leave sessions when done**
   - Click "Leave Collaboration" instead of just closing the tab
   - Helps others see who's actively working

### For Performance

1. **Keep sessions under 30 minutes**
   - Long sessions can become cluttered
   - Start a new session for fresh discussions

2. **Limit to 5-10 active users**
   - More users = more cursor overlays
   - Consider separate sessions for large teams

3. **Use comments instead of constant edits**
   - Prevents edit conflicts
   - Provides clear discussion history

---

## Common Questions

**Q: Can I see edit history?**  
A: Not yet. This feature is planned for a future update.

**Q: Can I delete someone else's comment?**  
A: No, only admins can delete comments. You can reply or resolve them.

**Q: What happens if I lose my internet connection?**  
A: The system will try to reconnect automatically (5 attempts). You'll see a "Reconnecting..." notification. When reconnected, you'll catch up on missed events.

**Q: Can I collaborate on multiple policies at once?**  
A: Yes, but you'll need separate browser tabs for each policy. Each tab maintains its own WebSocket connection.

**Q: How do I know if my comment was sent?**  
A: Successful comments appear in the comment list immediately. If there's an error, you'll see a red error notification.

**Q: Can I edit a comment after posting?**  
A: Yes, click the "Edit" button (pencil icon) on your own comments. Others will see "(edited)" indicator.

**Q: What's the maximum number of users in a session?**  
A: Technically unlimited, but we recommend 10 or fewer for best performance.

**Q: Can I use rich text formatting in comments?**  
A: Currently, comments support plain text and @mentions. Rich formatting (bold, italic, links) is planned for future updates.

---

## Troubleshooting

### "Connection Error" notification appears

**Cause:** Network issues or server downtime  
**Solution:**
1. Check your internet connection
2. Refresh the page
3. If problem persists, contact IT support

### Comments not appearing

**Cause:** You haven't joined the collaboration session  
**Solution:** Click "Join Collaboration" button

### Can't see other users' cursors

**Cause:** Others may not be actively working in the document  
**Solution:** Ask colleagues to move their cursor or click in the document

### Notifications not showing

**Cause:** Browser notifications may be blocked  
**Solution:**
1. Check browser notification permissions
2. Ensure CollaborationNotifications component is loaded
3. Try refreshing the page

### @mention autocomplete not working

**Cause:** Not typing in a comment editor  
**Solution:** Click "Add Comment" or "Reply" first, then type @

---

## Support

For technical issues or feature requests, contact:
- **IT Support:** support@writecarenotes.com
- **Documentation:** https://docs.writecarenotes.com/collaboration

---

**End of User Manual**

*Thank you for using WriteCareNotes Real-Time Collaboration!*
