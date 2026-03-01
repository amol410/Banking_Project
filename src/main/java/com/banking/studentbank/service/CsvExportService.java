package com.banking.studentbank.service;

import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.model.BankAccount;
import com.banking.studentbank.model.Transaction;
import com.banking.studentbank.repository.BankAccountRepository;
import com.banking.studentbank.repository.TransactionRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CsvExportService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Export all accounts to CSV
    public byte[] exportAccountsToCsv() {
        List<BankAccount> accounts = bankAccountRepository.findByDeletedFalse();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {

            // Header
            writer.writeNext(new String[]{
                "Account ID", "Account Number", "Holder Name",
                "Account Type", "Balance", "Status", "Created At"
            });

            // Rows
            for (BankAccount a : accounts) {
                writer.writeNext(new String[]{
                    String.valueOf(a.getAccountId()),
                    a.getAccountNumber(),
                    a.getAccountHolderName(),
                    a.getAccountType().name(),
                    a.getBalance().toString(),
                    a.getStatus().name(),
                    a.getCreatedAt() != null ? a.getCreatedAt().format(FORMATTER) : ""
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV: " + e.getMessage());
        }

        return out.toByteArray();
    }

    // Export transactions of a specific account to CSV
    public byte[] exportTransactionsToCsv(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        List<Transaction> transactions = transactionRepository
                .findByFromAccountOrToAccount(account, account,
                        PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "timestamp")))
                .getContent();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {

            // Header
            writer.writeNext(new String[]{
                "Transaction ID", "Type", "Amount",
                "From Account", "To Account", "Description", "Timestamp"
            });

            // Rows
            for (Transaction t : transactions) {
                writer.writeNext(new String[]{
                    String.valueOf(t.getTransactionId()),
                    t.getType().name(),
                    t.getAmount().toString(),
                    t.getFromAccount() != null ? t.getFromAccount().getAccountNumber() : "-",
                    t.getToAccount() != null ? t.getToAccount().getAccountNumber() : "-",
                    t.getDescription() != null ? t.getDescription() : "-",
                    t.getTimestamp().format(FORMATTER)
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV: " + e.getMessage());
        }

        return out.toByteArray();
    }
}
