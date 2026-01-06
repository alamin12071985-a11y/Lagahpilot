<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webhook Setup - <?= $_SERVER['HTTP_HOST'] ?? 'Aryanispe Bot Host' ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            color: #2d3748;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.97);
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            padding: 40px 35px;
            width: 100%;
            max-width: 650px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(to right, #6a11cb, #2575fc);
        }
        
        .logo {
            margin-bottom: 25px;
            color: #6a11cb;
        }
        
        .logo i {
            font-size: 3.5rem;
            background: linear-gradient(135deg, #6a11cb, #2575fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        h1 {
            color: #2d3748;
            font-weight: 700;
            margin-bottom: 10px;
            font-size: 2rem;
        }
        
        .subtitle {
            color: #718096;
            margin-bottom: 30px;
            font-size: 1rem;
        }
        
        .status-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
            text-align: left;
            position: relative;
        }
        
        .success {
            border-left: 4px solid #4CAF50;
        }
        
        .error {
            border-left: 4px solid #F44336;
        }
        
        .info {
            border-left: 4px solid #2196F3;
        }
        
        .status-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .status-icon {
            font-size: 2rem;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .success .status-icon {
            color: #4CAF50;
        }
        
        .error .status-icon {
            color: #F44336;
        }
        
        .info .status-icon {
            color: #2196F3;
        }
        
        .status-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2d3748;
        }
        
        .status-content {
            color: #555;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .detail-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 3px solid #6a11cb;
        }
        
        .detail-label {
            font-size: 0.85rem;
            color: #718096;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .detail-value {
            font-weight: 600;
            color: #2d3748;
            word-break: break-all;
        }
        
        .json-response {
            background: #2d3748;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            text-align: left;
            overflow-x: auto;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 25px;
            border-radius: 50px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            gap: 8px;
            margin: 10px 5px;
        }
        
        .btn-primary {
            background: linear-gradient(to right, #6a11cb, #2575fc);
            color: white;
            box-shadow: 0 5px 15px rgba(106, 17, 203, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(106, 17, 203, 0.4);
        }
        
        .btn-secondary {
            background: #f8f9fa;
            color: #2d3748;
            border: 1px solid #e2e8f0;
        }
        
        .btn-secondary:hover {
            background: #e9ecef;
        }
        
        .instructions {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
            border-left: 4px solid #ffc107;
        }
        
        .instructions h3 {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .instructions ul {
            padding-left: 20px;
            margin: 10px 0;
        }
        
        .instructions li {
            margin-bottom: 8px;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 1.7rem;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
            }
            
            .status-card {
                padding: 20px;
            }
            
            .btn {
                width: 100%;
                margin: 5px 0;
            }
        }
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container fade-in">
        <div class="logo">
            <i class="fas fa-robot"></i>
        </div>
        
        <h1>Telegram Webhook Setup</h1>
        <p class="subtitle">Configuring your bot's webhook connection</p>
        
        <?php
        // Check if required parameters are present
        if(isset($_GET['token']) && isset($_GET['file'])){
            $token = trim($_GET['token']);
            $file = trim($_GET['file']);
            
            // Validate token format (basic validation)
            $isValidToken = preg_match('/^\d+:[\w-]+$/', $token);
            
            // Validate file path
            $isValidFile = preg_match('/^[a-zA-Z0-9_\/\-\.]+\.php$/', $file) && file_exists($file);
            
            if(!$isValidToken) {
                echo '
                <div class="status-card error">
                    <div class="status-header">
                        <i class="fas fa-exclamation-circle status-icon"></i>
                        <div class="status-title">Invalid Bot Token</div>
                    </div>
                    <div class="status-content">
                        The provided bot token format is invalid. Please check your token and try again.
                    </div>
                </div>';
            } elseif(!$isValidFile) {
                echo '
                <div class="status-card error">
                    <div class="status-header">
                        <i class="fas fa-file-exclamation status-icon"></i>
                        <div class="status-title">File Not Found</div>
                    </div>
                    <div class="status-content">
                        The specified bot file was not found. Please verify the file path and try again.
                    </div>
                </div>';
            } else {
                // Build webhook URL
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                $webhookUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/" . $file;
                $apiUrl = "https://api.telegram.org/bot$token/setWebhook?url=" . urlencode($webhookUrl);
                
                echo '
                <div class="status-card info">
                    <div class="status-header">
                        <i class="fas fa-cogs status-icon"></i>
                        <div class="status-title">Webhook Configuration</div>
                    </div>
                    <div class="status-content">
                        Setting up webhook for your Telegram bot. Please wait...
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-card">
                            <div class="detail-label">Bot Token</div>
                            <div class="detail-value">' . htmlspecialchars(substr($token, 0, 10) . '...' . substr($token, -10)) . '</div>
                        </div>
                        <div class="detail-card">
                            <div class="detail-label">Bot File</div>
                            <div class="detail-value">' . htmlspecialchars($file) . '</div>
                        </div>
                        <div class="detail-card">
                            <div class="detail-label">Webhook URL</div>
                            <div class="detail-value">' . htmlspecialchars($webhookUrl) . '</div>
                        </div>
                    </div>
                </div>';
                
                // Initialize cURL session
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $apiUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                
                // Execute cURL request
                $result = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curlError = curl_error($ch);
                curl_close($ch);
                
                // Process response
                if($result === false) {
                    echo '
                    <div class="status-card error">
                        <div class="status-header">
                            <i class="fas fa-unlink status-icon"></i>
                            <div class="status-title">Connection Failed</div>
                        </div>
                        <div class="status-content">
                            Could not connect to Telegram API. Error: ' . htmlspecialchars($curlError) . '
                        </div>
                    </div>';
                } else {
                    $response = json_decode($result, true);
                    
                    if($response['ok'] === true) {
                        echo '
                        <div class="status-card success">
                            <div class="status-header">
                                <i class="fas fa-check-circle status-icon"></i>
                                <div class="status-title">Webhook Setup Successful!</div>
                            </div>
                            <div class="status-content">
                                Your Telegram bot webhook has been configured successfully. Your bot should now receive updates.
                            </div>
                            
                            <div class="json-response">
                                <pre>' . json_encode($response, JSON_PRETTY_PRINT) . '</pre>
                            </div>
                        </div>';
                    } else {
                        echo '
                        <div class="status-card error">
                            <div class="status-header">
                                <i class="fas fa-times-circle status-icon"></i>
                                <div class="status-title">Webhook Setup Failed</div>
                            </div>
                            <div class="status-content">
                                Telegram API returned an error: ' . ($response['description'] ?? 'Unknown error') . '
                            </div>
                            
                            <div class="json-response">
                                <pre>' . json_encode($response, JSON_PRETTY_PRINT) . '</pre>
                            </div>
                        </div>';
                    }
                }
            }
        } else {
            echo '
            <div class="status-card error">
                <div class="status-header">
                    <i class="fas fa-exclamation-triangle status-icon"></i>
                    <div class="status-title">Missing Parameters</div>
                </div>
                <div class="status-content">
                    Required parameters are missing. Please provide both token and file parameters in the URL.
                </div>
            </div>';
        }
        ?>
        
        <div class="instructions">
            <h3><i class="fas fa-info-circle"></i> Usage Instructions</h3>
            <p>To set up your Telegram bot webhook, use the following URL format:</p>
            <div class="detail-card">
                <div class="detail-value">
    https://<?= $_SERVER['HTTP_HOST'] ?>/webhook.php?file=bots%2Fyour_bot_folder%2Fbot.php&token=YOUR_BOT_TOKEN
</div>
            </div>
            <ul>
                <li>Replace <strong>YOUR_BOT_TOKEN</strong> with your actual bot token from @BotFather</li>
                <li>Replace <strong>path/to/your/bot.php</strong> with the actual path to your bot file</li>
                <li>Make sure your bot file is accessible via the web</li>
            </ul>
        </div>
        
        <div>
            <a href="javascript:history.back()" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Go Back
            </a>
            <a href="/" class="btn btn-primary">
                <i class="fas fa-home"></i> Return to Home
            </a>
        </div>
    </div>
</body>
</html>