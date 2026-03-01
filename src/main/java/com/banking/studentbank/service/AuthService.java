package com.banking.studentbank.service;

import com.banking.studentbank.dto.AuthResponse;
import com.banking.studentbank.dto.LoginRequest;
import com.banking.studentbank.dto.RefreshTokenRequest;
import com.banking.studentbank.dto.RegisterRequest;
import com.banking.studentbank.model.AuditStatus;
import com.banking.studentbank.model.RefreshToken;
import com.banking.studentbank.model.User;
import com.banking.studentbank.repository.UserRepository;
import com.banking.studentbank.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .role(request.getRole())
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());

        // Audit log
        auditLogService.log(user.getUsername(), "REGISTER",
                "New user registered with role: " + user.getRole(), "N/A", AuditStatus.SUCCESS);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        // Audit log
        auditLogService.log(user.getUsername(), "LOGIN",
                "User logged in successfully", "N/A", AuditStatus.SUCCESS);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
        User user = refreshToken.getUser();

        String newToken = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        auditLogService.log(user.getUsername(), "TOKEN_REFRESH",
                "Access token refreshed", "N/A", AuditStatus.SUCCESS);

        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken.getToken())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public String logout(String username) {
        refreshTokenService.deleteByUsername(username);
        auditLogService.log(username, "LOGOUT", "User logged out", "N/A", AuditStatus.SUCCESS);
        return "Logged out successfully";
    }
}
