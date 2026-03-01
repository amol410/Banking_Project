package com.banking.studentbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StudentBankApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentBankApplication.class, args);
    }
}
