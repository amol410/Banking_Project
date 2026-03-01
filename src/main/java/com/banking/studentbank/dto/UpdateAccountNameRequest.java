package com.banking.studentbank.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAccountNameRequest {

    @NotBlank(message = "Account holder name cannot be blank")
    private String accountHolderName;
}
