#!/usr/bin/env python3
"""
Phi-3 Mini Fine-tuning Script for Alert Analysis
Uses LoRA (Low-Rank Adaptation) for efficient fine-tuning
"""

import os
import json
import torch
from datasets import Dataset, load_dataset
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import wandb
from typing import Dict, List

class Phi3AlertFineTuner:
    def __init__(self, model_name: str = "microsoft/Phi-3-mini-4k-instruct"):
        self.model_name = model_name
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        print(f"🚀 Using device: {self.device}")
        
        # Load model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "right"
        
        # Load model with optimizations for Mac
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if self.device == "mps" else torch.float32,
            device_map="auto" if self.device == "cpu" else None,
            trust_remote_code=True,
            low_cpu_mem_usage=True
        )
        
        if self.device == "mps":
            self.model = self.model.to(self.device)
    
    def setup_lora(self, r: int = 16, alpha: int = 32, dropout: float = 0.1):
        """Setup LoRA configuration for efficient fine-tuning"""
        lora_config = LoraConfig(
            r=r,  # Rank - higher = more parameters but better quality
            lora_alpha=alpha,  # LoRA scaling parameter
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],  # Phi-3 attention modules
            lora_dropout=dropout,
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        # Prepare model for training
        self.model = prepare_model_for_kbit_training(self.model)
        self.model = get_peft_model(self.model, lora_config)
        
        # Print trainable parameters
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        all_params = sum(p.numel() for p in self.model.parameters())
        
        print(f"📊 Trainable parameters: {trainable_params:,}")
        print(f"📊 All parameters: {all_params:,}")
        print(f"📊 Trainable %: {100 * trainable_params / all_params:.2f}%")
        
        return self.model
    
    def format_prompt(self, user_content: str, assistant_content: str = "") -> str:
        """Format prompt for Phi-3"""
        if assistant_content:
            return f"<|user|>\n{user_content}<|end|>\n<|assistant|>\n{assistant_content}<|end|>"
        else:
            return f"<|user|>\n{user_content}<|end|>\n<|assistant|>\n"
    
    def preprocess_data(self, examples: Dict) -> Dict:
        """Preprocess training data"""
        inputs = []
        
        for messages in examples["messages"]:
            # Extract user and assistant messages
            user_msg = messages[0]["content"]  # User message
            assistant_msg = messages[1]["content"]  # Assistant response
            
            # Format as Phi-3 prompt
            formatted = self.format_prompt(user_msg, assistant_msg)
            inputs.append(formatted)
        
        # Tokenize
        tokenized = self.tokenizer(
            inputs,
            truncation=True,
            padding=True,
            max_length=2048,  # Phi-3 context length
            return_tensors="pt"
        )
        
        # Set labels for training (copy of input_ids)
        tokenized["labels"] = tokenized["input_ids"].clone()
        
        return tokenized
    
    def load_training_data(self, data_file: str) -> Dataset:
        """Load and preprocess training data"""
        # Load JSONL data
        dataset = load_dataset("json", data_files=data_file)["train"]
        
        # Preprocess
        tokenized_dataset = dataset.map(
            self.preprocess_data,
            batched=True,
            remove_columns=dataset.column_names
        )
        
        return tokenized_dataset
    
    def train(self, 
              train_data_file: str,
              output_dir: str = "./phi3_alert_finetuned",
              num_epochs: int = 3,
              batch_size: int = 2,  # Smaller for Mac compatibility
              learning_rate: float = 2e-4,
              warmup_steps: int = 50,
              logging_steps: int = 10,
              save_steps: int = 200,
              eval_steps: int = 200):
        """Fine-tune the model"""
        
        # Load training data
        print("📚 Loading training data...")
        train_dataset = self.load_training_data(train_data_file)
        print(f"📚 Training samples: {len(train_dataset)}")
        
        # Adjust parameters based on dataset size
        if len(train_dataset) > 100:
            print("📊 Large dataset detected (>100 examples)")
            print("🎯 Adjusting training parameters for better results...")
            num_epochs = 2  # Fewer epochs for larger datasets
            batch_size = max(1, batch_size)  # Ensure minimum batch size
            warmup_steps = min(100, len(train_dataset) // 10)  # 10% of data for warmup
            
        print(f"⚙️  Training configuration:")
        print(f"  📈 Epochs: {num_epochs}")
        print(f"  📦 Batch size: {batch_size}")
        print(f"  🔥 Learning rate: {learning_rate}")
        print(f"  🌡️  Warmup steps: {warmup_steps}")
        
        # Setup training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,  # Effective batch size = batch_size * 4
            warmup_steps=warmup_steps,
            learning_rate=learning_rate,
            fp16=False,  # Use fp16 for GPU, bf16 for TPU
            logging_steps=logging_steps,
            save_steps=save_steps,
            eval_steps=eval_steps,
            save_total_limit=3,
            remove_unused_columns=False,
            push_to_hub=False,
            report_to="wandb" if os.getenv("WANDB_API_KEY") else None,
            load_best_model_at_end=False,  # Fixed: Disabled for small dataset without evaluation
            ddp_find_unused_parameters=False,
            dataloader_num_workers=0,  # Disable multiprocessing for Mac compatibility
            save_safetensors=True,  # Use safetensors format
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer, 
            mlm=False,  # Causal LM, not masked LM
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            data_collator=data_collator,
            tokenizer=self.tokenizer,
        )
        
        # Start training
        print("🎯 Starting fine-tuning...")
        trainer.train()
        
        # Save the final model
        print("💾 Saving fine-tuned model...")
        trainer.save_model()
        self.tokenizer.save_pretrained(output_dir)
        
        print(f"✅ Fine-tuning complete! Model saved to: {output_dir}")
        
        return trainer
    
    def test_model(self, prompt: str, max_length: int = 512) -> str:
        """Test the fine-tuned model"""
        formatted_prompt = self.format_prompt(prompt)
        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                num_beams=1,
                early_stopping=True
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the assistant's response
        assistant_start = response.find("<|assistant|>")
        if assistant_start != -1:
            response = response[assistant_start + len("<|assistant|>"):].strip()
        
        return response

# Example usage
if __name__ == "__main__":
    # Initialize fine-tuner
    fine_tuner = Phi3AlertFineTuner()
    
    # Setup LoRA
    model = fine_tuner.setup_lora(r=16, alpha=32, dropout=0.1)
    
    # Train the model
    fine_tuner.train(
        train_data_file="training/company_alerts_training.jsonl",  # Default training file
        output_dir="./phi3_alert_finetuned",
        num_epochs=2,  # Good for larger datasets
        batch_size=2,  # Small batch size for Mac
        learning_rate=2e-4
    )
    
    # Test the model
    test_prompt = "High CPU usage detected on server prod-web-01. CPU utilization: 95% for 8 minutes. What should I do?"
    response = fine_tuner.test_model(test_prompt)
    print(f"\n🧪 Test Response:\n{response}")
