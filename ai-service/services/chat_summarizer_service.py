"""
Chat Summarizer Service
Integrates chat summarization from chat_summarizer module
"""
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

# Cache for the imported function
_summarize_unread_messages = None


def _get_summarize_function():
    """Lazy import of summarize_unread_messages to avoid import errors at module level"""
    global _summarize_unread_messages
    
    if _summarize_unread_messages is None:
        import importlib.util
        import types
        
        # Add parent directory to path so we can import chat_summarizer as a package
        parent_dir = Path(__file__).parent.parent.parent
        if str(parent_dir) not in sys.path:
            sys.path.insert(0, str(parent_dir))
        
        chat_summarizer_path = parent_dir / "chat_summarizer"
        
        # Manually set up the package structure in sys.modules
        # This is required for relative imports to work
        if "chat_summarizer" not in sys.modules:
            pkg = types.ModuleType("chat_summarizer")
            pkg.__path__ = [str(chat_summarizer_path)]
            sys.modules["chat_summarizer"] = pkg
        
        # Load config module first (needed by summarizer)
        if "chat_summarizer.config" not in sys.modules:
            config_spec = importlib.util.spec_from_file_location(
                "chat_summarizer.config",
                chat_summarizer_path / "config.py"
            )
            config_module = importlib.util.module_from_spec(config_spec)
            sys.modules["chat_summarizer.config"] = config_module
            config_spec.loader.exec_module(config_module)
        
        # Load validator module (needed by summarizer)
        if "chat_summarizer.validator" not in sys.modules:
            validator_spec = importlib.util.spec_from_file_location(
                "chat_summarizer.validator",
                chat_summarizer_path / "validator.py"
            )
            validator_module = importlib.util.module_from_spec(validator_spec)
            sys.modules["chat_summarizer.validator"] = validator_module
            validator_spec.loader.exec_module(validator_module)
        
        # Now load summarizer module (can use relative imports now)
        if "chat_summarizer.summarizer" not in sys.modules:
            summarizer_spec = importlib.util.spec_from_file_location(
                "chat_summarizer.summarizer",
                chat_summarizer_path / "summarizer.py"
            )
            summarizer_module = importlib.util.module_from_spec(summarizer_spec)
            sys.modules["chat_summarizer.summarizer"] = summarizer_module
            summarizer_spec.loader.exec_module(summarizer_module)
            _summarize_unread_messages = summarizer_module.summarize_unread_messages
        else:
            # Already loaded, just get the function
            _summarize_unread_messages = sys.modules["chat_summarizer.summarizer"].summarize_unread_messages
    
    return _summarize_unread_messages


class ChatSummarizerService:
    """Service for summarizing chat messages"""
    
    def __init__(self):
        """Initialize the chat summarizer service"""
        pass
    
    def summarize_messages(
        self,
        messages: List[str]
    ) -> Dict[str, Any]:
        """
        Summarize a list of chat messages
        
        Args:
            messages: List of message strings to summarize
            
        Returns:
            Dictionary with:
                - summary: List of bullet point strings (max 5)
                - key_points: List of bullet point strings (same as summary)
                - message_count: Number of messages processed
                - word_count: Total word count
                - date_range: Optional date range string
                - summarized: Whether summarization was performed
                - reason: Reason if not summarized
        """
        try:
            summarize_unread_messages = _get_summarize_function()
            result = summarize_unread_messages(messages)
            
            # Format response to match API expectations
            return {
                "summary": "\n".join(result.get("summary", [])) if result.get("summarized") else "Not enough messages to summarize.",
                "key_points": result.get("summary", []),
                "message_count": result.get("stats", {}).get("message_count", 0),
                "word_count": result.get("stats", {}).get("word_count", 0),
                "date_range": None,  # Not available from summarizer
                "summarized": result.get("summarized", False),
                "reason": result.get("reason", "Unknown")
            }
        except Exception as e:
            raise Exception(f"Error summarizing messages: {str(e)}")
