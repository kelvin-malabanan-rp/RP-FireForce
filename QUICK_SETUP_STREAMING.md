# Quick Setup Guide - Streaming Incident Details Page

## 🚀 What You Need To Do

### 1. Test the New Incident Details Page

1. **Start your web app:**
   ```bash
   cd module-rp-fireforce-web
   npm run dev
   ```

2. **Go to Incidents page**

3. **Click "View Details" on any incident**
   - A new tab should open with full incident details
   - AI chatbot should be visible on the right side

4. **Try the chatbot:**
   - Click a quick question button, or
   - Type your own question
   - Watch the response stream in word-by-word!

### 2. Set Up Your Streaming API

Your backend needs to implement the `/analyze/stream` endpoint that returns Server-Sent Events (SSE).

#### Option A: FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()

# IMPORTANT: Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/stream")
async def analyze_stream(data: dict):
    async def generate():
        # Your AI logic here - this is just an example
        title = data.get("title", "")
        description = data.get("description", "")
        service = data.get("service", "")
        
        # Generate response (replace with your actual AI)
        response_words = f"Based on the incident '{title}' in {service}, here are my recommendations...".split()
        
        # Stream each word
        for word in response_words:
            yield f"data: {{\"word\": \"{word}\"}}\n\n"
            await asyncio.sleep(0.05)  # Small delay for effect
        
        # Signal completion
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Option B: Express.js (Node)

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/analyze/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { title, description, service } = req.body;
  
  // Generate response (replace with your actual AI)
  const words = `Based on the incident '${title}' in ${service}, here are my recommendations...`.split(' ');
  
  let index = 0;
  const interval = setInterval(() => {
    if (index < words.length) {
      res.write(`data: {"word": "${words[index]}"}\n\n`);
      index++;
    } else {
      res.write('data: [DONE]\n\n');
      res.end();
      clearInterval(interval);
    }
  }, 50); // 50ms between words
});

app.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
```

### 3. Test the Streaming

#### Manual Test with curl:
```bash
curl -N -X POST http://localhost:8000/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test incident","service":"test"}'
```

Expected output:
```
data: {"word": "Based"}

data: {"word": "on"}

data: {"word": "the"}

data: [DONE]
```

#### Test in Browser:
1. Open an incident
2. Open browser DevTools (F12)
3. Go to Network tab
4. Send a message in the chat
5. Click on the `/analyze/stream` request
6. Should see "EventStream" type
7. Watch words arrive in real-time

### 4. Troubleshooting

#### Issue: "Failed to fetch" error

**Check:**
1. Is backend running on port 8000?
   ```bash
   curl http://localhost:8000/health  # or your health endpoint
   ```

2. CORS enabled?
   - Must allow `*` or your frontend domain
   - Must allow `POST` method
   - Must allow all headers

#### Issue: Chatbot doesn't stream

**Check response format:**
- Each line must start with `data: `
- Must have `\n\n` after each data line
- Must send `[DONE]` signal at end
- Content-Type must be `text/event-stream`

#### Issue: New tab doesn't open

**Check:**
1. Pop-up blocker? Allow pop-ups for your domain
2. `incident-details.html` exists in `/public/` folder?
3. Dev server serving static files?

### 5. Customize (Optional)

#### Change API URL:
In `StreamingChatbot.jsx` (line ~71):
```javascript
const response = await fetch('http://YOUR_URL:YOUR_PORT/analyze/stream', {
```

In `incident-details.html` (line ~126):
```javascript
const response = await fetch('http://YOUR_URL:YOUR_PORT/analyze/stream', {
```

#### Change Layout:
In `IncidentDetailsPage.jsx` (line ~555):
```jsx
{/* Make chatbot bigger: change lg:col-span-2 to lg:col-span-1 */}
<div className="lg:col-span-2 space-y-6">
  {/* Incident details */}
</div>

{/* And change lg:col-span-1 to lg:col-span-2 */}
<div className="lg:col-span-1">
  <StreamingChatbot incident={incident} />
</div>
```

#### Change Streaming Speed:
Speed is controlled by your backend. Adjust the delay between words:
```python
await asyncio.sleep(0.05)  # Faster: 0.01, Slower: 0.1
```

## ✅ Verification Checklist

Before considering it complete:

- [ ] Backend running on port 8000
- [ ] `/analyze/stream` endpoint implemented
- [ ] CORS enabled on backend
- [ ] Can open incident details in new tab
- [ ] Chatbot visible on right side
- [ ] Can send messages
- [ ] Messages stream word-by-word
- [ ] Blinking cursor visible during streaming
- [ ] "Connecting..." indicator shows before streaming
- [ ] Quick question buttons work
- [ ] No console errors

## 🎓 Understanding SSE Format

Server-Sent Events require a specific format:

```
data: <JSON or text>
<blank line>
data: <JSON or text>
<blank line>
```

Example:
```
data: {"word": "Hello"}

data: {"word": "World"}

data: [DONE]

```

**Key points:**
- Each message starts with `data: `
- Each message ends with `\n\n` (two newlines)
- Can send JSON or plain text
- `[DONE]` signals end of stream

## 📚 Additional Resources

### Server-Sent Events Documentation
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Can I Use: https://caniuse.com/eventsource (99%+ browser support!)

### FastAPI Streaming
- Docs: https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse

### Testing Tools
- **Postman**: Supports SSE requests
- **curl**: Use `-N` flag for no-buffer
- **Browser DevTools**: Network tab shows EventStream

## 🐛 Common Errors & Fixes

### Error: "Cannot read property 'title' of undefined"
**Fix:** Incident data not loaded. Wait for `fetchIncident()` to complete.

### Error: "CORS policy blocked"
**Fix:** Add CORS middleware to backend (see setup above).

### Error: "Stream stalled"
**Fix:** 
1. Check backend is sending `\n\n` after each message
2. Ensure `Content-Type: text/event-stream`
3. Don't buffer responses on backend

### Error: "Words appear together, not one-by-one"
**Fix:** Add small delay between words in backend (50-100ms).

## 💡 Tips

1. **Start simple:** Test with hardcoded response before integrating AI
2. **Use DevTools:** Network tab shows SSE messages arriving
3. **Check logs:** Backend should log each word sent
4. **Test curl first:** Verify streaming works before testing in UI
5. **Disable caching:** SSE requires no-cache headers

## 🎉 You're Done!

Once everything works, you have:
- ✅ Full-page incident details (no cramped modal!)
- ✅ Real-time streaming AI chatbot
- ✅ Professional side-by-side layout
- ✅ Lightning-fast response times
- ✅ Engaging user experience

Enjoy your new streaming incident details page! 🚀
