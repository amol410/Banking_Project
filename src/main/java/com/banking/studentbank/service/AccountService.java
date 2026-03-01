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
import java.time.LocalDateTime;
import java.util.List;
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
