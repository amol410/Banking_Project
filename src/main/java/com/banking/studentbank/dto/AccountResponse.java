package com.banking.studentbank.dto;

import com.banking.studentbank.model.AccountStatus;
import com.banking.studentbank.model.AccountType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AccountResponse {

    private Long accountId;
    private String accountNumber;
    private String accountHolderName;
    private AccountType accountType;
    private BigDecimal balance;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
