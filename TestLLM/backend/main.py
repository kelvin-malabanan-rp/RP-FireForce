from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import logging
from typing import Optional
import time
import re

# ----------------- Logging -----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------- App -----------------
app = FastAPI(title="Phi-3 Mini LLM API", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow everything for local dev
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Model Config -----------------
MODEL_NAME = "microsoft/Phi-3-mini-4k-instruct"
MODEL_DISPLAY_NAME = "Phi-3 Mini"

class QuestionRequest(BaseModel):
    question: str
    max_length: int = 300
    temperature: float = 0.4

class AnswerResponse(BaseModel):
    answer: str
    status: str
    response_time: Optional[float] = None

model = None
tokenizer = None
model_loaded = False


def load_model():
    """Load Phi-3 Mini with proper device/dtype handling"""
    global model, tokenizer, model_loaded
    try:
        logger.info(f"Loading {MODEL_DISPLAY_NAME}...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        
        # Set pad token if not already set
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        # Choose device
        if torch.backends.mps.is_available():
            device = "mps"
        elif torch.cuda.is_available():
            device = "cuda"
        else:
            device = "cpu"
        logger.info(f"Using device: {device}")

        if device == "cuda":
            try:
                from transformers import BitsAndBytesConfig
                quant_config = BitsAndBytesConfig(load_in_8bit=True)
                model = AutoModelForCausalLM.from_pretrained(
                    MODEL_NAME,
                    device_map="auto",
                    quantization_config=quant_config,
                    torch_dtype=torch.float16,
                )
                logger.info("Loaded in 8-bit CUDA mode")
            except Exception as e:
                logger.warning(f"8-bit failed, fallback to float16: {e}")
                model = AutoModelForCausalLM.from_pretrained(
                    MODEL_NAME,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    low_cpu_mem_usage=True,
                )
        elif device == "mps":
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float16,
                device_map="auto",
                low_cpu_mem_usage=True,
            )
            logger.info("Loaded in float16 on Apple MPS")
        else:
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float32,
                device_map="auto",
                low_cpu_mem_usage=True,
            )
            logger.info("Loaded in float32 on CPU")

        model_loaded = True
        logger.info(f"{MODEL_DISPLAY_NAME} loaded successfully!")

    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model_loaded = False
        raise e


def clean_response(response_text: str, original_prompt: str) -> str:
    """Clean the model response to extract only the assistant's answer"""
    
    # Remove the original prompt if it appears in the response
    if original_prompt in response_text:
        response_text = response_text.replace(original_prompt, "").strip()
    
    # Remove common system prompt artifacts
    system_artifacts = [
        "You are an incident response assistant.",
        "The user will give you an incident description and a question.",
        "Respond ONLY with:",
        "1. Immediate Actions",
        "2. Investigation Steps", 
        "3. Resolution Plan",
        "⚠️ Do NOT repeat the incident details in your answer.",
        "Incident details:",
        "<|user|>",
        "<|end|>",
        "<|assistant|>"
    ]
    
    for artifact in system_artifacts:
        response_text = response_text.replace(artifact, "").strip()
    
    # Remove "Question:" prefix if it appears
    if response_text.startswith("Question:"):
        lines = response_text.split('\n')
        # Find where the actual response starts
        start_idx = 0
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in ["immediate actions", "1. immediate", "**immediate", "### immediate"]):
                start_idx = i
                break
        response_text = '\n'.join(lines[start_idx:]).strip()
    
    # Look for the actual structured response pattern
    lines = response_text.split('\n')
    response_start_idx = 0
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        if any(keyword in line_lower for keyword in ["immediate actions", "1. immediate", "**immediate", "### immediate"]):
            response_start_idx = i
            break
    
    if response_start_idx > 0:
        response_text = '\n'.join(lines[response_start_idx:]).strip()
    
    # Final cleanup - remove excessive whitespace
    response_text = re.sub(r'\n\s*\n\s*\n', '\n\n', response_text)
    response_text = response_text.strip()
    
    return response_text


@app.on_event("startup")
async def startup_event():
    load_model()


@app.get("/")
async def root():
    return {"message": f"{MODEL_DISPLAY_NAME} API is running"}


@app.get("/health")
async def health():
    return {
        "status": "healthy" if model_loaded else "unhealthy",
        "model": MODEL_DISPLAY_NAME,
        "model_loaded": model_loaded,
        "tokenizer_loaded": tokenizer is not None,
    }


@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    if not model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        start_time = time.time()
        raw_question = request.question.strip()

        # Split incident vs. user question
        if "User Question:" in raw_question:
            incident_context, user_question = raw_question.split("User Question:", 1)
            incident_context = incident_context.strip()
            user_question = user_question.strip()
        else:
            incident_context, user_question = "", raw_question

        # Create a cleaner prompt format
        if incident_context:
            prompt = f"""You are an incident response assistant. Based on the following incident, provide a structured response.

Incident: {incident_context}

Question: {user_question}

Please provide your response in this exact format:

1. Immediate Actions
[List immediate actions to take]

2. Investigation Steps
[List investigation steps]

3. Resolution Plan
[Provide resolution plan]

Response:"""
        else:
            prompt = f"""You are an incident response assistant. Please analyze the following question and provide a structured incident response.

Question: {user_question}

Please provide your response in this exact format:

1. Immediate Actions
[List immediate actions to take]

2. Investigation Steps
[List investigation steps]

3. Resolution Plan
[Provide resolution plan]

Response:"""

        # Encode
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1024,
            padding=True
        )
        device = next(model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}

        # Generate
        with torch.inference_mode():
            outputs = model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_new_tokens=min(request.max_length, 300),
                temperature=max(0.2, min(request.temperature, 0.7)),
                do_sample=request.temperature > 0.3,
                top_p=0.9,
                repetition_penalty=1.05,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
                use_cache=True,
            )

        # Extract only the generated tokens (not the input prompt)
        input_length = inputs["input_ids"].shape[1]
        generated_tokens = outputs[0][input_length:]
        response = tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        # Clean the response
        answer = clean_response(response, prompt)
        
        # Final fallback cleaning - if response is still too messy, extract after "Response:"
        if "Response:" in answer:
            answer = answer.split("Response:")[-1].strip()
        
        # If answer is empty or too short, use a more aggressive extraction
        if len(answer.strip()) < 10:
            full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            answer = clean_response(full_response, prompt)
            if "Response:" in answer:
                answer = answer.split("Response:")[-1].strip()

        elapsed = round(time.time() - start_time, 2)
        return AnswerResponse(answer=answer, status="success", response_time=elapsed)

    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)