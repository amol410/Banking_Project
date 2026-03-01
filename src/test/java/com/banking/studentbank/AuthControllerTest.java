package com.banking.studentbank;

import com.banking.studentbank.dto.AuthResponse;
import com.banking.studentbank.dto.LoginRequest;
import com.banking.studentbank.dto.RegisterRequest;
import com.banking.studentbank.model.Role;
import com.banking.studentbank.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = StudentBankApplication.class)
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private AuthResponse mockAuthResponse;

    @BeforeEach
    void setUp() {
        mockAuthResponse = AuthResponse.builder()
                .token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken")
                .username("testuser")
                .role("CUSTOMER")
                .build();
    }

    // ==================== POST /auth/register ====================

    @Test
    void register_ShouldReturn201_WhenRequestIsValid() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setRole(Role.CUSTOMER);

        when(authService.register(any(RegisterRequest.class))).thenReturn(mockAuthResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void register_ShouldReturn400_WhenUsernameIsBlank() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("");
        request.setPassword("password123");
        request.setEmail("test@example.com");
        request.setRole(Role.CUSTOMER);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    @Test
    void register_ShouldReturn400_WhenEmailIsInvalid() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setEmail("not-an-email");
        request.setRole(Role.CUSTOMER);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void register_ShouldReturn400_WhenUsernameAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser");
        request.setPassword("password123");
        request.setEmail("existing@example.com");
        request.setRole(Role.CUSTOMER);

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Username already exists: existinguser"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username already exists: existinguser"));
    }

    @Test
    void register_ShouldReturn201_WhenAdminRoleIsRequested() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("adminuser");
        request.setPassword("admin123");
        request.setEmail("admin@example.com");
        request.setRole(Role.ADMIN);

        AuthResponse adminResponse = AuthResponse.builder()
                .token("adminToken")
                .username("adminuser")
                .role("ADMIN")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(adminResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    // ==================== POST /auth/login ====================

    @Test
    void login_ShouldReturn200_WhenCredentialsAreValid() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        when(authService.login(any(LoginRequest.class))).thenReturn(mockAuthResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void login_ShouldReturn401_WhenPasswordIsWrong() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void login_ShouldReturn400_WhenUsernameIsBlank() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("");
        request.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists());
    }

    @Test
    void login_ShouldReturn400_WhenPasswordIsBlank() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void login_ShouldReturnTokenInResponse() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        when(authService.login(any(LoginRequest.class))).thenReturn(mockAuthResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken"));
    }
}
