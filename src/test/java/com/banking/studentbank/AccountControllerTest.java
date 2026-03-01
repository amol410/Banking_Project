package com.banking.studentbank;

import com.banking.studentbank.dto.*;
import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.exception.InsufficientFundsException;
import com.banking.studentbank.model.AccountStatus;
import com.banking.studentbank.model.AccountType;
import com.banking.studentbank.model.TransactionType;
import com.banking.studentbank.service.AccountService;
import com.banking.studentbank.service.TransactionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = StudentBankApplication.class)
@AutoConfigureMockMvc
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AccountService accountService;

    @MockBean
    private TransactionService transactionService;

    private AccountResponse testAccountResponse;

    @BeforeEach
    void setUp() {
        testAccountResponse = AccountResponse.builder()
                .accountId(1L)
                .accountNumber("ACC12345678")
                .accountHolderName("John Doe")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("1000.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ==================== POST /api/accounts ====================

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void createAccount_ShouldReturn201_WhenRequestIsValid() throws Exception {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setAccountHolderName("John Doe");
        request.setAccountType(AccountType.SAVINGS);

        when(accountService.createAccount(any(CreateAccountRequest.class))).thenReturn(testAccountResponse);

        mockMvc.perform(post("/api/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accountHolderName").value("John Doe"))
                .andExpect(jsonPath("$.accountType").value("SAVINGS"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void createAccount_ShouldReturn400_WhenNameIsBlank() throws Exception {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setAccountHolderName("");
        request.setAccountType(AccountType.SAVINGS);

        mockMvc.perform(post("/api/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAccount_ShouldReturn403_WhenNotAuthenticated() throws Exception {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setAccountHolderName("John Doe");
        request.setAccountType(AccountType.SAVINGS);

        mockMvc.perform(post("/api/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ==================== GET /api/accounts/{id} ====================

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getAccount_ShouldReturn200_WhenAccountExists() throws Exception {
        when(accountService.getAccount(1L)).thenReturn(testAccountResponse);

        mockMvc.perform(get("/api/accounts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountId").value(1))
                .andExpect(jsonPath("$.accountNumber").value("ACC12345678"))
                .andExpect(jsonPath("$.balance").value(1000.00));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getAccount_ShouldReturn404_WhenAccountDoesNotExist() throws Exception {
        when(accountService.getAccount(99L)).thenThrow(new AccountNotFoundException(99L));

        mockMvc.perform(get("/api/accounts/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    // ==================== GET /api/accounts ====================

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllAccounts_ShouldReturn200_WithListOfAccounts() throws Exception {
        AccountResponse account2 = AccountResponse.builder()
                .accountId(2L)
                .accountNumber("ACC87654321")
                .accountHolderName("Jane Smith")
                .accountType(AccountType.CURRENT)
                .balance(new BigDecimal("500.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        List<AccountResponse> accounts = Arrays.asList(testAccountResponse, account2);
        when(accountService.getAllAccounts()).thenReturn(accounts);

        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].accountHolderName").value("John Doe"))
                .andExpect(jsonPath("$[1].accountHolderName").value("Jane Smith"));
    }

    // ==================== POST /api/accounts/{id}/deposit ====================

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void deposit_ShouldReturn200_WhenRequestIsValid() throws Exception {
        DepositRequest request = new DepositRequest();
        request.setAmount(new BigDecimal("500.00"));
        request.setDescription("Salary deposit");

        AccountResponse updatedAccount = AccountResponse.builder()
                .accountId(1L)
                .accountNumber("ACC12345678")
                .accountHolderName("John Doe")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("1500.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(accountService.deposit(eq(1L), any(DepositRequest.class))).thenReturn(updatedAccount);

        mockMvc.perform(post("/api/accounts/1/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(1500.00));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void deposit_ShouldReturn400_WhenAmountIsZero() throws Exception {
        DepositRequest request = new DepositRequest();
        request.setAmount(BigDecimal.ZERO);

        mockMvc.perform(post("/api/accounts/1/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==================== POST /api/accounts/{id}/withdraw ====================

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void withdraw_ShouldReturn200_WhenRequestIsValid() throws Exception {
        WithdrawRequest request = new WithdrawRequest();
        request.setAmount(new BigDecimal("200.00"));
        request.setDescription("ATM");

        AccountResponse updatedAccount = AccountResponse.builder()
                .accountId(1L)
                .accountNumber("ACC12345678")
                .accountHolderName("John Doe")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("800.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(accountService.withdraw(eq(1L), any(WithdrawRequest.class))).thenReturn(updatedAccount);

        mockMvc.perform(post("/api/accounts/1/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.balance").value(800.00));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void withdraw_ShouldReturn400_WhenInsufficientFunds() throws Exception {
        WithdrawRequest request = new WithdrawRequest();
        request.setAmount(new BigDecimal("5000.00"));

        when(accountService.withdraw(eq(1L), any(WithdrawRequest.class)))
                .thenThrow(new InsufficientFundsException("Insufficient funds"));

        mockMvc.perform(post("/api/accounts/1/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Insufficient funds"));
    }

    // ==================== POST /api/accounts/transfer ====================

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void transfer_ShouldReturn200_WhenRequestIsValid() throws Exception {
        TransferRequest request = new TransferRequest();
        request.setFromAccountId(1L);
        request.setToAccountId(2L);
        request.setAmount(new BigDecimal("300.00"));
        request.setDescription("Rent payment");

        TransactionResponse transactionResponse = TransactionResponse.builder()
                .transactionId(1L)
                .fromAccountId(1L)
                .toAccountId(2L)
                .type(TransactionType.TRANSFER)
                .amount(new BigDecimal("300.00"))
                .description("Rent payment")
                .timestamp(LocalDateTime.now())
                .build();

        when(accountService.transfer(any(TransferRequest.class))).thenReturn(transactionResponse);

        mockMvc.perform(post("/api/accounts/transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("TRANSFER"))
                .andExpect(jsonPath("$.amount").value(300.00));
    }

    // ==================== GET /api/accounts/{id}/transactions ====================

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getTransactions_ShouldReturn200_WithPagedTransactions() throws Exception {
        TransactionResponse txn = TransactionResponse.builder()
                .transactionId(1L)
                .toAccountId(1L)
                .type(TransactionType.DEPOSIT)
                .amount(new BigDecimal("500.00"))
                .description("Deposit")
                .timestamp(LocalDateTime.now())
                .build();

        Page<TransactionResponse> page = new PageImpl<>(List.of(txn));
        when(transactionService.getTransactions(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/accounts/1/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].type").value("DEPOSIT"));
    }
}
