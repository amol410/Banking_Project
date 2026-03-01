package com.banking.studentbank.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Each IP gets 60 requests per minute
    private static final int CAPACITY = 60;
    private static final Duration REFILL_DURATION = Duration.ofMinutes(1);

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket getBucket(String ipAddress) {
        return buckets.computeIfAbsent(ipAddress, ip ->
            Bucket.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(CAPACITY)
                    .refillGreedy(CAPACITY, REFILL_DURATION)
                    .build())
                .build()
        );
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String ipAddress = getClientIp(request);
        Bucket bucket = getBucket(ipAddress);

        if (bucket.tryConsume(1)) {
            // Add rate limit headers
            response.addHeader("X-Rate-Limit-Limit", String.valueOf(CAPACITY));
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"status\":429,\"message\":\"Too many requests. Limit: " + CAPACITY + " requests per minute.\"}"
            );
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
