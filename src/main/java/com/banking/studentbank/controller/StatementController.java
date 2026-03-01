package com.banking.studentbank.controller;

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
@Tag(name = "Statements & Jobs", description = "PDF statement and scheduled job endpoints")
@SecurityRequirement(name = "bearerAuth")
public class StatementController {

    private final PdfStatementService pdfStatementService;
    private final ScheduledInterestService scheduledInterestService;

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
}
