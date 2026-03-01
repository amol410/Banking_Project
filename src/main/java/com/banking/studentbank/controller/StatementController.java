package com.banking.studentbank.controller;

import com.banking.studentbank.service.AccountService;
import com.banking.studentbank.service.CsvExportService;
import com.banking.studentbank.service.PdfStatementService;
import com.banking.studentbank.service.ScheduledInterestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Statements & Admin", description = "PDF/CSV statements, scheduled jobs, and admin dashboard")
@SecurityRequirement(name = "bearerAuth")
public class StatementController {

    private final PdfStatementService pdfStatementService;
    private final ScheduledInterestService scheduledInterestService;
    private final CsvExportService csvExportService;
    private final AccountService accountService;

    @GetMapping("/accounts/{id}/statement/pdf")
    @Operation(summary = "Download account statement as PDF")
    public ResponseEntity<byte[]> downloadStatement(@PathVariable Long id) {
        byte[] pdf = pdfStatementService.generateStatement(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "statement_account_" + id + ".pdf");
        headers.setContentLength(pdf.length);

        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @PostMapping("/admin/trigger-interest")
    @Operation(summary = "Manually trigger monthly interest job (Admin only)")
    public ResponseEntity<Map<String, String>> triggerInterest() {
        String result = scheduledInterestService.triggerInterestManually();
        return ResponseEntity.ok(Map.of("message", result));
    }

    // Group 4 Feature 2: Export all accounts to CSV
    @GetMapping("/accounts/export/csv")
    @Operation(summary = "Export all accounts to CSV")
    public ResponseEntity<byte[]> exportAccountsCsv() {
        byte[] csv = csvExportService.exportAccountsToCsv();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "accounts.csv");
        headers.setContentLength(csv.length);

        return ResponseEntity.ok().headers(headers).body(csv);
    }

    // Group 4 Feature 2: Export transactions of a specific account to CSV
    @GetMapping("/accounts/{id}/transactions/export/csv")
    @Operation(summary = "Export transactions of an account to CSV")
    public ResponseEntity<byte[]> exportTransactionsCsv(@PathVariable Long id) {
        byte[] csv = csvExportService.exportTransactionsToCsv(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "transactions_account_" + id + ".csv");
        headers.setContentLength(csv.length);

        return ResponseEntity.ok().headers(headers).body(csv);
    }

    // Group 4 Feature 4: Admin Dashboard Stats
    @GetMapping("/admin/dashboard")
    @Operation(summary = "Get admin dashboard statistics")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(accountService.getDashboardStats());
    }
}
