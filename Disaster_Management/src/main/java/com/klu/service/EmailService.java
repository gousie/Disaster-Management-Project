package com.klu.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String from;

    @Value("${app.mail.from-name:DISASTRA}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPaymentSuccess(
            String toEmail,
            String donorName,
            double amount,
            String paymentId) {

        if (toEmail == null || toEmail.isBlank()) return;

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            if (from != null && !from.isBlank()) {
                msg.setFrom(from);
            }
            msg.setTo(toEmail.trim());
            msg.setSubject("DISASTRA – Payment Successful");
            msg.setText(
                "Dear " + (donorName != null ? donorName : "Donor") + ",\n\n" +
                "Thank you for your contribution to disaster relief.\n\n" +
                "Amount paid : ₹" + String.format("%.2f", amount) + "\n" +
                "Payment ID  : " + (paymentId != null ? paymentId : "N/A") + "\n\n" +
                "Your support helps communities recover faster.\n\n" +
                "Regards,\nDISASTRA Team"
            );
            mailSender.send(msg);
        } catch (Exception e) {
            // Log but do not fail the payment flow
            System.err.println("Failed to send payment email: " + e.getMessage());
        }
    }
}
