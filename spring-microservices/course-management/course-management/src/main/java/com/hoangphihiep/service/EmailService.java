package com.hoangphihiep.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${app.email.from:noreply@yourdomain.com}")
    private String fromEmail;

    @Value("${app.email.from-name:Education Management System}")
    private String fromName;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    @Async
    public CompletableFuture<Boolean> sendAccountCredentialsAsync(String toEmail, String firstName, String lastName,
                                                                  String username, String password, String accountType) {
        try {
            sendAccountCredentials(toEmail, firstName, lastName, username, password, accountType);
            return CompletableFuture.completedFuture(true);
        } catch (Exception e) {
            log.error("Async email sending failed for {}: {}", toEmail, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }

    public void sendAccountCredentials(String toEmail, String firstName, String lastName,
                                       String username, String password, String accountType) {
        try {
            validateEmailInputs(toEmail, firstName, lastName, username, password, accountType);

            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Chào mừng! Thông tin tài khoản " + accountType + " của bạn";

            String htmlContent = buildAccountCredentialsEmail(firstName, lastName, username, password, accountType);
            Content content = new Content("text/html", htmlContent);

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            log.info("Email sent successfully to {}. Status: {}", toEmail, response.getStatusCode());

            if (response.getStatusCode() >= 400) {
                log.error("SendGrid error response: {}", response.getBody());
                throw new RuntimeException("SendGrid returned error status: " + response.getStatusCode());
            }

        } catch (IOException ex) {
            log.error("IO error sending email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send account credentials email due to IO error", ex);
        } catch (Exception e) {
            log.error("Unexpected error while preparing email for {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to prepare account credentials email", e);
        }
    }

    private void validateEmailInputs(String toEmail, String firstName, String lastName,
                                     String username, String password, String accountType) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address cannot be null or empty");
        }
        if (firstName == null || firstName.trim().isEmpty()) {
            throw new IllegalArgumentException("First name cannot be null or empty");
        }
        if (lastName == null || lastName.trim().isEmpty()) {
            throw new IllegalArgumentException("Last name cannot be null or empty");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be null or empty");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        if (accountType == null || accountType.trim().isEmpty()) {
            throw new IllegalArgumentException("Account type cannot be null or empty");
        }
    }

    private String buildAccountCredentialsEmail(String firstName, String lastName,
                                                String username, String password, String accountType) {
        String loginUrl = frontendUrl + "/login";
        String accountTypeVi = accountType.equals("Teacher") ? "Giảng viên" : "Sinh viên";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Thông tin tài khoản</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 0; 
                        background-color: #f4f4f4; 
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 20px; 
                        background-color: #ffffff; 
                        box-shadow: 0 0 10px rgba(0,0,0,0.1); 
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 24px; 
                        font-weight: 600; 
                    }
                    .content { 
                        background: #f8f9fa; 
                        padding: 30px; 
                        border-radius: 0 0 10px 10px; 
                    }
                    .credentials-box { 
                        background: white; 
                        border: 2px solid #e9ecef; 
                        border-radius: 8px; 
                        padding: 20px; 
                        margin: 20px 0; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                    }
                    .credential-item { 
                        margin: 15px 0; 
                    }
                    .credential-label { 
                        font-weight: bold; 
                        color: #495057; 
                        font-size: 14px; 
                        text-transform: uppercase; 
                        letter-spacing: 0.5px; 
                    }
                    .credential-value { 
                        background: #f8f9fa; 
                        padding: 12px 15px; 
                        border-radius: 6px; 
                        font-family: 'Courier New', monospace; 
                        margin-top: 5px; 
                        border-left: 4px solid #007bff; 
                        font-size: 16px; 
                        font-weight: 600; 
                        color: #2c3e50; 
                    }
                    .warning { 
                        background: #fff3cd; 
                        border: 1px solid #ffeaa7; 
                        color: #856404; 
                        padding: 15px; 
                        border-radius: 5px; 
                        margin: 20px 0; 
                    }
                    .warning strong { 
                        display: block; 
                        margin-bottom: 10px; 
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        color: #6c757d; 
                        font-size: 14px; 
                        padding-top: 20px; 
                        border-top: 1px solid #dee2e6; 
                    }
                    .btn { 
                        display: inline-block; 
                        background: #007bff; 
                        color: white !important; 
                        text-decoration: none; 
                        padding: 14px 28px; 
                        border-radius: 6px; 
                        margin: 15px 0; 
                        font-weight: 600; 
                        transition: background-color 0.3s; 
                    }
                    .btn:hover { 
                        background: #0056b3; 
                    }
                    .steps { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 8px; 
                        margin: 20px 0; 
                    }
                    .steps ol { 
                        margin: 0; 
                        padding-left: 20px; 
                    }
                    .steps li { 
                        margin: 8px 0; 
                        line-height: 1.6; 
                    }
                    @media (max-width: 600px) {
                        .container { 
                            margin: 10px; 
                            padding: 10px; 
                        }
                        .header, .content { 
                            padding: 20px; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Chào mừng đến với Hệ thống Quản lý Giáo dục!</h1>
                        <p>Tài khoản %s của bạn đã được tạo thành công</p>
                    </div>
                    
                    <div class="content">
                        <h2>Xin chào %s %s,</h2>
                        <p>Chào mừng bạn! Tài khoản %s của bạn đã được tạo thành công trong Hệ thống Quản lý Giáo dục. 
                        Dưới đây là thông tin đăng nhập của bạn:</p>
                        
                        <div class="credentials-box">
                            <h3>📧 Thông tin đăng nhập của bạn</h3>
                            
                            <div class="credential-item">
                                <div class="credential-label">Tên đăng nhập:</div>
                                <div class="credential-value">%s</div>
                            </div>
                            
                            <div class="credential-item">
                                <div class="credential-label">Mật khẩu:</div>
                                <div class="credential-value">%s</div>
                            </div>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Lưu ý bảo mật:</strong>
                            • Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên<br>
                            • Giữ thông tin đăng nhập an toàn và không chia sẻ với người khác<br>
                            • Nhớ đăng xuất khi sử dụng máy tính chung<br>
                            • Liên hệ quản trị viên nếu có vấn đề bảo mật
                        </div>
                        
                        <div class="steps">
                            <p><strong>Các bước tiếp theo:</strong></p>
                            <ol>
                                <li>Nhấp vào nút đăng nhập bên dưới hoặc truy cập trang đăng nhập</li>
                                <li>Sử dụng tên đăng nhập và mật khẩu để đăng nhập</li>
                                <li>Đổi mật khẩu trong cài đặt hồ sơ cá nhân</li>
                                <li>Hoàn thiện thông tin hồ sơ của bạn</li>
                                <li>Khám phá các tính năng của hệ thống</li>
                            </ol>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="%s" class="btn">🚀 Đăng nhập vào tài khoản</a>
                        </div>
                        
                        <p>Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
                        
                        <p>Trân trọng,<br>
                        <strong>Đội ngũ Hệ thống Quản lý Giáo dục</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>Đây là email tự động. Vui lòng không trả lời email này.</p>
                        <p>© 2024 Hệ thống Quản lý Giáo dục. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(accountTypeVi, firstName, lastName, accountTypeVi, username, password, frontendUrl + "/login");
    }

    @Async
    public CompletableFuture<Boolean> sendPasswordResetEmailAsync(String toEmail, String firstName, String resetToken) {
        try {
            sendPasswordResetEmail(toEmail, firstName, resetToken);
            return CompletableFuture.completedFuture(true);
        } catch (Exception e) {
            log.error("Async password reset email sending failed for {}: {}", toEmail, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String firstName, String resetToken) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Yêu cầu đặt lại mật khẩu";

            String htmlContent = buildPasswordResetEmail(firstName, resetToken);
            Content content = new Content("text/html", htmlContent);

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            log.info("Password reset email sent to {}. Status: {}", toEmail, response.getStatusCode());

            if (response.getStatusCode() >= 400) {
                log.error("SendGrid error response: {}", response.getBody());
                throw new RuntimeException("SendGrid returned error status: " + response.getStatusCode());
            }

        } catch (IOException ex) {
            log.error("Error sending password reset email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send password reset email", ex);
        } catch (Exception e) {
            log.error("Unexpected error while preparing password reset email for {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to prepare password reset email", e);
        }
    }

    private String buildPasswordResetEmail(String firstName, String resetToken) {
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Đặt lại mật khẩu</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff7b7b 0%%, #667eea 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .btn { display: inline-block; background: #dc3545; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; margin: 15px 0; }
                    .warning { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Yêu cầu đặt lại mật khẩu</h1>
                    </div>
                    
                    <div class="content">
                        <h2>Xin chào %s,</h2>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn đã thực hiện yêu cầu này, 
                        vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                        
                        <div style="text-align: center;">
                            <a href="%s" class="btn">Đặt lại mật khẩu</a>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Lưu ý bảo mật:</strong><br>
                            • Liên kết này sẽ hết hạn trong 24 giờ<br>
                            • Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này<br>
                            • Để bảo mật, liên kết này chỉ có thể sử dụng một lần duy nhất
                        </div>
                        
                        <p>Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết này vào trình duyệt:</p>
                        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">%s</p>
                        
                        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ nếu có thắc mắc.</p>
                        
                        <p>Trân trọng,<br>
                        <strong>Đội ngũ Hệ thống Quản lý Giáo dục</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>Đây là email tự động. Vui lòng không trả lời email này.</p>
                        <p>© 2024 Hệ thống Quản lý Giáo dục. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(firstName, resetUrl, resetUrl);
    }

    /**
     * Sends OTP email asynchronously
     */
    @Async
    public CompletableFuture<Boolean> sendOtpEmailAsync(String toEmail, String otpCode) {
        try {
            System.out.println ("Có vào đây 999");
            sendOtpEmail(toEmail, otpCode);

            return CompletableFuture.completedFuture(true);
        } catch (Exception e) {
            log.error("Async OTP email sending failed for {}: {}", toEmail, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * Sends OTP verification email
     */
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            validateOtpInputs(toEmail, otpCode);

            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Mã xác thực OTP - Hệ thống Quản lý Giáo dục";

            String htmlContent = buildOtpEmail(otpCode);
            Content content = new Content("text/html", htmlContent);

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            log.info("OTP email sent successfully to {}. Status: {}", toEmail, response.getStatusCode());

            if (response.getStatusCode() >= 400) {
                log.error("SendGrid error response: {}", response.getBody());
                throw new RuntimeException("SendGrid returned error status: " + response.getStatusCode());
            }

        } catch (IOException ex) {
            log.error("IO error sending OTP email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send OTP email due to IO error", ex);
        } catch (Exception e) {
            log.error("Unexpected error while preparing OTP email for {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to prepare OTP email", e);
        }
    }

    private void validateOtpInputs(String toEmail, String otpCode) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address cannot be null or empty");
        }
        if (otpCode == null || otpCode.trim().isEmpty()) {
            throw new IllegalArgumentException("OTP code cannot be null or empty");
        }
    }

    private String buildOtpEmail(String otpCode) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Mã xác thực OTP</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 0; 
                        background-color: #f4f4f4; 
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 20px; 
                        background-color: #ffffff; 
                        box-shadow: 0 0 10px rgba(0,0,0,0.1); 
                    }
                    .header { 
                        background: linear-gradient(135deg, #28a745 0%%, #20c997 100%%); 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 24px; 
                        font-weight: 600; 
                    }
                    .content { 
                        background: #f8f9fa; 
                        padding: 30px; 
                        border-radius: 0 0 10px 10px; 
                    }
                    .otp-box { 
                        background: white; 
                        border: 3px solid #28a745; 
                        border-radius: 12px; 
                        padding: 30px; 
                        margin: 25px 0; 
                        text-align: center; 
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                    }
                    .otp-code { 
                        font-size: 36px; 
                        font-weight: bold; 
                        color: #28a745; 
                        letter-spacing: 8px; 
                        font-family: 'Courier New', monospace; 
                        background: #f8f9fa; 
                        padding: 20px; 
                        border-radius: 8px; 
                        border: 2px dashed #28a745; 
                        margin: 15px 0; 
                    }
                    .warning { 
                        background: #fff3cd; 
                        border: 1px solid #ffeaa7; 
                        color: #856404; 
                        padding: 15px; 
                        border-radius: 5px; 
                        margin: 20px 0; 
                    }
                    .warning strong { 
                        display: block; 
                        margin-bottom: 10px; 
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        color: #6c757d; 
                        font-size: 14px; 
                        padding-top: 20px; 
                        border-top: 1px solid #dee2e6; 
                    }
                    .steps { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 8px; 
                        margin: 20px 0; 
                    }
                    .steps ol { 
                        margin: 0; 
                        padding-left: 20px; 
                    }
                    .steps li { 
                        margin: 8px 0; 
                        line-height: 1.6; 
                    }
                    @media (max-width: 600px) {
                        .container { 
                            margin: 10px; 
                            padding: 10px; 
                        }
                        .header, .content { 
                            padding: 20px; 
                        }
                        .otp-code { 
                            font-size: 28px; 
                            letter-spacing: 4px; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Mã xác thực OTP</h1>
                        <p>Xác thực danh tính của bạn</p>
                    </div>
                    
                    <div class="content">
                        <h2>Mã xác thực của bạn</h2>
                        <p>Chúng tôi đã nhận được yêu cầu xác thực từ tài khoản của bạn. 
                        Vui lòng sử dụng mã OTP bên dưới để hoàn tất quá trình xác thực:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; font-size: 16px; color: #666;">Mã xác thực OTP của bạn:</p>
                            <div class="otp-code">%s</div>
                            <p style="margin: 0; font-size: 14px; color: #666;">Nhập mã này vào ứng dụng để tiếp tục</p>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Lưu ý quan trọng:</strong>
                            • Mã OTP này có hiệu lực trong 5 phút<br>
                            • Không chia sẻ mã này với bất kỳ ai<br>
                            • Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email<br>
                            • Mã chỉ có thể sử dụng một lần duy nhất
                        </div>
                        
                        <div class="steps">
                            <p><strong>Cách sử dụng mã OTP:</strong></p>
                            <ol>
                                <li>Quay lại ứng dụng hoặc trang web</li>
                                <li>Nhập mã OTP: <strong>%s</strong></li>
                                <li>Nhấn xác nhận để hoàn tất</li>
                            </ol>
                        </div>
                        
                        <p>Nếu bạn gặp khó khăn hoặc cần hỗ trợ, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
                        
                        <p>Trân trọng,<br>
                        <strong>Đội ngũ Hệ thống Quản lý Giáo dục</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>Đây là email tự động. Vui lòng không trả lời email này.</p>
                        <p>© 2024 Hệ thống Quản lý Giáo dục. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(otpCode, otpCode);
    }
}
