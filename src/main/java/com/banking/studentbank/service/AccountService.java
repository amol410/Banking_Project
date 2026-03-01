package com.banking.studentbank.service;

import com.banking.studentbank.dto.*;
import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.exception.InsufficientFundsException;
import com.banking.studentbank.exception.InvalidAccountOperationException;
import com.banking.studentbank.model.*;
import com.banking.studentbank.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionService transactionService;

    public AccountResponse createAccount(CreateAccountRequest request) {
        String accountNumber = generateAccountNumber();

        BankAccount account = BankAccount.builder()
                .accountNumber(accountNumber)
                .accountHolderName(request.getAccountHolderName())
                .accountType(request.getAccountType())
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .build();

        BankAccount saved = bankAccountRepository.save(account);
        return mapToResponse(saved);
    }

    public AccountResponse getAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));
        return mapToResponse(account);
    }

    public List<AccountResponse> getAllAccounts() {
        return bankAccountRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccountByNumber(String accountNumber) {
        BankAccount account = bankAccountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with number: " + accountNumber));
        return mapToResponse(account);
    }

    @Transactional
    public AccountResponse deposit(Long accountId, DepositRequest request) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (account.getStatus() == AccountStatus.INACTIVE) {
            throw new InvalidAccountOperationException("Cannot deposit to an inactive account");
        }

        account.setBalance(account.getBalance().add(request.getAmount()));
        BankAccount saved = bankAccountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .toAccount(saved)
                .type(TransactionType.DEPOSIT)
                .amount(request.getAmount())
                .description(request.getDescription() != null ? request.getDescription() : "Deposit")
                .timestamp(LocalDateTime.now())
                .build();
        transactionService.saveTransaction(transaction);

        return mapToResponse(saved);
    }

    @Transactional
    public AccountResponse withdraw(Long accountId, WithdrawRequest request) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (account.getStatus() == AccountStatus.INACTIVE) {
            throw new InvalidAccountOperationException("Cannot withdraw from an inactive account");
        }

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(request.getAmount(), account.getBalance());
        }

        // Feature 9: Daily withdrawal limit check
        BigDecimal todayTotal = transactionService.getTodayWithdrawalTotal(account);
        if (todayTotal.add(request.getAmount()).compareTo(DAILY_WITHDRAWAL_LIMIT) > 0) {
            BigDecimal remaining = DAILY_WITHDRAWAL_LIMIT.subtract(todayTotal);
            throw new InvalidAccountOperationException(
                "Daily withdrawal limit of " + DAILY_WITHDRAWAL_LIMIT + " exceeded. Remaining limit today: " + remaining);
        }

        account.setBalance(account.getBalance().subtract(request.getAmount()));
        BankAccount saved = bankAccountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .fromAccount(saved)
                .type(TransactionType.WITHDRAWAL)
                .amount(request.getAmount())
                .description(request.getDescription() != null ? request.getDescription() : "Withdrawal")
                .timestamp(LocalDateTime.now())
                .build();
        transactionService.saveTransaction(transaction);

        return mapToResponse(saved);
    }

    @Transactional
    public TransactionResponse transfer(TransferRequest request) {
        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new InvalidAccountOperationException("Cannot transfer to the same account");
        }

        BankAccount fromAccount = bankAccountRepository.findById(request.getFromAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getFromAccountId()));

        BankAccount toAccount = bankAccountRepository.findById(request.getToAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getToAccountId()));

        if (fromAccount.getStatus() == AccountStatus.INACTIVE) {
            throw new InvalidAccountOperationException("Source account is inactive");
        }

        if (toAccount.getStatus() == AccountStatus.INACTIVE) {
            throw new InvalidAccountOperationException("Destination account is inactive");
        }

        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(request.getAmount(), fromAccount.getBalance());
        }

        // Debit source account
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        bankAccountRepository.save(fromAccount);

        // Credit destination account
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));
        bankAccountRepository.save(toAccount);

        Transaction transaction = Transaction.builder()
                .fromAccount(fromAccount)
                .toAccount(toAccount)
                .type(TransactionType.TRANSFER)
                .amount(request.getAmount())
                .description(request.getDescription() != null ? request.getDescription() : "Transfer")
                .timestamp(LocalDateTime.now())
                .build();

        Transaction saved = transactionService.saveTransaction(transaction);
        return transactionService.mapToResponse(saved);
    }

    // Feature 1: Close Account
    public AccountResponse closeAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (account.getStatus() == AccountStatus.INACTIVE) {
            throw new InvalidAccountOperationException("Account is already inactive");
        }

        account.setStatus(AccountStatus.INACTIVE);
        return mapToResponse(bankAccountRepository.save(account));
    }

    // Feature 2: Update Account Holder Name
    public AccountResponse updateAccountName(Long accountId, String newName) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (newName == null || newName.trim().isEmpty()) {
            throw new InvalidAccountOperationException("Account holder name cannot be blank");
        }

        account.setAccountHolderName(newName.trim());
        return mapToResponse(bankAccountRepository.save(account));
    }

    // Feature 9: Daily withdrawal limit (max 10,000 per day)
    private static final BigDecimal DAILY_WITHDRAWAL_LIMIT = new BigDecimal("10000.00");

    // Feature 11: Interest rate for savings accounts (4% per annum)
    private static final BigDecimal ANNUAL_INTEREST_RATE = new BigDecimal("0.04");

    // Feature 3: Get Account by Account Number (already exists, exposed via controller)

    // Feature 11: Calculate interest for a savings account
    public Map<String, Object> calculateInterest(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (account.getAccountType() != AccountType.SAVINGS) {
            throw new InvalidAccountOperationException("Interest is only applicable for SAVINGS accounts");
        }

        BigDecimal monthlyInterest = account.getBalance()
                .multiply(ANNUAL_INTEREST_RATE)
                .divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);

        BigDecimal yearlyInterest = account.getBalance()
                .multiply(ANNUAL_INTEREST_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("accountId", account.getAccountId());
        result.put("accountNumber", account.getAccountNumber());
        result.put("currentBalance", account.getBalance());
        result.put("annualInterestRate", "4%");
        result.put("monthlyInterest", monthlyInterest);
        result.put("yearlyInterest", yearlyInterest);
        result.put("balanceAfterOneYear", account.getBalance().add(yearlyInterest));
        return result;
    }

    // Feature 4: Search Accounts by Name
    public List<AccountResponse> searchByName(String name) {
        return bankAccountRepository.findByAccountHolderNameContaining(name)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Group 4 Feature 1: Global Search
    public List<AccountResponse> globalSearch(String keyword) {
        return bankAccountRepository.globalSearch(keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Group 4 Feature 2: Soft Delete
    public Map<String, String> softDeleteAccount(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        if (account.isDeleted()) {
            throw new InvalidAccountOperationException("Account is already deleted");
        }

        account.setDeleted(true);
        account.setDeletedAt(LocalDateTime.now());
        account.setStatus(AccountStatus.INACTIVE);
        bankAccountRepository.save(account);

        Map<String, String> result = new java.util.LinkedHashMap<>();
        result.put("message", "Account soft deleted successfully");
        result.put("accountId", String.valueOf(accountId));
        result.put("deletedAt", account.getDeletedAt().toString());
        return result;
    }

    // Group 4 Feature 3: Admin Dashboard Stats
    public Map<String, Object> getDashboardStats() {
        long totalAccounts = bankAccountRepository.countByDeletedFalse();
        long activeAccounts = bankAccountRepository.countActiveAccounts();
        long inactiveAccounts = bankAccountRepository.countInactiveAccounts();
        java.math.BigDecimal totalBalance = bankAccountRepository.sumAllBalances();

        Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("totalAccounts", totalAccounts);
        stats.put("activeAccounts", activeAccounts);
        stats.put("inactiveAccounts", inactiveAccounts);
        stats.put("totalBalanceAcrossAllAccounts", totalBalance);
        stats.put("generatedAt", LocalDateTime.now().toString());
        return stats;
    }

    private String generateAccountNumber() {
        return "ACC" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    public AccountResponse mapToResponse(BankAccount account) {
        return AccountResponse.builder()
                .accountId(account.getAccountId())
                .accountNumber(account.getAccountNumber())
                .accountHolderName(account.getAccountHolderName())
                .accountType(account.getAccountType())
                .balance(account.getBalance())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
