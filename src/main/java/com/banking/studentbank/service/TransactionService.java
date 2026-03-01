package com.banking.studentbank.service;

import com.banking.studentbank.dto.TransactionResponse;
import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.model.BankAccount;
import com.banking.studentbank.model.Transaction;
import com.banking.studentbank.repository.BankAccountRepository;
import com.banking.studentbank.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

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
