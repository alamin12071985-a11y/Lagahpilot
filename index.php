<?php
// Aryanispe Bot Host Panel
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aryanispe Telegram Php Bot Host</title>
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
            max-width: 480px;
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
        
        /* File Info Display */
        .file-info {
            margin-top: 15px;
            padding: 15px;
            background: rgba(106, 17, 203, 0.05);
            border-radius: 12px;
            text-align: left;
            display: none;
            animation: fadeIn 0.5s ease;
            border-left: 3px solid #6a11cb;
        }
        
        .file-info.visible {
            display: block;
        }
        
        .file-info-title {
            font-weight: 600;
            color: #6a11cb;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .file-info-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .file-info-item {
            padding: 8px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .file-info-label {
            font-size: 0.8rem;
            color: #718096;
            margin-bottom: 4px;
        }
        
        .file-info-value {
            font-weight: 600;
            color: #2d3748;
            font-size: 0.9rem;
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
                transform: translateY(10px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        .card {
            animation: fadeIn 0.7s ease-out;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
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
            
            .file-info-content {
                grid-template-columns: 1fr;
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
                <h1>Aryanispe Telegram PHP Bot Host</h1>
                <p>Upload your PHP bot and get started in seconds</p>
            </div>
            
            <form class="upload-form" action="upload.php" method="POST" enctype="multipart/form-data">
                <div class="file-input-container">
                    <div class="file-input-wrapper">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Select your PHP bot file</span>
                        <small>Only .php files accepted (Max: 10MB)</small>
                        <input type="file" name="botfile" accept=".php" required id="fileInput">
                    </div>
                    
                    <!-- File Info Display -->
                    <div class="file-info" id="fileInfo">
                        <div class="file-info-title">
                            <i class="fas fa-file-code"></i>
                            Selected File Details
                        </div>
                        <div class="file-info-content">
                            <div class="file-info-item">
                                <div class="file-info-label">File Name</div>
                                <div class="file-info-value" id="fileName">-</div>
                            </div>
                            <div class="file-info-item">
                                <div class="file-info-label">File Size</div>
                                <div class="file-info-value" id="fileSize">-</div>
                            </div>
                            <div class="file-info-item">
                                <div class="file-info-label">File Type</div>
                                <div class="file-info-value" id="fileType">-</div>
                            </div>
                            <div class="file-info-item">
                                <div class="file-info-label">Last Modified</div>
                                <div class="file-info-value" id="fileModified">-</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button type="submit" class="upload-btn">
                    <i class="fas fa-upload"></i> Upload Bot
                </button>
            </form>
            
            <div class="features">
                <div class="feature">
                    <i class="fas fa-shield-alt"></i>
                    <span>Secure Telegram Bot Hosting</span>
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
        </div>
        
        <div class="footer">
            <p>Created with <i class="fas fa-heart" style="color: #ff375f;"></i> by Aryanispe</p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const fileInput = document.getElementById('fileInput');
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');
            const fileType = document.getElementById('fileType');
            const fileModified = document.getElementById('fileModified');
            
            fileInput.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    
                    // Display file information
                    fileName.textContent = file.name;
                    fileSize.textContent = formatFileSize(file.size);
                    fileType.textContent = file.type || 'PHP File';
                    
                    // Get last modified date
                    const lastModified = new Date(file.lastModified);
                    fileModified.textContent = lastModified.toLocaleDateString();
                    
                    // Show file info
                    fileInfo.classList.add('visible');
                } else {
                    // Hide file info if no file selected
                    fileInfo.classList.remove('visible');
                }
            });
            
            // Format file size to readable format
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            // Add some animation to the file input when file is selected
            fileInput.addEventListener('change', function() {
                const wrapper = this.parentElement;
                if (this.files.length > 0) {
                    wrapper.style.borderColor = '#6a11cb';
                    wrapper.style.background = 'rgba(106, 17, 203, 0.1)';
                    
                    // Add success animation
                    wrapper.animate([
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.02)' },
                        { transform: 'scale(1)' }
                    ], {
                        duration: 300,
                        iterations: 1
                    });
                }
            });
        });
    </script>
</body>
</html>