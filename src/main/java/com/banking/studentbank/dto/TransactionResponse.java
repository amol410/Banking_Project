package com.banking.studentbank.dto;

import com.banking.studentbank.model.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {

    private Long transactionId;
    private Long fromAccountId;
    private String fromAccountNumber;
    private Long toAccountId;
    private String toAccountNumber;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private LocalDateTime timestamp;
}
