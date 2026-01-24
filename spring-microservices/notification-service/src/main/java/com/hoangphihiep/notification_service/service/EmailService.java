package com.hoangphihiep.notification_service.service;

import com.hoangphihiep.notification_service.dto.EmailRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Async
    public void sendEmail(EmailRequest request) {
        log.info("Sending email to: {}", request.getTo());
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject());
            helper.setText(request.getContent(), request.isHtml());

            javaMailSender.send(message);
            log.info("Email sent successfully to: {}", request.getTo());
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}", request.getTo(), e);
        }
    }
}
