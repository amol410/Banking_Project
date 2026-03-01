package com.banking.studentbank.service;

import com.banking.studentbank.dto.TransactionResponse;
import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.model.BankAccount;
import com.banking.studentbank.model.Transaction;
import com.banking.studentbank.repository.BankAccountRepository;
import com.banking.studentbank.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;

    public Transaction saveTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    public Page<TransactionResponse> getTransactions(Long accountId, Pageable pageable) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        return transactionRepository.findByFromAccountOrToAccount(account, account, pageable)
                .map(this::mapToResponse);
    }

    // Feature 6: Date filter on transactions
    public List<TransactionResponse> getTransactionsByDateRange(Long accountId, LocalDate startDate, LocalDate endDate) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return transactionRepository.findByAccountAndDateRange(account, start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Feature 12: Get today's total withdrawal amount for daily limit check
    public BigDecimal getTodayWithdrawalTotal(BankAccount account) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return transactionRepository.sumWithdrawalsToday(account, startOfDay);
    }

    // Feature 5: Mini Statement - last 5 transactions
    public List<TransactionResponse> getMiniStatement(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        Pageable top5 = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "timestamp"));
        return transactionRepository.findByFromAccountOrToAccount(account, account, top5)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .transactionId(transaction.getTransactionId())
                .fromAccountId(transaction.getFromAccount() != null ? transaction.getFromAccount().getAccountId() : null)
                .fromAccountNumber(transaction.getFromAccount() != null ? transaction.getFromAccount().getAccountNumber() : null)
                .toAccountId(transaction.getToAccount() != null ? transaction.getToAccount().getAccountId() : null)
                .toAccountNumber(transaction.getToAccount() != null ? transaction.getToAccount().getAccountNumber() : null)
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .timestamp(transaction.getTimestamp())
                .build();
    }
}
