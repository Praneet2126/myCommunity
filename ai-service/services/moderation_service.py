"""
Moderation Service
Integrates content moderation from moderation module (Node.js)
"""
import subprocess
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional


class ModerationService:
    """Service for content moderation using Node.js module"""
    
    def __init__(self):
        """Initialize the moderation service"""
        self.moderation_path = Path(__file__).parent.parent.parent / "moderation"
        self.node_script = self.moderation_path / "index.js"
    
    def _call_node_moderation(
        self,
        text: str,
        user_id: Optional[str] = None,
        chat_type: str = "city"
    ) -> Dict[str, Any]:
        """
        Call Node.js moderation module via subprocess
        
        Args:
            text: Content to moderate
            user_id: Optional user ID for repetition detection
            chat_type: 'city' or 'private'
            
        Returns:
            Moderation result dictionary
        """
        try:
            # Create a temporary Node.js script to call the moderation module
            # Use require with relative path from the moderation directory
            script_content = f"""
const contentModerator = require('./index.js');

async function moderate() {{
    try {{
        const result = await contentModerator.moderate(
            {json.dumps(text)},
            {json.dumps(user_id)},
            {json.dumps(chat_type)}
        );
        console.log(JSON.stringify(result));
    }} catch (error) {{
        console.error(JSON.stringify({{error: error.message}}));
        process.exit(1);
    }}
}}

moderate();
"""
            
            # Write temporary script
            temp_script = self.moderation_path / "temp_moderate.js"
            with open(temp_script, "w") as f:
                f.write(script_content)
            
            try:
                # Run Node.js script
                # Use absolute path to node if available, otherwise rely on PATH
                result = subprocess.run(
                    ["node", str(temp_script)],
                    cwd=str(self.moderation_path),
                    capture_output=True,
                    text=True,
                    timeout=30  # Increased timeout for AI model loading (first-time can take longer)
                )
                
                if result.returncode != 0:
                    raise Exception(f"Node.js error: {result.stderr}")
                
                # Parse JSON output
                output = result.stdout.strip()
                if not output:
                    raise Exception("Empty response from moderation service")
                
                moderation_result = json.loads(output)
                
                return moderation_result
                
            finally:
                # Clean up temp script
                if temp_script.exists():
                    temp_script.unlink()
                    
        except subprocess.TimeoutExpired as e:
            raise Exception("Moderation service timeout")
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse moderation response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error calling moderation service: {str(e)}")
    
    def moderate_content(
        self,
        content: str,
        user_id: Optional[str] = None,
        message_id: Optional[str] = None,
        chat_type: str = "city"
    ) -> Dict[str, Any]:
        """
        Moderate content using rule-based and AI checks
        
        Args:
            content: Content to moderate
            user_id: Optional user ID for repetition detection
            message_id: Optional message ID (not used by moderation, but kept for API compatibility)
            chat_type: 'city' or 'private'
            
        Returns:
            Dictionary with:
                - is_safe: bool - Whether content is safe
                - is_spam: bool - Whether content is spam
                - is_abusive: bool - Whether content is abusive
                - confidence_score: float - Confidence score (0-1)
                - flagged_categories: List[str] - List of flag categories
                - suggested_action: Optional[str] - Suggested action
                - reason: Optional[str] - Reason for decision
        """
        try:
            result = self._call_node_moderation(content, user_id, chat_type)
            
            # Map Node.js result to API format
            is_safe = result.get("allowed", True)
            decision = result.get("decision", "ALLOW")
            flags = result.get("flags", [])
            confidence = result.get("confidence", 0.0)
            reason = result.get("reason", None)
            
            # Determine categories
            is_spam = any("spam" in flag.lower() for flag in flags)
            is_abusive = any(
                flag in ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
                for flag in flags
            )
            
            # Determine suggested action
            suggested_action = None
            if decision == "BLOCK":
                suggested_action = "block"
            elif decision == "FLAG":
                suggested_action = "review"
            
            return {
                "is_safe": is_safe,
                "is_spam": is_spam,
                "is_abusive": is_abusive,
                "confidence_score": confidence,
                "flagged_categories": flags,
                "suggested_action": suggested_action,
                "reason": reason
            }
        except Exception as e:
            # On error, check if it's a timeout
            error_message = str(e)
            is_timeout = "timeout" in error_message.lower()
            
            # Don't default to safe on timeout - treat as potential spam
            return {
                "is_safe": False if is_timeout else True,
                "is_spam": is_timeout,  # Treat timeout as potential spam
                "is_abusive": False,
                "confidence_score": 0.0,
                "flagged_categories": (["moderation_error", "timeout"] if is_timeout else ["moderation_error"]),
                "suggested_action": "block" if is_timeout else "review",
                "reason": f"Moderation service error: {error_message}"
            }
