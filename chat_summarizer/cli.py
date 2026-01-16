#!/usr/bin/env python3
"""Command-line interface for testing chat summarizer."""

import sys
import json
import os
import pathlib

# CRITICAL: Load .env file BEFORE any module imports
# This ensures the environment variable is available when config.py loads
try:
    from dotenv import load_dotenv
    # Try multiple possible .env locations
    env_paths = [
        pathlib.Path(__file__).parent.parent / '.env',  # backend/.env (relative to cli.py)
        pathlib.Path.cwd() / '.env',  # Current working directory
        pathlib.Path(__file__).parent / '.env',  # chat_summarizer/.env
    ]
    
    for env_path in env_paths:
        if env_path.exists():
            load_result = load_dotenv(env_path, override=True)
            if load_result:
                # Successfully loaded at least one .env file
                break
except (ImportError, Exception):
    # python-dotenv not available or error loading - continue anyway
    # The config.py module will also try to load it
    pass

# Now import the module (config.py will also try to load .env, but we've already loaded it)
from chat_summarizer import summarize_unread_messages


def interactive_mode():
    """Interactive mode for entering messages."""
    print("=" * 60)
    print("Chat Summarizer - Interactive Mode")
    print("=" * 60)
    print("\nEnter messages one by one. Type 'DONE' when finished.")
    print("Type 'QUIT' to exit.\n")
    
    messages = []
    message_num = 1
    
    while True:
        try:
            message = input(f"Message {message_num} (or 'DONE'/'QUIT'): ").strip()
            
            if message.upper() == 'QUIT':
                print("\nExiting...")
                return
            
            if message.upper() == 'DONE':
                if len(messages) == 0:
                    print("No messages entered. Exiting...")
                    return
                break
            
            if message:
                messages.append(message)
                message_num += 1
            else:
                print("  (Empty message skipped)")
        
        except KeyboardInterrupt:
            print("\n\nExiting...")
            return
    
    print(f"\n{'=' * 60}")
    print(f"Processing {len(messages)} messages...")
    print("=" * 60)
    
    result = summarize_unread_messages(messages)
    display_result(result)


def file_mode(file_path):
    """Read messages from a file (one per line)."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            messages = [line.strip() for line in f if line.strip()]
        
        if not messages:
            print(f"Error: File '{file_path}' is empty or contains no valid messages.")
            return
        
        print(f"Loaded {len(messages)} messages from '{file_path}'")
        print("=" * 60)
        
        result = summarize_unread_messages(messages)
        display_result(result)
    
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
    except Exception as e:
        print(f"Error reading file: {e}")


def json_mode(file_path):
    """Read messages from a JSON file (array of strings)."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            messages = [str(msg).strip() for msg in data if str(msg).strip()]
        elif isinstance(data, dict) and 'messages' in data:
            messages = [str(msg).strip() for msg in data['messages'] if str(msg).strip()]
        else:
            print("Error: JSON file must contain an array of messages or a dict with 'messages' key.")
            return
        
        if not messages:
            print("Error: No valid messages found in JSON file.")
            return
        
        print(f"Loaded {len(messages)} messages from '{file_path}'")
        print("=" * 60)
        
        result = summarize_unread_messages(messages)
        display_result(result)
    
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON file: {e}")
    except Exception as e:
        print(f"Error reading file: {e}")


def display_result(result):
    """Display the summarization result in a formatted way."""
    print("\n" + "=" * 60)
    print("RESULT")
    print("=" * 60)
    
    print(f"\nSummarized: {result['summarized']}")
    print(f"Message Count: {result['stats']['message_count']}")
    print(f"Word Count: {result['stats']['word_count']}")
    print(f"Reason: {result['reason']}")
    
    if result['summarized']:
        print(f"\n{'=' * 60}")
        print(f"SUMMARY ({len(result['summary'])} bullet points)")
        print("=" * 60)
        
        for i, bullet in enumerate(result['summary'], 1):
            print(f"\n{i}. {bullet}")
        
        print("\n" + "=" * 60)
    else:
        print(f"\n{'=' * 60}")
        print("NO SUMMARY GENERATED")
        print("=" * 60)
        print(f"\nReason: {result['reason']}")
        print("\nThresholds:")
        print(f"  - Messages: {result['stats']['message_count']}/15 (need ≥15)")
        print(f"  - Words: {result['stats']['word_count']}/200 (need ≥200)")


def main():
    """Main CLI entry point."""
    if len(sys.argv) == 1:
        # No arguments - interactive mode
        interactive_mode()
    
    elif len(sys.argv) == 2:
        file_path = sys.argv[1]
        
        # Auto-detect file type
        if file_path.endswith('.json'):
            json_mode(file_path)
        else:
            file_mode(file_path)
    
    elif len(sys.argv) == 3 and sys.argv[1] == '--json':
        json_mode(sys.argv[2])
    
    elif len(sys.argv) == 3 and sys.argv[1] == '--file':
        file_mode(sys.argv[2])
    
    else:
        print("Usage:")
        print("  python3 cli.py                    # Interactive mode")
        print("  python3 cli.py messages.txt        # Read from text file (one message per line)")
        print("  python3 cli.py messages.json       # Read from JSON file")
        print("  python3 cli.py --file messages.txt # Explicitly specify text file")
        print("  python3 cli.py --json messages.json # Explicitly specify JSON file")
        sys.exit(1)


if __name__ == "__main__":
    main()
