import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ConversationHandler
from keep_alive import keep_alive

# --- কনফিগারেশন ---
TOKEN = "8561330173:AAGOtGKX63tsy7-FyGyPoZSGuscQd8M3hlo"  # এখানে আপনার টোকেন দিন

# লগিং সেটআপ
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# স্টেটস (States) নির্ধারণ
(SELECTING_ACTION, CREATE_BOT_TOKEN, MAIN_MENU, MANAGE_BOT_SELECTION, 
 BOT_SETTINGS, START_MSG_MENU, EDIT_MEDIA, EDIT_TEXT, EDIT_BUTTONS, BROADCAST_MENU) = range(10)

# ডেটা স্টোরেজ (Temporary dictionary for demo)
user_data_store = {}

# --- ইউটিলিটি ফাংশন ---
def get_main_menu_keyboard():
    keyboard = [
        [InlineKeyboardButton("➕ Create bot", callback_data='create_bot'),
         InlineKeyboardButton("🤖 Manage bot", callback_data='manage_bot')],
        [InlineKeyboardButton("⭐ Subscription", callback_data='sub'),
         InlineKeyboardButton("📢 Channel", url='https://t.me/yourchannel')],
        [InlineKeyboardButton("🆘 Support", url='https://t.me/yoursupport')]
    ]
    return InlineKeyboardMarkup(keyboard)

def get_start_msg_keyboard():
    # আপনার ইমেজের মত ১০টি বাটন
    keyboard = [
        [InlineKeyboardButton("🖼️ Media", callback_data='sm_media'), InlineKeyboardButton("👀 See", callback_data='see_media')],
        [InlineKeyboardButton("abc Text", callback_data='sm_text'), InlineKeyboardButton("👀 See", callback_data='see_text')],
        [InlineKeyboardButton("⌨️ Buttons", callback_data='sm_buttons'), InlineKeyboardButton("👀 See", callback_data='see_buttons')],
        [InlineKeyboardButton("👀 Full preview", callback_data='sm_preview')],
        [InlineKeyboardButton("📕 Removing bot watermark", callback_data='sm_watermark')],
        [InlineKeyboardButton("🏠 Menu", callback_data='main_menu'), InlineKeyboardButton("🔙 Back", callback_data='bot_settings')]
    ]
    return InlineKeyboardMarkup(keyboard)

