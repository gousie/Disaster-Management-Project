package com.klu.controller;

import com.klu.entity.Fund;
import com.klu.repository.FundRepository;
import com.klu.service.EmailService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/funds")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class FundController {

    private final FundRepository fundRepo;
    private final EmailService emailService;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    public FundController(FundRepository fundRepo, EmailService emailService) {
        this.fundRepo = fundRepo;
        this.emailService = emailService;
    }

    /** Admin: list all funds */
    @GetMapping
    public List<Fund> getAll() {
        return fundRepo.findAllByOrderByCreatedAtDesc();
    }

    /** User: list funds by email */
    @GetMapping("/my/{email}")
    public List<Fund> getMy(@PathVariable String email) {
        return fundRepo.findByDonorEmailOrderByCreatedAtDesc(email);
    }

    /**
     * Create Razorpay order.
     * Body: { name, email, mobile, amount, userId? }
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            String name = str(body.get("name"));
            String email = str(body.get("email"));
            String mobile = str(body.get("mobile"));
            double amount = Double.parseDouble(String.valueOf(body.get("amount")));
            Long userId = null;
            if (body.get("userId") != null) {
                userId = Long.parseLong(String.valueOf(body.get("userId")));
            }

            if (name.isBlank() || email.isBlank() || mobile.isBlank() || amount < 1) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "name, email, mobile and amount (>=1) are required"
                ));
            }

            // Amount in paise for Razorpay
            int amountPaise = (int) Math.round(amount * 100);

            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", "INR");
            options.put("receipt", "rcpt_" + System.currentTimeMillis());
            options.put("payment_capture", 1);

            Order order = client.orders.create(options);
            String orderId = order.get("id");

            Fund fund = new Fund();
            fund.setDonorName(name);
            fund.setDonorEmail(email);
            fund.setDonorMobile(mobile);
            fund.setAmount(amount);
            fund.setCurrency("INR");
            fund.setRazorpayOrderId(orderId);
            fund.setStatus("CREATED");
            fund.setUserId(userId);
            fundRepo.save(fund);

            return ResponseEntity.ok(Map.of(
                    "orderId", orderId,
                    "amount", amountPaise,
                    "currency", "INR",
                    "key", keyId,
                    "fundId", fund.getId(),
                    "name", name,
                    "email", email,
                    "mobile", mobile
            ));
        } catch (RazorpayException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verify payment after Razorpay checkout success.
     * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        try {
            String orderId = body.get("razorpay_order_id");
            String paymentId = body.get("razorpay_payment_id");
            String signature = body.get("razorpay_signature");

            if (orderId == null || paymentId == null || signature == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing payment fields"));
            }

            String payload = orderId + "|" + paymentId;
            String expected = hmacSha256(payload, keySecret);

            if (!expected.equals(signature)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment signature"));
            }

            Fund fund = fundRepo.findByRazorpayOrderId(orderId).orElse(null);
            if (fund == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order not found"));
            }

            fund.setRazorpayPaymentId(paymentId);
            fund.setRazorpaySignature(signature);
            fund.setStatus("PAID");
            fund.setPaidAt(LocalDateTime.now());
            fundRepo.save(fund);

            // Send confirmation email
            emailService.sendPaymentSuccess(
                    fund.getDonorEmail(),
                    fund.getDonorName(),
                    fund.getAmount(),
                    paymentId
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment verified successfully",
                    "fund", fund
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }

    private static String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
