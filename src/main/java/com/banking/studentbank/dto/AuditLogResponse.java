package com.banking.studentbank.dto;

import com.banking.studentbank.model.AuditStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {

    private Long id;
    private String username;
    private String action;
    private String description;
    private String ipAddress;
    private LocalDateTime timestamp;
    private AuditStatus status;
}