# --- হ্যান্ডলার ফাংশন ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    welcome_text = (
        f"Hi {user.first_name}!\n\n"
        "Welcome to the **Laga Trade AI** Bot Maker.\n"
        "Choose an option below:"
    )
    # প্রথম ৫টি বাটন
    keyboard = [
        [InlineKeyboardButton("➕ Create bot", callback_data='create_bot')],
        [InlineKeyboardButton("⭐ Subscription", callback_data='sub'),
         InlineKeyboardButton("🇬🇧 Language", callback_data='lang')],
        [InlineKeyboardButton("ℹ️ Information", callback_data='info'),
         InlineKeyboardButton("📢 Channel", url='https://t.me/yourchannel')]
    ]
    
    if update.callback_query:
        await update.callback_query.message.edit_text(welcome_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    else:
        await update.message.reply_text(welcome_text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    
    return SELECTING_ACTION

async def create_bot_instruction(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = (
        "➕ **Create bot**\n"
        "To create a new custom bot follow these steps:\n\n"
        "• Go to @BotFather\n"
        "• Start it, send /newbot\n"
        "• Type in the Name the bot will have\n"
        "• Type in the Username that the bot will have\n"
        "• Forward the message you receive from BotFather to me\n"
        "• Done!\n\n"
        "📸 If you want to set the Bot profile picture, send /setuserpic to @Botfather.\n\n"
        "**Send the API Token now:**"
    )
    keyboard = [[InlineKeyboardButton("🔙 Back", callback_data='start')]]
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    return CREATE_BOT_TOKEN

async def receive_token(update: Update, context: ContextTypes.DEFAULT_TYPE):
    token_text = update.message.text
    # এখানে টোকেন ভ্যালিডেশন লজিক থাকবে (ডেমোর জন্য স্কিপ করা হলো)
    
    # টোকেন সেভ করা হচ্ছে
    user_id = update.effective_user.id
    if user_id not in user_data_store:
        user_data_store[user_id] = {'bots': [], 'current_bot': None}
    
    bot_name = "NewBot" # এখানে এপিআই কল করে নাম বের করা যাবে
    user_data_store[user_id]['bots'].append({'token': token_text, 'name': bot_name})
    
    success_text = (
        f"✅ The Bot @{bot_name} is now working on Laga Trade AI.\n\n"
        "⚠️ DO NOT send to anyone the message with the token of the Bot, who has it can control your Bot!\n"
        "If you think someone found out about your Bot token, go to @Botfather, use /revoke."
    )
    
    keyboard = [[InlineKeyboardButton("🏠 Main Menu", callback_data='main_menu')]]
    await update.message.reply_text(success_text, reply_markup=InlineKeyboardMarkup(keyboard))
    return MAIN_MENU

async def main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query: await query.answer()
    
    text = "Choose an option from the main menu:"
    reply_markup = get_main_menu_keyboard()
    
    if query:
        await query.message.edit_text(text, reply_markup=reply_markup)
    else:
        await update.message.reply_text(text, reply_markup=reply_markup)
    return MAIN_MENU

async def manage_bot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    bots = user_data_store.get(user_id, {}).get('bots', [])
    
    text = (
        "🤖 **Manage bots**\n"
        "From this menu you can manage or delete your bots created."
    )
    
    keyboard = []
    # কানেক্টেড বটগুলোর লিস্ট বাটন
    for idx, bot in enumerate(bots):
        keyboard.append([InlineKeyboardButton(f"🤖 Bot {idx+1}", callback_data=f"select_bot_{idx}")])
    
    keyboard.append([InlineKeyboardButton("🗑️ Delete Bot", callback_data='delete_bot')])
    keyboard.append([InlineKeyboardButton("🔙 Back", callback_data='main_menu')])
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    return MANAGE_BOT_SELECTION

async def bot_settings_dashboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    # মেনু সিলেকশন হ্যান্ডলিং
    if query.data.startswith("select_bot_"):
        # বট সিলেক্ট করা হলো
        pass 

    text = (
        "⚙️ **Bot settings**\n"
        "Choose one of the available options to customize the bot according to your needs.\n\n"
        "• **Feedback module:** Receive and reply to user messages.\n"
        "• **Shop module:** Create your digital shop.\n"
        "• **Menu module:** Build menus and submenus.\n"
        "• **Form module:** Collect information from users."
    )
    
    # অনেকগুলো বাটন (আপনার ইমেজ অনুযায়ী)
    keyboard = [
        [InlineKeyboardButton("📩 Feedback module", callback_data='feedback')],
        [InlineKeyboardButton("🛍️ Shop module 🆕", callback_data='shop')],
        [InlineKeyboardButton("📂 Menu module", callback_data='menu_mod')],
        [InlineKeyboardButton("📝 Form module", callback_data='form')],
        [InlineKeyboardButton("👋🏻 Start message", callback_data='start_msg'), InlineKeyboardButton("🔑 Force join", callback_data='force_join')],
        [InlineKeyboardButton("abc Automatic replies", callback_data='auto_rep'), InlineKeyboardButton("📢 Broadcast", callback_data='broadcast')],
        [InlineKeyboardButton("👤 User Management", callback_data='user_man'), InlineKeyboardButton("📊 Statistics", callback_data='stats')],
        [InlineKeyboardButton("⭐ Subscription", callback_data='sub'), InlineKeyboardButton("🇬🇧 Language", callback_data='lang')],
        [InlineKeyboardButton("🔙 Back", callback_data='manage_bot')]
    ]
    
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    return BOT_SETTINGS

# --- START MESSAGE LOGIC ---

async def start_message_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = (
        "👋🏻 **Start message • Guide**\n"
        "In this menu you can set the message that will be sent to users when they start the bot.\n"
        "Press /start to see the result."
    )
    await query.message.edit_text(text, reply_markup=get_start_msg_keyboard(), parse_mode='Markdown')
    return START_MSG_MENU

async def edit_media_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    text = (
        "Send the new post media\n"
        "Allowed media: photos, videos, files, stickers, GIFs, audio.\n"
    )
    await query.message.edit_text(text)
    return EDIT_MEDIA

async def save_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # এখানে মিডিয়া আইডি সেভ করা হবে
    await update.message.reply_text("✅ Message successfully modified.")
    
    # আবার মেনু দেখান
    text = "👋🏻 Start message menu"
    await update.message.reply_text(text, reply_markup=get_start_msg_keyboard())
    return START_MSG_MENU

async def edit_text_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    text = (
        "Send the post message\n"
        "The following keywords can be added:\n"
        "• %firstname% - User first name\n"
        "• %username% - Username\n"
        "• %mention% - User Mention"
    )
    await query.message.edit_text(text)
    return EDIT_TEXT

async def save_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # টেক্সট সেভ করা হবে
    await update.message.reply_text("✅ Message successfully modified.")
    
    text = "👋🏻 Start message menu"
    await update.message.reply_text(text, reply_markup=get_start_msg_keyboard())
    return START_MSG_MENU

async def edit_buttons_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    text = (
        "Set the buttons to insert in the keyboard.\n\n"
        "Format:\n"
        "Button text - t.me/Link\n"
        "Btn1 - link1 && Btn2 - link2"
    )
    await query.message.edit_text(text)
    return EDIT_BUTTONS

async def save_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("✅ Buttons successfully modified.")
    text = "👋🏻 Start message menu"
    await update.message.reply_text(text, reply_markup=get_start_msg_keyboard())
    return START_MSG_MENU

async def full_preview(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    # ডেমো প্রিভিউ
    await context.bot.send_message(chat_id=update.effective_chat.id, text="[PREVIEW]\nHello User!\n(This is how it will look)")
    return START_MSG_MENU

# --- BROADCAST LOGIC ---
async def broadcast_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    text = (
        "📬 **Broadcast • Guide**\n"
        "Send a message to all bot users simultaneously."
    )
    # ব্রডকাস্টের জন্য একই ধরনের বাটন (Media, Text, etc)
    keyboard = [
        [InlineKeyboardButton("🖼️ Media", callback_data='bc_media'), InlineKeyboardButton("abc Text", callback_data='bc_text')],
        [InlineKeyboardButton("🚀 Send Broadcast", callback_data='send_bc')],
        [InlineKeyboardButton("🔙 Back", callback_data='bot_settings')]
    ]
    await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown')
    return BROADCAST_MENU

# --- MAIN SETUP ---

if __name__ == '__main__':
    # সার্ভার চালু রাখা
    keep_alive()
    
    application = ApplicationBuilder().token(TOKEN).build()

    # কনভার্সেশন হ্যান্ডলার
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            SELECTING_ACTION: [
                CallbackQueryHandler(create_bot_instruction, pattern='^create_bot$'),
                CallbackQueryHandler(start, pattern='^start$') # Back handling
            ],
            CREATE_BOT_TOKEN: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_token),
                CallbackQueryHandler(start, pattern='^start$')
            ],
            MAIN_MENU: [
                CallbackQueryHandler(create_bot_instruction, pattern='^create_bot$'),
                CallbackQueryHandler(manage_bot, pattern='^manage_bot$')
            ],
            MANAGE_BOT_SELECTION: [
                CallbackQueryHandler(bot_settings_dashboard, pattern='^select_bot_'),
                CallbackQueryHandler(main_menu, pattern='^main_menu$')
            ],
            BOT_SETTINGS: [
                CallbackQueryHandler(start_message_menu, pattern='^start_msg$'),
                CallbackQueryHandler(broadcast_menu, pattern='^broadcast$'),
                CallbackQueryHandler(manage_bot, pattern='^manage_bot$') # Back handling
            ],
            START_MSG_MENU: [
                CallbackQueryHandler(edit_media_prompt, pattern='^sm_media$'),
                CallbackQueryHandler(edit_text_prompt, pattern='^sm_text$'),
                CallbackQueryHandler(edit_buttons_prompt, pattern='^sm_buttons$'),
                CallbackQueryHandler(full_preview, pattern='^sm_preview$'),
                CallbackQueryHandler(bot_settings_dashboard, pattern='^bot_settings$'),
                CallbackQueryHandler(main_menu, pattern='^main_menu$')
            ],
            EDIT_MEDIA: [MessageHandler(filters.ALL, save_media)],
            EDIT_TEXT: [MessageHandler(filters.TEXT, save_text)],
            EDIT_BUTTONS: [MessageHandler(filters.TEXT, save_buttons)],
            BROADCAST_MENU: [
                CallbackQueryHandler(bot_settings_dashboard, pattern='^bot_settings$')
            ]
        },
        fallbacks=[CommandHandler('start', start)]
    )

    application.add_handler(conv_handler)
    
    print("Bot is running...")
    application.run_polling()
