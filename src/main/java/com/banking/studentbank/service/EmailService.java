package com.banking.studentbank.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:noreply@bank.com}")
    private String fromEmail;

    public void sendDepositNotification(String toEmail, String accountNumber, BigDecimal amount, BigDecimal balance) {
        String subject = "Deposit Successful - " + accountNumber;
        String body = String.format(
            "Dear Customer,\n\nAmount of Rs. %.2f has been credited to your account %s.\nAvailable Balance: Rs. %.2f\n\nThank you for banking with us.",
            amount, accountNumber, balance);
        sendEmail(toEmail, subject, body);
    }

    public void sendWithdrawNotification(String toEmail, String accountNumber, BigDecimal amount, BigDecimal balance) {
        String subject = "Withdrawal Successful - " + accountNumber;
        String body = String.format(
            "Dear Customer,\n\nAmount of Rs. %.2f has been debited from your account %s.\nAvailable Balance: Rs. %.2f\n\nThank you for banking with us.",
            amount, accountNumber, balance);
        sendEmail(toEmail, subject, body);
    }

    public void sendTransferNotification(String toEmail, String fromAccount, String toAccount, BigDecimal amount) {
        String subject = "Transfer Successful - " + fromAccount;
        String body = String.format(
            "Dear Customer,\n\nAmount of Rs. %.2f has been transferred from account %s to account %s.\n\nThank you for banking with us.",
            amount, fromAccount, toAccount);
        sendEmail(toEmail, subject, body);
    }

    public void sendWelcomeEmail(String toEmail, String username) {
        String subject = "Welcome to Student Bank!";
        String body = String.format(
            "Dear %s,\n\nWelcome to Student Bank! Your account has been created successfully.\n\nThank you for choosing us.",
            username);
        sendEmail(toEmail, subject, body);
    }

    public void sendInterestCreditNotification(String toEmail, String accountNumber, BigDecimal interest, BigDecimal balance) {
        String subject = "Monthly Interest Credited - " + accountNumber;
        String body = String.format(
            "Dear Customer,\n\nMonthly interest of Rs. %.2f has been credited to your account %s.\nNew Balance: Rs. %.2f\n\nThank you for banking with us.",
            interest, accountNumber, balance);
        sendEmail(toEmail, subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Email disabled. Would have sent to: {} | Subject: {}", to, subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
