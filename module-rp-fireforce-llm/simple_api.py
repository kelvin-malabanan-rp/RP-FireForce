"""
Incident AI API with RAG
AI learns from your past incidents!
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import time
import json
from typing import Optional

# Import the RAG system
try:
    from rag_system import IncidentRAG, seed_example_data
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("⚠️  RAG system not available. Install: pip install qdrant-client sentence-transformers")

app = FastAPI(title="Incident AI with RAG")

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "llama3.2:3b-instruct-q8_0"

# Initialize RAG
if RAG_AVAILABLE:
    try:
        rag = IncidentRAG()
        print(f"✅ RAG initialized with {rag.count_incidents()} incidents")
    except Exception as e:
        print(f"⚠️  Could not initialize RAG: {e}")
        print("💡 Make sure Qdrant is running: docker start qdrant")
        rag = None
else:
    rag = None

@app.get("/")
def home():
    incident_count = rag.count_incidents() if rag else 0
    return {
        "status": "🧠 Incident AI with RAG",
        "model": MODEL_NAME,
        "rag_enabled": rag is not None,
        "incidents_in_knowledge_base": incident_count
    }

@app.post("/analyze")
async def analyze_with_rag(incident: dict):
    """Analyze incident WITH RAG (non-streaming)"""
    
    title = incident.get('title', '')
    description = incident.get('description', '')
    service = incident.get('service', 'unknown')
    
    start_time = time.time()
    
    # Search for similar past incidents
    similar_incidents = []
    if rag:
        search_query = f"{title}. {description}"
        similar_incidents = rag.search_similar(
            query=search_query,
            service=service,
            limit=3
        )
    
    # Build prompt with RAG context
    prompt = build_rag_prompt(title, description, service, similar_incidents)
    
    # Get AI analysis
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "top_p": 0.9,
                        "num_predict": 600,
                        "num_ctx": 3072,
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                elapsed = time.time() - start_time
                
                return {
                    "incident_title": title,
                    "service": service,
                    "analysis": result.get('response', '').strip(),
                    "similar_past_incidents": [
                        {
                            "id": inc["incident_id"],
                            "similarity": inc["similarity_score"],
                            "title": inc["title"]
                        }
                        for inc in similar_incidents
                    ],
                    "used_rag": len(similar_incidents) > 0,
                    "response_time": round(elapsed, 2)
                }
            
            return {"error": "AI service error"}
    
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze/stream")
async def analyze_streaming(incident: dict):
    """Analyze incident WITH RAG (streaming - text appears as it's generated)"""
    
    title = incident.get('title', '')
    description = incident.get('description', '')
    service = incident.get('service', 'unknown')
    
    # Search for similar past incidents
    similar_incidents = []
    if rag:
        search_query = f"{title}. {description}"
        similar_incidents = rag.search_similar(
            query=search_query,
            service=service,
            limit=3
        )
    
    # Build prompt
    prompt = build_rag_prompt(title, description, service, similar_incidents)
    
    async def generate_stream():
        """Generator that yields tokens as they arrive"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": MODEL_NAME,
                        "prompt": prompt,
                        "stream": True,  # Enable streaming
                        "options": {
                            "temperature": 0.2,
                            "top_p": 0.9,
                            "num_predict": 600,
                            "num_ctx": 3072,
                        }
                    }
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                
                                # Send each token as it arrives
                                if token := data.get('response'):
                                    yield f"data: {json.dumps({'token': token})}\n\n"
                                
                                # Send done signal
                                if data.get('done'):
                                    # Include similar incidents in final message
                                    similar = [
                                        {
                                            "id": inc["incident_id"],
                                            "similarity": inc["similarity_score"],
                                            "title": inc["title"]
                                        }
                                        for inc in similar_incidents
                                    ]
                                    yield f"data: {json.dumps({'done': True, 'similar_incidents': similar})}\n\n"
                                    break
                            
                            except json.JSONDecodeError:
                                continue
        
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate_stream(), media_type="text/event-stream")

@app.post("/incidents/seed")
async def seed_database():
    """Add example incidents (first time setup)"""
    
    if not rag:
        raise HTTPException(status_code=503, detail="RAG not available")
    
    try:
        seed_example_data(rag)
        return {
            "message": "Example incidents added",
            "total_incidents": rag.count_incidents()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/incidents/add")
async def add_incident(incident: dict):
    """Add a resolved incident to knowledge base"""
    
    if not rag:
        raise HTTPException(status_code=503, detail="RAG not available")
    
    try:
        doc_id = rag.add_incident(
            incident_id=incident.get('incident_id'),
            title=incident.get('title'),
            description=incident.get('description'),
            service=incident.get('service'),
            root_cause=incident.get('root_cause', ''),
            resolution=incident.get('resolution', ''),
            severity=incident.get('severity', 'medium'),
            tags=incident.get('tags', [])
        )
        
        return {
            "message": "Incident added",
            "document_id": doc_id,
            "total_incidents": rag.count_incidents()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/incidents/search")
async def search_incidents(query: str, service: Optional[str] = None, limit: int = 3):
    """Search for similar past incidents"""
    
    if not rag:
        raise HTTPException(status_code=503, detail="RAG not available")
    
    try:
        results = rag.search_similar(query=query, service=service, limit=limit)
        return {"query": query, "results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/incidents/count")
async def count_incidents():
    """Count total incidents"""
    if not rag:
        return {"count": 0, "rag_available": False}
    
    return {"count": rag.count_incidents(), "rag_available": True}

def build_rag_prompt(title: str, description: str, service: str, similar_incidents: list) -> str:
    """Build prompt with RAG context"""
    
    prompt = f"""You are an expert SRE with access to your company's incident history.

CURRENT INCIDENT:
Title: {title}
Description: {description}
Service: {service}

"""
    
    if similar_incidents:
        prompt += f"""SIMILAR PAST INCIDENTS:

"""
        for i, incident in enumerate(similar_incidents, 1):
            similarity_pct = int(incident['similarity_score'] * 100)
            prompt += f"""{i}. {incident['incident_id']} - {incident['title']} ({similarity_pct}% similar)
   Root Cause: {incident['root_cause']}
   Resolution: {incident['resolution']}

"""
        
        prompt += """INSTRUCTIONS:
Compare the current incident to these past incidents. If highly similar (>80%), reference the specific past incident and its resolution.

"""
    
    prompt += """Provide:

1. COMPARISON TO PAST INCIDENTS (if any found)
2. ROOT CAUSE ANALYSIS (most likely causes)
3. RECOMMENDED ACTIONS (specific steps)
4. PREVENTION (how to avoid in future)

Be specific and reference past incidents when relevant."""
    
    return prompt

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🧠 Incident AI with RAG + Streaming")
    print("="*60)
    print(f"\n🤖 Model: {MODEL_NAME}")
    print(f"🔍 RAG: {'✅ Enabled' if rag else '❌ Disabled'}")
    
    if rag:
        print(f"📊 Incidents: {rag.count_incidents()}")
    
    print("\n📍 Endpoints:")
    print("  • POST /analyze           - Smart analysis (non-streaming)")
    print("  • POST /analyze/stream    - Smart analysis (streaming) ⚡")
    print("  • POST /incidents/seed    - Add example data")
    print("  • POST /incidents/add     - Add your incidents")
    print("  • GET  /incidents/search  - Search past incidents")
    print("  • GET  /incidents/count   - Count incidents")
    print("\n💡 For chatbot UI: Use /analyze/stream")
    print("💡 For API integration: Use /analyze")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")