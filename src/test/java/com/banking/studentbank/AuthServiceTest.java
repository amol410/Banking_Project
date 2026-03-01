package com.banking.studentbank;

import com.banking.studentbank.dto.AuthResponse;
import com.banking.studentbank.dto.LoginRequest;
import com.banking.studentbank.dto.RegisterRequest;
import com.banking.studentbank.model.Role;
import com.banking.studentbank.model.User;
import com.banking.studentbank.repository.UserRepository;
import com.banking.studentbank.security.JwtUtil;
import com.banking.studentbank.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test@example.com");
        registerRequest.setRole(Role.CUSTOMER);

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        testUser = User.builder()
                .userId(1L)
                .username("testuser")
                .password("encodedPassword")
                .email("test@example.com")
                .role(Role.CUSTOMER)
                .build();
    }

    // ==================== register ====================

    @Test
    void register_ShouldReturnAuthResponse_WhenRequestIsValid() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtUtil.generateToken("testuser", "CUSTOMER")).thenReturn("mockJwtToken");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mockJwtToken");
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    void register_ShouldThrowIllegalArgumentException_WhenUsernameAlreadyExists() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_ShouldEncodePassword_BeforeSaving() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            assertThat(savedUser.getPassword()).isEqualTo("encodedPassword");
            assertThat(savedUser.getPassword()).isNotEqualTo("password123");
            return testUser;
        });
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("token");

        authService.register(registerRequest);

        verify(passwordEncoder, times(1)).encode("password123");
    }

    @Test
    void register_ShouldAssignCorrectRole() {
        registerRequest.setRole(Role.ADMIN);

        User adminUser = User.builder()
                .userId(2L)
                .username("admin")
                .password("encodedPass")
                .email("admin@example.com")
                .role(Role.ADMIN)
                .build();

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPass");
        when(userRepository.save(any(User.class))).thenReturn(adminUser);
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("adminToken");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response.getRole()).isEqualTo("ADMIN");
    }

    // ==================== login ====================

    @Test
    void login_ShouldReturnAuthResponse_WhenCredentialsAreValid() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken("testuser", "CUSTOMER")).thenReturn("mockJwtToken");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mockJwtToken");
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    void login_ShouldThrowBadCredentialsException_WhenPasswordIsWrong() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_ShouldCallAuthenticationManager() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("token");

        authService.login(loginRequest);

        verify(authenticationManager, times(1))
                .authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_ShouldGenerateTokenWithCorrectClaims() {
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken("testuser", "CUSTOMER")).thenReturn("tokenWithClaims");

        AuthResponse response = authService.login(loginRequest);

        verify(jwtUtil, times(1)).generateToken("testuser", "CUSTOMER");
        assertThat(response.getToken()).isEqualTo("tokenWithClaims");
    }
}
