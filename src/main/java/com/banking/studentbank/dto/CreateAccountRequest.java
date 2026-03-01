package com.banking.studentbank.dto;

import com.banking.studentbank.model.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAccountRequest {

    @NotBlank(message = "Account holder name is required")
    private String accountHolderName;

    @NotNull(message = "Account type is required")
    private AccountType accountType;
}
