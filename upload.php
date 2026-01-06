<?php
// Handle file upload
$uploadResult = '';
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['botfile'])) {
    $file = $_FILES['botfile'];
    $folder = "bots/".uniqid("bot_");
    mkdir($folder, 0777, true);
    $destination = $folder . "/bot.php";

    if(move_uploaded_file($file['tmp_name'], $destination)){
        $hookLink = "https://".$_SERVER['HTTP_HOST']."/webhook.php?file=".urlencode($destination)."&token=YOUR_BOT_TOKEN";
        $uploadResult = '
        <div class="result-container">
            <div class="success-animation">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <h2 class="result-title"><i class="fas fa-check-circle"></i> Bot Uploaded Successfully!</h2>
            <p class="result-text">File saved at: <b>'.$destination.'</b></p>
            <div class="webhook-info">
                <p class="webhook-guide"><i class="fas fa-link"></i> Use this link (replace YOUR_BOT_TOKEN with your bot token):</p>
                <div class="link-box">
                    <a href="'.$hookLink.'" target="_blank">'.$hookLink.'</a>
                </div>
                <button class="action-btn copy-btn" id="copyButton">
                    <i class="fas fa-copy"></i> Copy Link
                </button>
            </div>
            <button class="action-btn back-btn" onclick="window.location.href=\'index.php\'">
                <i class="fas fa-arrow-left"></i> Upload Another Bot
            </button>
        </div>';
    } else {
        $uploadResult = '
        <div class="result-container">
            <div class="error-animation">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h2 class="result-title"><i class="fas fa-times-circle"></i> Upload Failed!</h2>
            <p class="result-text">There was an error uploading your file. Please try again.</p>
            <button class="action-btn back-btn" onclick="window.location.href=\'index.php\'">
                <i class="fas fa-arrow-left"></i> Try Again
            </button>
        </div>';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aryanispe Php Bot Host</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Custom CSS Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Body Styles */
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: #2d3748;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            line-height: 1.6;
        }
        
        /* Main Container */
        .main-container {
            width: 100%;
            max-width: 520px;
            margin: 0 auto;
        }
        
        /* Card Style */
        .card {
            background: rgba(255, 255, 255, 0.97);
            border-radius: 18px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05);
            padding: 35px 30px;
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .card:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(to right, #6a11cb, #2575fc);
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }
        
        /* Logo Styles */
        .logo {
            margin-bottom: 20px;
            position: relative;
            display: inline-block;
        }
        
        .logo-icon {
            font-size: 2.8rem;
            color: #6a11cb;
            background: linear-gradient(135deg, #6a11cb, #2575fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
            padding: 15px;
            border-radius: 50%;
            background-color: rgba(106, 17, 203, 0.1);
            box-shadow: 0 5px 15px rgba(106, 17, 203, 0.2);
        }
        
        /* Header Styles */
        .header {
            margin-bottom: 25px;
        }
        
        .header h1 {
            color: #2d3748;
            font-weight: 700;
            font-size: 1.9rem;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .header p {
            color: #718096;
            font-size: 0.95rem;
            max-width: 320px;
            margin: 0 auto;
        }
        
        /* Form Styles */
        .upload-form {
            display: flex;
            flex-direction: column;
            gap: 22px;
        }
        
        .file-input-container {
            position: relative;
        }
        
        .file-input-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
            cursor: pointer;
            border: 2px dashed #cbd5e0;
            padding: 28px 25px;
            border-radius: 14px;
            transition: all 0.3s ease;
            background: rgba(106, 17, 203, 0.03);
            width: 100%;
        }
        
        .file-input-wrapper:hover {
            background: rgba(106, 17, 203, 0.07);
            border-color: #6a11cb;
        }
        
        .file-input-wrapper i {
            font-size: 2.7rem;
            color: #6a11cb;
            margin-bottom: 12px;
            display: block;
            transition: all 0.3s ease;
        }
        
        .file-input-wrapper:hover i {
            transform: scale(1.1);
        }
        
        .file-input-wrapper span {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #4a5568;
            font-size: 1.05rem;
        }
        
        .file-input-wrapper small {
            color: #718096;
            font-size: 0.85rem;
        }
        
        .file-input-wrapper input[type=file] {
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        /* Button Styles */
        .upload-btn {
            background: linear-gradient(to right, #6a11cb, #2575fc);
            color: white;
            border: none;
            padding: 16px 28px;
            font-size: 1.05rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 0 auto;
            width: 100%;
            box-shadow: 0 5px 15px rgba(106, 17, 203, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .upload-btn:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: 0.5s;
        }
        
        .upload-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(106, 17, 203, 0.4);
        }
        
        .upload-btn:hover:before {
            left: 100%;
        }
        
        .upload-btn:active {
            transform: translateY(1px);
        }
        
        /* Result Container Styles */
        .result-container {
            padding: 15px 0;
        }
        
        .success-animation, .error-animation {
            margin: 0 auto 20px;
            width: 80px;
            height: 80px;
        }
        
        .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: block;
            stroke-width: 5;
            stroke: #4CAF50;
            stroke-miterlimit: 10;
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        
        .checkmark__circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 5;
            stroke-miterlimit: 10;
            stroke: #4CAF50;
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        
        .checkmark__check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        .error-animation i {
            font-size: 80px;
            color: #f44336;
            animation: pulse 1s infinite;
        }
        
        .result-title {
            color: #2d3748;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .result-title i {
            margin-right: 8px;
        }
        
        .result-text {
            color: #4a5568;
            margin-bottom: 20px;
        }
        
        .webhook-info {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            text-align: left;
        }
        
        .webhook-guide {
            color: #4a5568;
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .webhook-guide i {
            margin-right: 8px;
            color: #6a11cb;
        }
        
        .link-box {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 15px;
            margin: 15px 0;
            word-break: break-all;
            font-family: monospace;
            font-size: 0.9rem;
        }
        
        .link-box a {
            color: #6a11cb;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .link-box a:hover {
            color: #2575fc;
            text-decoration: underline;
        }
        
        .action-btn {
            background: linear-gradient(to right, #6a11cb, #2575fc);
            color: white;
            border: none;
            padding: 12px 20px;
            font-size: 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin: 8px 5px;
            box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(106, 17, 203, 0.4);
        }
        
        /* Notification Styles */
        .copy-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: Poppins, sans-serif;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: fadeInOut 2.5s forwards;
        }
        
        /* Features Section */
        .features {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .feature {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            min-width: 110px;
            text-align: center;
            padding: 15px 10px;
            border-radius: 12px;
            background: rgba(106, 17, 203, 0.05);
            transition: all 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-3px);
            background: rgba(106, 17, 203, 0.1);
            box-shadow: 0 5px 15px rgba(106, 17, 203, 0.1);
        }
        
        .feature i {
            font-size: 1.9rem;
            color: #6a11cb;
            margin-bottom: 10px;
        }
        
        .feature span {
            font-size: 0.85rem;
            color: #4a5568;
            font-weight: 500;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.85rem;
            text-align: center;
        }
        
        .footer a {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .footer a:hover {
            color: white;
            text-decoration: underline;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { 
                opacity: 0; 
                transform: translateY(20px) scale(0.95); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
            }
        }
        
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes stroke {
            100% { stroke-dashoffset: 0; }
        }
        
        @keyframes scale {
            0%, 100% { transform: none; }
            50% { transform: scale3d(1.1, 1.1, 1); }
        }
        
        @keyframes fill {
            100% { box-shadow: 0 0 0 30px rgba(76, 175, 80, 0) inset; }
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
            .card {
                padding: 28px 22px;
                border-radius: 16px;
            }
            
            .header h1 {
                font-size: 1.7rem;
            }
            
            .file-input-wrapper {
                padding: 24px 20px;
            }
            
            .features {
                flex-direction: column;
                align-items: center;
                gap: 18px;
            }
            
            .feature {
                width: 100%;
                max-width: 220px;
                flex-direction: row;
                justify-content: flex-start;
                text-align: left;
                padding: 15px 20px;
                gap: 15px;
            }
            
            .feature i {
                margin-bottom: 0;
                font-size: 1.7rem;
            }
            
            .webhook-info {
                padding: 15px;
            }
            
            .link-box {
                padding: 10px;
                font-size: 0.8rem;
            }
            
            .copy-notification {
                right: 10px;
                left: 10px;
                text-align: center;
            }
        }
        
        @media (max-width: 400px) {
            .card {
                padding: 24px 18px;
            }
            
            .header h1 {
                font-size: 1.5rem;
            }
            
            .file-input-wrapper span {
                font-size: 1rem;
            }
            
            .action-btn {
                width: 100%;
                margin: 8px 0;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="card">
            <div class="logo">
                <i class="fas fa-robot logo-icon"></i>
            </div>
            
            <div class="header">
                <h1>Aryanispe PHP Bot Host</h1>
                <p>Upload your PHP bot and get started in seconds</p>
            </div>
            
            <?php if(empty($uploadResult)): ?>
            <form class="upload-form" action="upload.php" method="POST" enctype="multipart/form-data">
                <div class="file-input-container">
                    <div class="file-input-wrapper">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Select your PHP bot file</span>
                        <small>Only .php files accepted</small>
                        <input type="file" name="botfile" accept=".php" required>
                    </div>
                </div>
                
                <button type="submit" class="upload-btn">
                    <i class="fas fa-upload"></i> Upload Bot
                </button>
            </form>
            
            <div class="features">
                <div class="feature">
                    <i class="fas fa-shield-alt"></i>
                    <span>Secure Hosting</span>
                </div>
                <div class="feature">
                    <i class="fas fa-bolt"></i>
                    <span>Fast Processing</span>
                </div>
                <div class="feature">
                    <i class="fas fa-server"></i>
                    <span>Reliable Uptime</span>
                </div>
            </div>
            <?php else: ?>
                <?php echo $uploadResult; ?>
            <?php endif; ?>
        </div>
        
        <div class="footer">
            <p>Created with <i class="fas fa-heart" style="color: #ff375f;"></i> by Aryanispe</p>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Check if we're on the result page with a copy button
            const copyButton = document.getElementById('copyButton');
            if (copyButton) {
                copyButton.addEventListener('click', function() {
                    // Get the link text from the link box
                    const linkBox = document.querySelector('.link-box a');
                    const textToCopy = linkBox ? linkBox.href : '';
                    
                    if (textToCopy) {
                        copyToClipboard(textToCopy);
                    }
                });
            }
        });
        
        function copyToClipboard(text) {
            // Use the modern Clipboard API
            navigator.clipboard.writeText(text).then(function() {
                showNotification('Webhook link copied to clipboard!');
            }).catch(function(err) {
                // Fallback for older browsers
                fallbackCopyToClipboard(text);
            });
        }
        
        function fallbackCopyToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.removeChild(textArea);
        }
        
        function showNotification(message, type = 'success') {
            // Remove any existing notifications
            const existingNotifications = document.querySelectorAll('.copy-notification');
            existingNotifications.forEach(notification => notification.remove());
            
            // Create new notification
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
            
            notification.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                ${message}
            `;
            
            document.body.appendChild(notification);
            
            // Remove notification after animation completes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 2500);
        }
    </script>
</body>
</html>