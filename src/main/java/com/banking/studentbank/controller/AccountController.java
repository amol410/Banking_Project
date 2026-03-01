package com.banking.studentbank.controller;

import com.banking.studentbank.dto.*;
import com.banking.studentbank.service.AccountService;
import com.banking.studentbank.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Bank Accounts", description = "Bank account management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;
    private final TransactionService transactionService;

    @PostMapping
    @Operation(summary = "Create a new bank account")
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable Long id) {
        AccountResponse response = accountService.getAccount(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get all accounts")
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        List<AccountResponse> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }

    @PostMapping("/{id}/deposit")
    @Operation(summary = "Deposit funds into an account")
    public ResponseEntity<AccountResponse> deposit(
            @PathVariable Long id,
            @Valid @RequestBody DepositRequest request) {
        AccountResponse response = accountService.deposit(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw funds from an account")
    public ResponseEntity<AccountResponse> withdraw(
            @PathVariable Long id,
            @Valid @RequestBody WithdrawRequest request) {
        AccountResponse response = accountService.withdraw(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer funds between accounts")
    public ResponseEntity<TransactionResponse> transfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = accountService.transfer(request);
        return ResponseEntity.ok(response);
    }

    // Feature 6: Date filter on transactions
    @GetMapping("/{id}/transactions/filter")
    @Operation(summary = "Get transactions between two dates")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByDate(
            @PathVariable Long id,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        java.time.LocalDate start = java.time.LocalDate.parse(startDate);
        java.time.LocalDate end = java.time.LocalDate.parse(endDate);
        return ResponseEntity.ok(transactionService.getTransactionsByDateRange(id, start, end));
    }

    // Feature 11: Interest calculation
    @GetMapping("/{id}/interest")
    @Operation(summary = "Calculate interest for a savings account")
    public ResponseEntity<Map<String, Object>> calculateInterest(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.calculateInterest(id));
    }

    // Feature 1: Close Account
    @PutMapping("/{id}/close")
    @Operation(summary = "Close (deactivate) an account")
    public ResponseEntity<AccountResponse> closeAccount(@PathVariable Long id) {
        return ResponseEntity.ok(accountService.closeAccount(id));
    }

    // Feature 2: Update Account Holder Name
    @PutMapping("/{id}/update-name")
    @Operation(summary = "Update account holder name")
    public ResponseEntity<AccountResponse> updateName(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountNameRequest request) {
        return ResponseEntity.ok(accountService.updateAccountName(id, request.getAccountHolderName()));
    }

    // Feature 3: Get Account by Account Number
    @GetMapping("/number/{accountNumber}")
    @Operation(summary = "Get account by account number")
    public ResponseEntity<AccountResponse> getByAccountNumber(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccountByNumber(accountNumber));
    }

    // Feature 4: Search Accounts by Name
    @GetMapping("/search")
    @Operation(summary = "Search accounts by holder name")
    public ResponseEntity<List<AccountResponse>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(accountService.searchByName(name));
    }

    // Feature 5: Mini Statement (last 5 transactions)
    @GetMapping("/{id}/mini-statement")
    @Operation(summary = "Get last 5 transactions (mini statement)")
    public ResponseEntity<List<TransactionResponse>> getMiniStatement(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getMiniStatement(id));
    }

    @GetMapping("/{id}/balance")
    @Operation(summary = "Get account balance")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable Long id) {
        AccountResponse account = accountService.getAccount(id);
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("accountId", account.getAccountId());
        response.put("accountNumber", account.getAccountNumber());
        response.put("accountHolderName", account.getAccountHolderName());
        response.put("balance", account.getBalance());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Get transaction history for an account")
    public ResponseEntity<Page<TransactionResponse>> getTransactions(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<TransactionResponse> transactions = transactionService.getTransactions(id, pageable);
        return ResponseEntity.ok(transactions);
    }
}
