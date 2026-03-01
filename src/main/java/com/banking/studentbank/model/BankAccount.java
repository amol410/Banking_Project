package com.banking.studentbank.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bank_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    @Column(unique = true, nullable = false, length = 20)
    private String accountNumber;

    @Column(nullable = false)
    private String accountHolderName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType accountType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Soft Delete
    @Column(nullable = false)
    private boolean deleted = false;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "fromAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> sentTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "toAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> receivedTransactions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
