#!/usr/bin/env python3
"""
Data Combiner: Merge AI-generated and manual JSON data for fine-tuning
"""

import json
from pathlib import Path
from typing import Dict, List

def combine_datasets(*input_files: str, output_file: str = "combined_finetune_data.json") -> str:
    """Combine multiple JSON datasets into one training dataset"""
    
    combined_data = {"alert_examples": []}
    total_examples = 0
    sources = {}
    
    for input_file in input_files:
        if not Path(input_file).exists():
            print(f"⚠️  Warning: {input_file} not found, skipping...")
            continue
            
        print(f"📂 Loading: {input_file}")
        
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        examples = data.get("alert_examples", [])
        source_name = Path(input_file).stem
        
        # Add source tracking and update IDs
        for i, example in enumerate(examples):
            example["id"] = total_examples + i + 1
            example["source"] = source_name
            combined_data["alert_examples"].append(example)
        
        # Track statistics
        sources[source_name] = len(examples)
        total_examples += len(examples)
        
        print(f"  ✅ Added {len(examples)} examples from {source_name}")
    
    # Save combined dataset
    with open(output_file, 'w') as f:
        json.dump(combined_data, f, indent=2)
    
    # Show statistics
    print(f"\n📊 Combined Dataset Statistics:")
    print(f"  📁 Output file: {output_file}")
    print(f"  📈 Total examples: {total_examples}")
    print(f"  🔢 Sources:")
    for source, count in sources.items():
        percentage = (count / total_examples) * 100
        print(f"    - {source}: {count} examples ({percentage:.1f}%)")
    
    # Category distribution
    categories = {}
    for example in combined_data["alert_examples"]:
        cat = example.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"  📊 Categories:")
    for category, count in categories.items():
        percentage = (count / total_examples) * 100
        print(f"    - {category}: {count} examples ({percentage:.1f}%)")
    
    return output_file

def validate_dataset(dataset_file: str) -> bool:
    """Validate the combined dataset for common issues"""
    
    print(f"🔍 Validating dataset: {dataset_file}")
    
    with open(dataset_file, 'r') as f:
        data = json.load(f)
    
    examples = data.get("alert_examples", [])
    issues = []
    
    for i, example in enumerate(examples):
        # Check required fields
        required_fields = ["id", "category", "alert", "expert_response"]
        for field in required_fields:
            if field not in example or not example[field]:
                issues.append(f"Example {i+1}: Missing or empty '{field}'")
        
        # Check response quality
        response = example.get("expert_response", "")
        if response:
            if len(response) < 50:
                issues.append(f"Example {i+1}: Response too short ({len(response)} chars)")
            
            if "**Immediate Actions:**" not in response:
                issues.append(f"Example {i+1}: Missing structured format")
        
        # Check for duplicates (by alert text)
        alert_text = example.get("alert", "")
        duplicates = [ex for ex in examples if ex.get("alert") == alert_text and ex["id"] != example["id"]]
        if duplicates:
            issues.append(f"Example {i+1}: Duplicate alert text found")
    
    # Show results
    if issues:
        print(f"❌ Found {len(issues)} validation issues:")
        for issue in issues[:10]:  # Show first 10 issues
            print(f"  - {issue}")
        if len(issues) > 10:
            print(f"  ... and {len(issues) - 10} more issues")
        return False
    else:
        print(f"✅ Dataset validation passed!")
        print(f"  📊 {len(examples)} examples validated successfully")
        return True

def prepare_for_training(combined_file: str = "combined_finetune_data.json") -> str:
    """Prepare combined dataset for fine-tuning"""
    
    print(f"🎯 Preparing {combined_file} for fine-tuning...")
    
    # First validate
    if not validate_dataset(combined_file):
        print("⚠️  Please fix validation issues before training")
        return None
    
    # Convert to training format
    from json_to_training import convert_json_to_training_data
    
    training_file = convert_json_to_training_data(
        input_file=combined_file,
        output_file="training/combined_training_data.jsonl"
    )
    
    print(f"✅ Ready for fine-tuning!")
    print(f"📁 Training file: {training_file}")
    print(f"🚀 Next step: python3 finetune_phi3.py")
    
    return training_file

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("🔄 Data Combiner for Fine-tuning")
        print()
        print("Usage:")
        print("  # Combine specific files")
        print("  python3 combine_datasets.py file1.json file2.json")
        print()
        print("  # Combine all JSON files in directory")
        print("  python3 combine_datasets.py *.json")
        print()
        print("Example:")
        print("  python3 combine_datasets.py finetune_data.json distilled_finetune_data.json")
        sys.exit(1)
    
    # Get input files from command line
    input_files = sys.argv[1:]
    
    print(f"🔄 Combining {len(input_files)} datasets...")
    
    # Combine datasets
    combined_file = combine_datasets(*input_files)
    
    # Prepare for training
    training_file = prepare_for_training(combined_file)
    
    if training_file:
        print(f"\n🎯 Success! Your combined dataset is ready for fine-tuning.")
        print(f"📊 Data sources combined: {len(input_files)}")
        print(f"🔥 Ready to create your specialized Phi-3 Mini!")
    else:
        print(f"\n❌ Please fix validation issues before proceeding.")
