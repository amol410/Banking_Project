package com.banking.studentbank.exception;

public class InvalidAccountOperationException extends RuntimeException {

    public InvalidAccountOperationException(String message) {
        super(message);
    }
}
