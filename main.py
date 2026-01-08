import os
import sys
import subprocess
import signal
import logging
import asyncio
from typing import Dict
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# Configuration
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")  # Set this in Render Environment Variables
TRUSTED_USERS = [6040791692, 8244641590]  # Replace with actual Telegram User IDs
MAX_FILE_SIZE = 50 * 1024  # 50 KB
TIMEOUT_SECONDS = 120
USERS_DIR = "users"
LOGS_DIR = "logs"

# Security Blacklist
FORBIDDEN_KEYWORDS = [
    "import os", "from os",
    "import sys", "from sys",
    "import subprocess", "from subprocess",
    "import socket", "from socket",
    "import requests", "from requests",
    "eval(", "exec(",
    "while True",
    "for (;;)"
]

# Global Registry to track running processes: {user_id: subprocess.Popen}
process_registry: Dict[int, subprocess.Popen] = {}

# Logging Setup
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

def ensure_directories():
    """Create necessary directories if they don't exist."""
    os.makedirs(USERS_DIR, exist_ok=True)
    os.makedirs(LOGS_DIR, exist_ok=True)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message."""
    await update.message.reply_text("System Active. Upload a .py file to run.")

def terminate_existing_process(user_id: int):
    """Kill any running process for the user."""
    if user_id in process_registry:
        proc = process_registry[user_id]
        if proc.poll() is None:  # Process is still running
            try:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()
            except Exception as e:
                logger.error(f"Error terminating process for {user_id}: {e}")
        del process_registry[user_id]

def validate_content(file_path: str) -> bool:
    """Scan file content for forbidden keywords and binary data."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check for forbidden keywords
        for keyword in FORBIDDEN_KEYWORDS:
            if keyword in content:
                return False
        return True
    except UnicodeDecodeError:
        # Reject binary files
        return False
    except Exception:
        return False

async def monitor_execution(user_id: int, proc: subprocess.Popen):
    """Monitor process for timeout and cleanup."""
    try:
        # Wait for timeout
        await asyncio.sleep(TIMEOUT_SECONDS)
        
        # Check if still running
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=1)
            except subprocess.TimeoutExpired:
                proc.kill()
            
            # Clean up registry
            if user_id in process_registry and process_registry[user_id] == proc:
                del process_registry[user_id]
            
            logger.info(f"Process for user {user_id} terminated due to timeout.")
    except Exception as e:
        logger.error(f"Monitor error for {user_id}: {e}")

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle python file uploads."""
    user = update.effective_user
    user_id = user.id

    # 1. Access Control
    if user_id not in TRUSTED_USERS:
        return  # Silent ignore for non-trusted users

    doc = update.message.document
    
    # 2. File Validation (Extension & Size)
    if not doc.file_name.endswith('.py'):
        await update.message.reply_text("Upload rejected due to security policy")
        return

    if doc.file_size > MAX_FILE_SIZE:
        await update.message.reply_text("Upload rejected due to security policy")
        return

    # Prepare paths
    ensure_directories()
    file_path = os.path.join(USERS_DIR, f"{user_id}.py")
    log_path = os.path.join(LOGS_DIR, f"{user_id}.log")

    try:
        # 3. Download File
        new_file = await doc.get_file()
        await new_file.download_to_drive(file_path)

        # 4. Content Security Scan
        if not validate_content(file_path):
            os.remove(file_path)
            await update.message.reply_text("Upload rejected due to security policy")
            return

        # 5. Process Management
        terminate_existing_process(user_id)

        # Open log file for stdout/stderr
        log_file = open(log_path, "w")

        # 6. Execute
        # Restrict environment variables and run inside users directory
        proc = subprocess.Popen(
            [sys.executable, f"{user_id}.py"],  # Run assuming CWD is ./users/
            cwd=USERS_DIR,
            stdout=log_file,
            stderr=log_file,
            env={},  # Empty env for security
            text=True
        )

        process_registry[user_id] = proc

        # Start background monitor for timeout
        asyncio.create_task(monitor_execution(user_id, proc))

        await update.message.reply_text("Your bot is running securely on Render (free tier)")

    except Exception as e:
        logger.error(f"Execution error for {user_id}: {e}")
        await update.message.reply_text("Failed to start your bot. Check logs.")

def main():
    """Main entry point."""
    if not TOKEN:
        logger.critical("Token not found. Set TELEGRAM_BOT_TOKEN env variable.")
        sys.exit(1)

    ensure_directories()

    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.Document.ALL, handle_document))

    # Run the bot using long polling
    application.run_polling()

if __name__ == "__main__":
    main()
