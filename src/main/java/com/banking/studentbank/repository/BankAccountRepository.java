package com.banking.studentbank.repository;

import com.banking.studentbank.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    Optional<BankAccount> findByAccountNumber(String accountNumber);

    List<BankAccount> findByAccountHolderNameContaining(String name);

    // Soft delete - only return non-deleted accounts
    List<BankAccount> findByDeletedFalse();

    Optional<BankAccount> findByAccountIdAndDeletedFalse(Long accountId);

    // Global search across accountNumber and accountHolderName
    @Query("SELECT a FROM BankAccount a WHERE a.deleted = false AND " +
           "(LOWER(a.accountHolderName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.accountNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<BankAccount> globalSearch(@Param("keyword") String keyword);

    // Dashboard stats
    long countByDeletedFalse();

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM BankAccount a WHERE a.deleted = false")
    java.math.BigDecimal sumAllBalances();

    @Query("SELECT COUNT(a) FROM BankAccount a WHERE a.deleted = false AND a.status = 'ACTIVE'")
    long countActiveAccounts();

    @Query("SELECT COUNT(a) FROM BankAccount a WHERE a.deleted = false AND a.status = 'INACTIVE'")
    long countInactiveAccounts();
}
