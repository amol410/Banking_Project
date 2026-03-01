package com.banking.studentbank.repository;

import com.banking.studentbank.model.BankAccount;
import com.banking.studentbank.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByFromAccountOrToAccount(BankAccount fromAccount, BankAccount toAccount, Pageable pageable);

    // Feature 6: Date filter on transactions
    @Query("SELECT t FROM Transaction t WHERE (t.fromAccount = :account OR t.toAccount = :account) AND t.timestamp BETWEEN :startDate AND :endDate ORDER BY t.timestamp DESC")
    List<Transaction> findByAccountAndDateRange(
            @Param("account") BankAccount account,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Feature 12: Daily transaction total for limit check
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.fromAccount = :account AND t.timestamp >= :startOfDay")
    java.math.BigDecimal sumWithdrawalsToday(
            @Param("account") BankAccount account,
            @Param("startOfDay") LocalDateTime startOfDay);
}
