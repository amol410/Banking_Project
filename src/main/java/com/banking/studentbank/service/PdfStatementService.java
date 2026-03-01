package com.banking.studentbank.service;

import com.banking.studentbank.exception.AccountNotFoundException;
import com.banking.studentbank.model.BankAccount;
import com.banking.studentbank.model.Transaction;
import com.banking.studentbank.repository.BankAccountRepository;
import com.banking.studentbank.repository.TransactionRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfStatementService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;

    public byte[] generateStatement(Long accountId) {
        BankAccount account = bankAccountRepository.findById(accountId)
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        List<Transaction> transactions = transactionRepository
                .findByFromAccountOrToAccount(account, account,
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "timestamp")))
                .getContent();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

        // Title
        document.add(new Paragraph("STUDENT BANK")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph("Account Statement")
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph(" "));

        // Account Details
        document.add(new Paragraph("Account Details").setBold().setFontSize(12));
        document.add(new Paragraph("Account Holder : " + account.getAccountHolderName()));
        document.add(new Paragraph("Account Number : " + account.getAccountNumber()));
        document.add(new Paragraph("Account Type   : " + account.getAccountType()));
        document.add(new Paragraph("Current Balance: Rs. " + account.getBalance()));
        document.add(new Paragraph("Status         : " + account.getStatus()));
        document.add(new Paragraph(" "));

        // Transactions Table
        document.add(new Paragraph("Transaction History").setBold().setFontSize(12));

        Table table = new Table(UnitValue.createPercentArray(new float[]{15, 15, 20, 15, 35}))
                .useAllAvailableWidth();

        // Table Header
        String[] headers = {"Txn ID", "Type", "Amount (Rs.)", "Date", "Description"};
        for (String header : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(header).setBold())
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                    .setTextAlignment(TextAlignment.CENTER));
        }

        // Table Rows
        for (Transaction txn : transactions) {
            table.addCell(new Cell().add(new Paragraph(String.valueOf(txn.getTransactionId()))));
            table.addCell(new Cell().add(new Paragraph(txn.getType().name())));
            table.addCell(new Cell().add(new Paragraph("Rs. " + txn.getAmount())));
            table.addCell(new Cell().add(new Paragraph(txn.getTimestamp().format(formatter))));
            table.addCell(new Cell().add(new Paragraph(txn.getDescription() != null ? txn.getDescription() : "-")));
        }

        document.add(table);
        document.add(new Paragraph(" "));
        document.add(new Paragraph("Generated on: " + java.time.LocalDateTime.now().format(formatter))
                .setFontSize(9)
                .setTextAlignment(TextAlignment.RIGHT));

        document.close();
        return out.toByteArray();
    }
}
