#!/usr/bin/env python3
"""
JSON to JSONL Converter for Fine-tuning Data
Converts your finetune_data.json to the proper training format
"""

import json
from pathlib import Path

def convert_json_to_training_data(input_file: str = "finetune_data.json", 
                                  output_file: str = "training/company_alerts_training.jsonl"):
    """Convert JSON format to JSONL training format"""
    
    # Load the JSON data
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Create training directory if it doesn't exist
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    
    # Convert to training format
    training_examples = []
    
    for example in data["alert_examples"]:
        # Format as required by the fine-tuning script
        training_example = {
            "messages": [
                {
                    "role": "user",
                    "content": f"Alert: {example['alert']}"
                },
                {
                    "role": "assistant", 
                    "content": example['expert_response']
                }
            ]
        }
        training_examples.append(training_example)
    
    # Write to JSONL format
    with open(output_file, 'w') as f:
        for example in training_examples:
            f.write(json.dumps(example) + '\n')
    
    print(f"✅ Converted {len(training_examples)} examples")
    print(f"📄 Input file: {input_file}")
    print(f"📁 Output file: {output_file}")
    print(f"📊 Categories covered: {set(ex['category'] for ex in data['alert_examples'])}")
    
    # Show statistics
    categories = {}
    for example in data["alert_examples"]:
        cat = example['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n📈 Distribution:")
    for category, count in categories.items():
        print(f"  - {category}: {count} examples")
    
    return output_file

def add_example_to_json(alert_text: str, expert_response: str, category: str = "general",
                       input_file: str = "finetune_data.json"):
    """Add a new example to the JSON file"""
    
    # Load existing data
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Get next ID
    next_id = max(ex['id'] for ex in data['alert_examples']) + 1
    
    # Create new example
    new_example = {
        "id": next_id,
        "category": category,
        "alert": alert_text,
        "expert_response": expert_response
    }
    
    # Add to data
    data['alert_examples'].append(new_example)
    
    # Save back to file
    with open(input_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Added example #{next_id} - Category: {category}")
    
    return next_id

def interactive_json_editor(input_file: str = "finetune_data.json"):
    """Interactive mode to add examples to JSON file"""
    
    print("🔄 Interactive JSON Alert Data Editor")
    print("Enter 'quit' to finish, 'convert' to generate training file\n")
    
    while True:
        print("\n" + "="*50)
        action = input("📝 Action (add/convert/quit): ").strip().lower()
        
        if action == 'quit':
            break
        elif action == 'convert':
            output_file = convert_json_to_training_data(input_file)
            print(f"🎯 Training file ready: {output_file}")
            break
        elif action == 'add':
            alert_text = input("📢 Enter alert text: ").strip()
            if not alert_text:
                print("❌ Alert text required")
                continue
            
            category = input("🏷️  Category (system/app/security/network/database/cicd): ").strip().lower() or "general"
            
            print("📝 Enter expert response (multi-line, press Ctrl+D when done):")
            expert_response_lines = []
            try:
                while True:
                    line = input()
                    expert_response_lines.append(line)
            except EOFError:
                pass
            
            expert_response = '\n'.join(expert_response_lines).strip()
            
            if expert_response:
                add_example_to_json(alert_text, expert_response, category, input_file)
            else:
                print("❌ Expert response required")
        else:
            print("❌ Unknown action. Use: add, convert, or quit")

if __name__ == "__main__":
    import sys
    
    # Check if JSON file exists
    if not Path("finetune_data.json").exists():
        print("❌ finetune_data.json not found!")
        print("📁 Create the file first or run from the correct directory")
        sys.exit(1)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "convert":
            # Direct conversion using finetune_data.json
            convert_json_to_training_data("finetune_data.json")
        elif sys.argv[1] == "interactive":
            # Interactive mode
            interactive_json_editor()
    else:
        # Default: show options
        print("🎯 JSON Fine-tuning Data Manager")
        print()
        print("Usage:")
        print("  python3 json_to_training.py convert     # Convert finetune_data.json to training format")
        print("  python3 json_to_training.py interactive # Add examples interactively")
        print()
        
        # Show current data stats
        if Path("finetune_data.json").exists():
            with open("finetune_data.json", 'r') as f:
                data = json.load(f)
        
            print(f"📊 Current data: {len(data['alert_examples'])} examples")
            categories = {}
            for example in data["alert_examples"]:
                cat = example['category']
                categories[cat] = categories.get(cat, 0) + 1
        
            print("📈 Distribution:")
            for category, count in categories.items():
                print(f"  - {category}: {count} examples")
        
            print("\n🔄 Run with 'convert' to generate training file")
        else:
            print("❌ finetune_data.json not found! Create it first.")
