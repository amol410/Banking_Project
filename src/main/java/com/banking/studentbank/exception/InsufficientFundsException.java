package com.banking.studentbank.exception;

import java.math.BigDecimal;

public class InsufficientFundsException extends RuntimeException {

    public InsufficientFundsException(String message) {
        super(message);
    }

    public InsufficientFundsException(BigDecimal requested, BigDecimal available) {
        super(String.format("Insufficient funds. Requested: %.2f, Available: %.2f", requested, available));
    }
}
