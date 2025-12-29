import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import (
    ApplicationBuilder,
    ContextTypes,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ConversationHandler
)
from keep_alive import keep_alive

# --- কনফিগারেশন ---
# আপনার দেওয়া টোকেনটি এখানে বসানো হলো
TOKEN = "8561330173:AAGOtGKX63tsy7-FyGyPoZSGuscQd8M3hlo"

# লগিং সেটআপ
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# --- স্টেটস (Conversation States) ---
(
    START_MENU,          # ওয়েলকাম স্ক্রিন
    CREATE_BOT_TOKEN,    # টোকেন চাওয়া
    MAIN_MENU,           # মেইন মেনু (6 বাটন)
    MANAGE_BOT_LIST,     # বট লিস্ট দেখানো
    BOT_SETTINGS_HUB,    # সেটিংস ড্যাশবোর্ড (Feedback, Shop, etc.)
    START_MSG_DASHBOARD, # স্টার্ট মেসেজ এডিটিং মেনু
    INPUT_MEDIA,         # মিডিয়া ইনপুট নেওয়া
    INPUT_TEXT,          # টেক্সট ইনপুট নেওয়া
    INPUT_BUTTONS,       # বাটন ইনপুট নেওয়া
    BROADCAST_DASHBOARD  # ব্রডকাস্ট মেনু
) = range(10)

# --- ডেটা স্টোরেজ (Temporary Memory) ---
# রিয়েল প্রজেক্টে এখানে ডাটাবেস (SQLite/MongoDB) ব্যবহার করা উচিত।
# স্ট্রাকচার: user_id -> { 'bots': [ {token, name, start_msg_config} ] }
USER_DB = {}

# --- ইউটিলিটি ফাংশন ---

# ওয়েলকাম কিবোর্ড
def get_welcome_keyboard():
    keyboard = [
        [InlineKeyboardButton("➕ Create bot", callback_data='btn_create_bot')],
        [InlineKeyboardButton("⭐ Subscription", callback_data='btn_sub'),
         InlineKeyboardButton("🇬🇧 Language", callback_data='btn_lang')],
        [InlineKeyboardButton("ℹ️ Information", callback_data='btn_info'),
         InlineKeyboardButton("📢 Channel", url='https://t.me/your_channel_link')]
    ]
    return InlineKeyboardMarkup(keyboard)

# মেইন মেনু কিবোর্ড (বট কানেক্ট হওয়ার পর)
def get_main_menu_keyboard():
    keyboard = [
        [InlineKeyboardButton("➕ Create bot", callback_data='btn_create_bot'),
         InlineKeyboardButton("🤖 Manage bots", callback_data='btn_manage_bot')],
        [InlineKeyboardButton("⭐ Subscription", callback_data='btn_sub'),
         InlineKeyboardButton("📢 Channel", url='https://t.me/your_channel_link')],
        [InlineKeyboardButton("🆘 Support", url='https://t.me/your_support_link')]
    ]
    return InlineKeyboardMarkup(keyboard)

# স্টার্ট মেসেজ এডিটিং কিবোর্ড (আপনার ইমেজ অনুযায়ী ১০টি বাটন)
def get_start_msg_keyboard():
    keyboard = [
        [InlineKeyboardButton("🖼️ Media", callback_data='edit_media'), InlineKeyboardButton("👀 See", callback_data='see_media')],
        [InlineKeyboardButton("abc Text", callback_data='edit_text'), InlineKeyboardButton("👀 See", callback_data='see_text')],
        [InlineKeyboardButton("⌨️ Buttons", callback_data='edit_buttons'), InlineKeyboardButton("👀 See", callback_data='see_buttons')],
        [InlineKeyboardButton("👀 Full preview", callback_data='full_preview')],
        [InlineKeyboardButton("📕 Removing bot watermark", callback_data='remove_wm')],
        [InlineKeyboardButton("🏠 Menu", callback_data='goto_main_menu'), InlineKeyboardButton("🔙 Back", callback_data='back_to_settings')]
    ]
    return InlineKeyboardMarkup(keyboard)

