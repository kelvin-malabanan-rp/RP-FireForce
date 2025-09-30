#!/usr/bin/env python3
"""
Integration script to use fine-tuned Phi-3 model in your backend
This updates your main.py to load the fine-tuned model instead of the base model
"""

import os
import shutil
from pathlib import Path

def update_backend_for_finetuned_model(finetuned_model_path: str):
    """Update the backend to use the fine-tuned model"""
    
    backend_path = Path("../backend/main.py")
    
    # Read current main.py
    with open(backend_path, 'r') as f:
        content = f.read()
    
    # Create backup
    shutil.copy(backend_path, backend_path.with_suffix('.py.backup'))
    print(f"📄 Backup created: {backend_path.with_suffix('.py.backup')}")
    
    # Replace model configuration
    old_model_config = '''# Model configuration - Phi-3 Mini only
MODEL_NAME = "microsoft/Phi-3-mini-4k-instruct"
MODEL_DISPLAY_NAME = "Phi-3 Mini"'''
    
    new_model_config = f'''# Model configuration - Fine-tuned Phi-3 Mini for Alert Analysis
MODEL_NAME = "{finetuned_model_path}"
MODEL_DISPLAY_NAME = "Phi-3 Mini (Alert Fine-tuned)"'''
    
    # Update imports to include PEFT
    old_imports = '''from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import logging
from typing import Optional'''
    
    new_imports = '''from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch
import logging
from typing import Optional'''
    
    # Update model loading function
    old_loading = '''        # Load model optimized for available hardware
        if device == "mps":
            # For MPS, load with float16 for better performance
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float16,  # Use float16 for MPS
                low_cpu_mem_usage=True,
            )
            model = model.to(device)
        else:
            # For CPU, use float32
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float32,
                device_map="auto",
                low_cpu_mem_usage=True,
            )'''
    
    new_loading = '''        # Load fine-tuned model optimized for available hardware
        if device == "mps":
            # For MPS, load with float16 for better performance
            base_model = AutoModelForCausalLM.from_pretrained(
                "microsoft/Phi-3-mini-4k-instruct",  # Base model
                torch_dtype=torch.float16,  # Use float16 for MPS
                low_cpu_mem_usage=True,
            )
            model = PeftModel.from_pretrained(base_model, MODEL_NAME)  # Load fine-tuned adapter
            model = model.to(device)
        else:
            # For CPU, use float32
            base_model = AutoModelForCausalLM.from_pretrained(
                "microsoft/Phi-3-mini-4k-instruct",  # Base model
                torch_dtype=torch.float32,
                device_map="auto",
                low_cpu_mem_usage=True,
            )
            model = PeftModel.from_pretrained(base_model, MODEL_NAME)  # Load fine-tuned adapter'''
    
    # Apply replacements
    content = content.replace(old_model_config, new_model_config)
    content = content.replace(old_imports, new_imports)
    content = content.replace(old_loading, new_loading)
    
    # Write updated content
    with open(backend_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Backend updated to use fine-tuned model: {finetuned_model_path}")
    print("🔄 Restart your backend to load the fine-tuned model")

if __name__ == "__main__":
    finetuned_path = "./phi3_alert_finetuned"
    if os.path.exists(finetuned_path):
        update_backend_for_finetuned_model(finetuned_path)
    else:
        print(f"❌ Fine-tuned model not found at: {finetuned_path}")
        print("Run the fine-tuning script first!")
