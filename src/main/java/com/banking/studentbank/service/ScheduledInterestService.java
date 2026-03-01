package com.banking.studentbank.service;

import com.banking.studentbank.model.AccountStatus;
import com.banking.studentbank.model.AccountType;
import com.banking.studentbank.model.AuditStatus;
import com.banking.studentbank.model.BankAccount;
import com.banking.studentbank.model.Transaction;
import com.banking.studentbank.model.TransactionType;
import com.banking.studentbank.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledInterestService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionService transactionService;
    private final AuditLogService auditLogService;

    @Value("${app.interest.rate:0.04}")
    private BigDecimal annualInterestRate;

    // Runs on the 1st of every month at midnight
    // Cron: second minute hour day month weekday
    @Scheduled(cron = "${app.interest.schedule:0 0 0 1 * *}")
    @Transactional
    public void applyMonthlyInterest() {
        log.info("Starting monthly interest job at {}", LocalDateTime.now());

        List<BankAccount> savingsAccounts = bankAccountRepository.findAll()
                .stream()
                .filter(a -> a.getAccountType() == AccountType.SAVINGS
                          && a.getStatus() == AccountStatus.ACTIVE
                          && a.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        int count = 0;
        for (BankAccount account : savingsAccounts) {
            BigDecimal monthlyInterest = account.getBalance()
                    .multiply(annualInterestRate)
                    .divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);

            account.setBalance(account.getBalance().add(monthlyInterest));
            bankAccountRepository.save(account);

            Transaction txn = Transaction.builder()
                    .toAccount(account)
                    .type(TransactionType.DEPOSIT)
                    .amount(monthlyInterest)
                    .description("Monthly interest credit @ " + annualInterestRate.multiply(new BigDecimal("100")) + "% p.a.")
                    .timestamp(LocalDateTime.now())
                    .build();
            transactionService.saveTransaction(txn);

            count++;
            log.info("Interest of {} credited to account {}", monthlyInterest, account.getAccountNumber());
        }

        auditLogService.log("SYSTEM", "INTEREST_JOB",
                "Monthly interest applied to " + count + " accounts",
                "localhost", AuditStatus.SUCCESS);

        log.info("Monthly interest job completed. Processed {} accounts.", count);
    }

    // Manual trigger endpoint support
    @Transactional
    public String triggerInterestManually() {
        applyMonthlyInterest();
        return "Monthly interest applied successfully";
    }
}