# --- হ্যান্ডলার ফাংশন ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """বট স্টার্ট হলে বা প্রথম স্ক্রিন"""
    user = update.effective_user
    # ইউজারের জন্য ডেটাবেস ইনিশিয়ালাইজ
    if user.id not in USER_DB:
        USER_DB[user.id] = {'bots': [], 'active_bot_idx': -1}

    # ওয়েলকাম মেসেজ (ইমেজ থাকলে send_photo ব্যবহার করতে পারেন)
    welcome_text = (
        f"Hi {user.first_name}!\n\n"
        "**Welcome to Laga Trade AI Bot Maker.**\n"
        "Create and manage your bots easily from here."
    )
    
    reply_markup = get_welcome_keyboard()

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.message.edit_text(welcome_text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
    else:
        await update.message.reply_text(welcome_text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
    
    return START_MENU

# --- CREATE BOT FLOW ---

async def create_bot_instruction(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = (
        "➕ **Create bot**\n"
        "To create a new custom bot follow these steps:\n\n"
        " • Go to @BotFather\n"
        " • Start it, send /newbot\n"
        " • Type in the Name the bot will have\n"
        " • Type in the Username that the bot will have\n"
        " • Forward the message you receive from BotFather to @ModularBot (Here)\n"
        " • Done!\n\n"
        "📸 If you want to set the Bot profile picture, send /setuserpic to @Botfather, select the bot and then send the new picture."
    )
    
    keyboard = [[InlineKeyboardButton("🔙 Back", callback_data='back_to_start')]]
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode=ParseMode.MARKDOWN)
    return CREATE_BOT_TOKEN

async def receive_token(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """ইউজার যখন টোকেন পাঠাবে"""
    token_text = update.message.text.strip()
    user_id = update.effective_user.id
    
    # টোকেন সেভ করার লজিক
    new_bot = {
        'token': token_text,
        'name': 'LagaTradeBot', # এপিআই দিয়ে নাম বের করা যায়, আপাতত স্ট্যাটিক
        'start_config': {'text': 'Welcome!', 'media': None, 'buttons': None}
    }
    USER_DB[user_id]['bots'].append(new_bot)
    
    success_text = (
        f"✅ The Bot @lagatradeaibot is now working on ModularBot.\n\n"
        "⚠️ DO NOT send to anyone the message with the token of the Bot, who has it can control your Bot!\n"
        "If you think someone found out about your Bot token, go to @Botfather, use /revoke and then select @lagatradeaibot"
    )
    
    keyboard = [[InlineKeyboardButton("🏠 Main Menu", callback_data='goto_main_menu_direct')]]
    
    await update.message.reply_text(success_text, reply_markup=InlineKeyboardMarkup(keyboard))
    return MAIN_MENU

# --- MAIN MENU & MANAGE BOT ---

async def main_menu_display(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """মেইন মেনু ডিসপ্লে"""
    query = update.callback_query
    if query: await query.answer()
    
    text = "📂 **Main Menu**\nSelect an option below:"
    reply_markup = get_main_menu_keyboard()
    
    if query:
        await query.message.edit_text(text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
    else:
        await update.message.reply_text(text, reply_markup=reply_markup, parse_mode=ParseMode.MARKDOWN)
    
    return MAIN_MENU

async def manage_bot_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manage Bots স্ক্রিন"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    bots = USER_DB[user_id]['bots']
    
    text = (
        "🤖 **Manage bots**\n"
        "From this menu you can manage or delete your bots created with ModularBot."
    )
    
    keyboard = []
    # যতগুলো বট কানেক্ট করা আছে তার বাটন
    for i, bot in enumerate(bots):
        keyboard.append([InlineKeyboardButton(f"🤖 Bot {i+1} (Connected)", callback_data=f"select_bot_{i}")])
    
    keyboard.append([InlineKeyboardButton("🗑️ Delete Bot", callback_data='delete_bot_action')])
    keyboard.append([InlineKeyboardButton("🔙 Back", callback_data='goto_main_menu_direct')])
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode=ParseMode.MARKDOWN)
    return MANAGE_BOT_LIST

# --- BOT SETTINGS DASHBOARD ---

async def bot_settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """বট সেটিংস - যেখানে সব মডিউল থাকে"""
    query = update.callback_query
    await query.answer()
    
    # কোন বট সিলেক্ট করা হয়েছে তা ট্র্যাক করা
    if query.data.startswith("select_bot_"):
        bot_idx = int(query.data.split("_")[-1])
        USER_DB[update.effective_user.id]['active_bot_idx'] = bot_idx

    text = (
        "⚙️ **Bot settings**\n"
        "Choose one of the available options to customize the bot according to your needs.\n\n"
        "• **Feedback module:** Receive and reply to user messages with the addition of filters, automatic replies and more.\n\n"
        "• **Shop module:** The module to create your digital shop.\n\n"
        "• **Menu module:** The module to build menus and submenus of your bot step by step.\n\n"
        "• **Form module:** The module to collect information from users in a guided way."
    )
    
    keyboard = [
        [InlineKeyboardButton("📩 Feedback module", callback_data='mod_feedback')],
        [InlineKeyboardButton("🛍️ Shop module 🆕", callback_data='mod_shop')],
        [InlineKeyboardButton("📂 Menu module", callback_data='mod_menu')],
        [InlineKeyboardButton("📝 Form module", callback_data='mod_form')],
        # --- নিচে আপনার দেওয়া ফাংশন বাটন ---
        [InlineKeyboardButton("👋🏻 Start message", callback_data='setting_start_msg'), InlineKeyboardButton("🔑 Force join", callback_data='setting_force_join')],
        [InlineKeyboardButton("abc Automatic replies", callback_data='setting_auto_reply'), InlineKeyboardButton("📢 Broadcast", callback_data='setting_broadcast')],
        [InlineKeyboardButton("👤 User Management", callback_data='setting_user_man'), InlineKeyboardButton("📊 Statistics", callback_data='setting_stats')],
        [InlineKeyboardButton("⭐ Subscription", callback_data='btn_sub'), InlineKeyboardButton("🇬🇧 Language", callback_data='btn_lang')],
        [InlineKeyboardButton("🔙 Back", callback_data='back_to_manage')]
    ]
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode=ParseMode.MARKDOWN)
    return BOT_SETTINGS_HUB

# --- START MESSAGE CUSTOMIZATION ---

async def start_msg_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start Message মেনু"""
    query = update.callback_query
    await query.answer()
    
    text = (
        "👋🏻 **Start message • Guide**\n"
        "In this menu you can set the message that will be sent to users when they start the bot. "
        "Press /start to see the result."
    )
    
    await query.message.edit_text(text, reply_markup=get_start_msg_keyboard(), parse_mode=ParseMode.MARKDOWN)
    return START_MSG_DASHBOARD

# -- Media --
async def prompt_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    text = (
        "**Send the new post media**\n"
        "Allowed media: photos, videos, files, stickers, GIFs, audio, voice messages, round videos"
    )
    await query.message.edit_text(text, parse_mode=ParseMode.MARKDOWN)
    return INPUT_MEDIA

async def save_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # এখানে মিডিয়া সেভ করা হবে (User DB তে)
    await update.message.reply_text("✅ Message successfully modified.")
    
    # আবার মেনুতে ফেরত নেওয়া
    text = "👋🏻 Start message • Guide\nSelect an option:"
    await update.message.reply_text(text, reply_markup=get_start_msg_keyboard())
    return START_MSG_DASHBOARD

# -- Text --
async def prompt_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    text = (
        "**Send the post message**\n"
        "The following keywords can be added in the text and will be replaced with user data:\n\n"
        "• User first name: %firstname%\n"
        "• User last name: %lastname%\n"
        "• Username: %username%\n"
        "• User Mention: %mention%"
    )
    await query.message.edit_text(text, parse_mode=ParseMode.MARKDOWN)
    return INPUT_TEXT

async def save_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # টেক্সট সেভ করা
    received_text = update.message.text
    # USER_DB update logic here...
    await update.message.reply_text("✅ Message successfully modified.")
    
    text = "👋🏻 Start message • Guide\nSelect an option:"
    await update.message.reply_text(text, reply_markup=get_start_msg_keyboard())
    return START_MSG_DASHBOARD

# -- Buttons --
async def prompt_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    text = (
        "**Set the buttons to insert in the keyboard under the post**\n"
        "Send a message structured as follows:\n\n"
        "• Insert multiple rows of buttons:\n"
        "Button text - t.me/LinkExample\n"
        "Button text - t.me/LinkExample\n\n"
        "• Insert multiple buttons in a single line:\n"
        "Button text - t.me/LinkExample && Button text - t.me/LinkExample\n\n"
        "• Insert a popup/alert:\n"
        "Button text - popup: Text of the popup\n\n"
        "To return the user to the start menu put menu: start"
    )
    await query.message.edit_text(text, parse_mode=ParseMode.MARKDOWN)
    return INPUT_BUTTONS

async def save_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("✅ Message successfully modified.")
    text = "👋🏻 Start message • Guide\nSelect an option:"
    await update.message.reply_text(text, reply_markup=get_start_msg_keyboard())
    return START_MSG_DASHBOARD

# -- Preview --
async def full_preview(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    # ডেমো প্রিভিউ মেসেজ
    preview_text = (
        "**[PREVIEW MODE]**\n\n"
        "Snowman Adventure ☃️\n"
        "Hi Nanna! This is how your message looks."
    )
    # এখানে রিয়েল ইমেজ/বাটন শো করা উচিত যা ইউজার সেট করেছে
    await context.bot.send_message(chat_id=update.effective_chat.id, text=preview_text)
    
    # মেনুতে থাকা
    return START_MSG_DASHBOARD

# --- BROADCAST MODULE ---

async def broadcast_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = (
        "📬 **Broadcast • Guide**\n"
        "Send a message to all bot users simultaneously."
    )
    
    keyboard = [
        [InlineKeyboardButton("🖼️ Media", callback_data='bc_media'), InlineKeyboardButton("abc Text", callback_data='bc_text')],
        [InlineKeyboardButton("⌨️ Buttons", callback_data='bc_buttons')],
        [InlineKeyboardButton("🚀 Send Broadcast", callback_data='bc_send')],
        [InlineKeyboardButton("🔙 Back", callback_data='back_to_settings')]
    ]
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode=ParseMode.MARKDOWN)
    return BROADCAST_DASHBOARD


# --- MAIN EXECUTION ---

if __name__ == '__main__':
    # সার্ভার ব্যাকগ্রাউন্ডে চালানোর জন্য
    keep_alive()
    
    application = ApplicationBuilder().token(TOKEN).build()

    # Conversation Handler সেটআপ (পুরো মেনু সিস্টেম কন্ট্রোল করার জন্য)
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            # 1. Start Screen
            START_MENU: [
                CallbackQueryHandler(create_bot_instruction, pattern='^btn_create_bot$'),
                CallbackQueryHandler(start, pattern='^btn_lang$'), # Placeholder logic
                CallbackQueryHandler(start, pattern='^back_to_start$')
            ],
            
            # 2. Token Input
            CREATE_BOT_TOKEN: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_token),
                CallbackQueryHandler(start, pattern='^back_to_start$')
            ],
            
            # 3. Main Menu
            MAIN_MENU: [
                CallbackQueryHandler(create_bot_instruction, pattern='^btn_create_bot$'),
                CallbackQueryHandler(manage_bot_list, pattern='^btn_manage_bot$'),
                CallbackQueryHandler(main_menu_display, pattern='^goto_main_menu_direct$')
            ],
            
            # 4. Manage Bot List
            MANAGE_BOT_LIST: [
                CallbackQueryHandler(bot_settings, pattern='^select_bot_'),
                CallbackQueryHandler(main_menu_display, pattern='^goto_main_menu_direct$'),
                CallbackQueryHandler(main_menu_display, pattern='^delete_bot_action$') # Delete logic placeholder
            ],
            
            # 5. Bot Settings Hub
            BOT_SETTINGS_HUB: [
                CallbackQueryHandler(start_msg_menu, pattern='^setting_start_msg$'),
                CallbackQueryHandler(broadcast_menu, pattern='^setting_broadcast$'),
                CallbackQueryHandler(manage_bot_list, pattern='^back_to_manage$')
            ],
            
            # 6. Start Message Dashboard
            START_MSG_DASHBOARD: [
                CallbackQueryHandler(prompt_media, pattern='^edit_media$'),
                CallbackQueryHandler(prompt_text, pattern='^edit_text$'),
                CallbackQueryHandler(prompt_buttons, pattern='^edit_buttons$'),
                CallbackQueryHandler(full_preview, pattern='^full_preview$'),
                CallbackQueryHandler(bot_settings, pattern='^back_to_settings$'),
                CallbackQueryHandler(main_menu_display, pattern='^goto_main_menu$')
            ],
            
            # 7. Inputs
            INPUT_MEDIA: [MessageHandler(filters.ALL, save_media)],
            INPUT_TEXT: [MessageHandler(filters.TEXT, save_text)],
            INPUT_BUTTONS: [MessageHandler(filters.TEXT, save_buttons)],
            
            # 8. Broadcast
            BROADCAST_DASHBOARD: [
                CallbackQueryHandler(bot_settings, pattern='^back_to_settings$')
            ]
        },
        fallbacks=[CommandHandler('start', start)]
    )

    application.add_handler(conv_handler)
    
    print("Bot Laga Trade AI is running on Render...")
    application.run_polling()
