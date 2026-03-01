package com.banking.studentbank;

import com.banking.studentbank.dto.*;
import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.exception.InsufficientFundsException;
import com.banking.studentbank.exception.InvalidAccountOperationException;
import com.banking.studentbank.model.*;
import com.banking.studentbank.repository.BankAccountRepository;
import com.banking.studentbank.service.AccountService;
import com.banking.studentbank.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private AccountService accountService;

    private BankAccount testAccount;

    @BeforeEach
    void setUp() {
        testAccount = BankAccount.builder()
                .accountId(1L)
                .accountNumber("ACC12345678")
                .accountHolderName("John Doe")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("1000.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ==================== createAccount ====================

    @Test
    void createAccount_ShouldReturnAccountResponse_WhenRequestIsValid() {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setAccountHolderName("John Doe");
        request.setAccountType(AccountType.SAVINGS);

        when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount);

        AccountResponse response = accountService.createAccount(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccountHolderName()).isEqualTo("John Doe");
        assertThat(response.getAccountType()).isEqualTo(AccountType.SAVINGS);
        assertThat(response.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        verify(bankAccountRepository, times(1)).save(any(BankAccount.class));
    }

    @Test
    void createAccount_ShouldSetInitialBalanceToZero() {
        CreateAccountRequest request = new CreateAccountRequest();
        request.setAccountHolderName("Jane Smith");
        request.setAccountType(AccountType.CURRENT);

        BankAccount zeroBalanceAccount = BankAccount.builder()
                .accountId(2L)
                .accountNumber("ACC99999999")
                .accountHolderName("Jane Smith")
                .accountType(AccountType.CURRENT)
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(zeroBalanceAccount);

        AccountResponse response = accountService.createAccount(request);

        assertThat(response.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ==================== getAccount ====================

    @Test
    void getAccount_ShouldReturnAccount_WhenAccountExists() {
        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));

        AccountResponse response = accountService.getAccount(1L);

        assertThat(response.getAccountId()).isEqualTo(1L);
        assertThat(response.getAccountNumber()).isEqualTo("ACC12345678");
    }

    @Test
    void getAccount_ShouldThrowAccountNotFoundException_WhenAccountDoesNotExist() {
        when(bankAccountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.getAccount(99L))
                .isInstanceOf(AccountNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ==================== getAllAccounts ====================

    @Test
    void getAllAccounts_ShouldReturnListOfAccounts() {
        BankAccount account2 = BankAccount.builder()
                .accountId(2L)
                .accountNumber("ACC87654321")
                .accountHolderName("Jane Smith")
                .accountType(AccountType.CURRENT)
                .balance(new BigDecimal("500.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(bankAccountRepository.findAll()).thenReturn(Arrays.asList(testAccount, account2));

        List<AccountResponse> accounts = accountService.getAllAccounts();

        assertThat(accounts).hasSize(2);
        assertThat(accounts.get(0).getAccountHolderName()).isEqualTo("John Doe");
        assertThat(accounts.get(1).getAccountHolderName()).isEqualTo("Jane Smith");
    }

    // ==================== deposit ====================

    @Test
    void deposit_ShouldIncreaseBalance_WhenAccountIsActive() {
        DepositRequest request = new DepositRequest();
        request.setAmount(new BigDecimal("500.00"));
        request.setDescription("Salary");

        BankAccount updatedAccount = BankAccount.builder()
                .accountId(1L)
                .accountNumber("ACC12345678")
                .accountHolderName("John Doe")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("1500.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(updatedAccount);
        when(transactionService.saveTransaction(any(Transaction.class))).thenReturn(new Transaction());

        AccountResponse response = accountService.deposit(1L, request);

        assertThat(response.getBalance()).isEqualByComparingTo(new BigDecimal("1500.00"));
        verify(transactionService, times(1)).saveTransaction(any(Transaction.class));
    }

    @Test
    void deposit_ShouldThrowInvalidAccountOperationException_WhenAccountIsInactive() {
        testAccount.setStatus(AccountStatus.INACTIVE);

        DepositRequest request = new DepositRequest();
        request.setAmount(new BigDecimal("500.00"));

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));

        assertThatThrownBy(() -> accountService.deposit(1L, request))
                .isInstanceOf(InvalidAccountOperationException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    void deposit_ShouldThrowAccountNotFoundException_WhenAccountDoesNotExist() {
        DepositRequest request = new DepositRequest();
        request.setAmount(new BigDecimal("100.00"));

        when(bankAccountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.deposit(99L, request))
                .isInstanceOf(AccountNotFoundException.class);
    }

    // ==================== withdraw ====================

    @Test
    void withdraw_ShouldDecreaseBalance_WhenSufficientFunds() {
        WithdrawRequest request = new WithdrawRequest();
        request.setAmount(new BigDecimal("300.00"));
        request.setDescription("ATM Withdrawal");

        BankAccount updatedAccount = BankAccount.builder()
                .accountId(1L)
                .accountNumber("ACC12345678")
                .accountHolderName("John Doe")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("700.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(updatedAccount);
        when(transactionService.saveTransaction(any(Transaction.class))).thenReturn(new Transaction());

        AccountResponse response = accountService.withdraw(1L, request);

        assertThat(response.getBalance()).isEqualByComparingTo(new BigDecimal("700.00"));
        verify(transactionService, times(1)).saveTransaction(any(Transaction.class));
    }

    @Test
    void withdraw_ShouldThrowInsufficientFundsException_WhenBalanceIsLow() {
        WithdrawRequest request = new WithdrawRequest();
        request.setAmount(new BigDecimal("2000.00"));

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));

        assertThatThrownBy(() -> accountService.withdraw(1L, request))
                .isInstanceOf(InsufficientFundsException.class)
                .hasMessageContaining("Insufficient funds");
    }

    @Test
    void withdraw_ShouldThrowInvalidAccountOperationException_WhenAccountIsInactive() {
        testAccount.setStatus(AccountStatus.INACTIVE);

        WithdrawRequest request = new WithdrawRequest();
        request.setAmount(new BigDecimal("100.00"));

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));

        assertThatThrownBy(() -> accountService.withdraw(1L, request))
                .isInstanceOf(InvalidAccountOperationException.class)
                .hasMessageContaining("inactive");
    }

    // ==================== transfer ====================

    @Test
    void transfer_ShouldMoveMoneyBetweenAccounts_WhenBothAccountsAreValid() {
        BankAccount toAccount = BankAccount.builder()
                .accountId(2L)
                .accountNumber("ACC87654321")
                .accountHolderName("Jane Smith")
                .accountType(AccountType.CURRENT)
                .balance(new BigDecimal("500.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        TransferRequest request = new TransferRequest();
        request.setFromAccountId(1L);
        request.setToAccountId(2L);
        request.setAmount(new BigDecimal("200.00"));
        request.setDescription("Rent payment");

        Transaction savedTransaction = Transaction.builder()
                .transactionId(1L)
                .fromAccount(testAccount)
                .toAccount(toAccount)
                .type(TransactionType.TRANSFER)
                .amount(new BigDecimal("200.00"))
                .description("Rent payment")
                .timestamp(LocalDateTime.now())
                .build();

        TransactionResponse expectedResponse = TransactionResponse.builder()
                .transactionId(1L)
                .fromAccountId(1L)
                .toAccountId(2L)
                .type(TransactionType.TRANSFER)
                .amount(new BigDecimal("200.00"))
                .build();

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(bankAccountRepository.findById(2L)).thenReturn(Optional.of(toAccount));
        when(bankAccountRepository.save(any(BankAccount.class))).thenReturn(testAccount).thenReturn(toAccount);
        when(transactionService.saveTransaction(any(Transaction.class))).thenReturn(savedTransaction);
        when(transactionService.mapToResponse(any(Transaction.class))).thenReturn(expectedResponse);

        TransactionResponse response = accountService.transfer(request);

        assertThat(response).isNotNull();
        assertThat(response.getType()).isEqualTo(TransactionType.TRANSFER);
        verify(bankAccountRepository, times(2)).save(any(BankAccount.class));
        verify(transactionService, times(1)).saveTransaction(any(Transaction.class));
    }

    @Test
    void transfer_ShouldThrowInvalidAccountOperationException_WhenSameAccount() {
        TransferRequest request = new TransferRequest();
        request.setFromAccountId(1L);
        request.setToAccountId(1L);
        request.setAmount(new BigDecimal("100.00"));

        assertThatThrownBy(() -> accountService.transfer(request))
                .isInstanceOf(InvalidAccountOperationException.class)
                .hasMessageContaining("same account");
    }

    @Test
    void transfer_ShouldThrowInsufficientFundsException_WhenSourceBalanceLow() {
        BankAccount toAccount = BankAccount.builder()
                .accountId(2L)
                .accountNumber("ACC87654321")
                .accountHolderName("Jane Smith")
                .accountType(AccountType.CURRENT)
                .balance(new BigDecimal("500.00"))
                .status(AccountStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        TransferRequest request = new TransferRequest();
        request.setFromAccountId(1L);
        request.setToAccountId(2L);
        request.setAmount(new BigDecimal("5000.00"));

        when(bankAccountRepository.findById(1L)).thenReturn(Optional.of(testAccount));
        when(bankAccountRepository.findById(2L)).thenReturn(Optional.of(toAccount));

        assertThatThrownBy(() -> accountService.transfer(request))
                .isInstanceOf(InsufficientFundsException.class);
    }

    @Test
    void transfer_ShouldThrowAccountNotFoundException_WhenFromAccountMissing() {
        TransferRequest request = new TransferRequest();
        request.setFromAccountId(99L);
        request.setToAccountId(2L);
        request.setAmount(new BigDecimal("100.00"));

        when(bankAccountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.transfer(request))
                .isInstanceOf(AccountNotFoundException.class);
    }
}
