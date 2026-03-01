# Issues Faced & Solutions — Student Bank Account Management System

A complete log of every real issue encountered while building this Spring Boot project from scratch,
with exact error messages and how each was fixed.

---

## Issue 1: Lombok Crashes with Java 24 — `TypeTag::UNKNOWN`

**When it happened:** First build attempt after creating the project.

**Error:**
```
java.lang.AssertionError: TypeTag::UNKNOWN
    at com.sun.tools.javac.code.TypeTag.ordinal(TypeTag.java)
    at lombok.javac.handlers.HandleConstructor...
```

**Root Cause:**
Spring Boot 3.2.5 pulls Lombok 1.18.32 by default. Lombok versions below 1.18.36 don't support Java 23+ internal APIs and crash when trying to generate constructors/getters.

**Fix:**
In `pom.xml`, explicitly pin Lombok to `1.18.38` (the first version with full Java 24 support):
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.38</version>
    <optional>true</optional>
</dependency>
```
Also add `-proc:full` compiler argument and explicit annotationProcessorPaths:
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <release>17</release>
        <compilerArgs><arg>-proc:full</arg></compilerArgs>
        <annotationProcessorPaths>
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
                <version>1.18.38</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

---

## Issue 2: Spring Boot ASM Cannot Parse Java 24 Class Files

**When it happened:** After fixing Lombok, the app compiled but crashed at startup.

**Error:**
```
org.springframework.beans.factory.BeanDefinitionStoreException:
Failed to parse configuration class [com.banking.studentbank.StudentBankApplication];
nested exception is java.lang.IllegalArgumentException:
ASM ClassReader failed to parse class file - probably due to a new Java class file version that isn't supported yet
```

**Root Cause:**
Spring Boot 3.2.5 uses ASM 9.6 which cannot read Java 24 class file format (major version 68).
The JDK 24 compiler produces class files that Spring's component scanner cannot parse.

**Fix:**
Add `<release>17</release>` in maven-compiler-plugin to cross-compile to Java 17 bytecode.
JDK 24 supports `--release 17` so this compiles with JDK 24 but produces Java 17-compatible `.class` files:
```xml
<configuration>
    <release>17</release>
</configuration>
```

**Note:** Do NOT write `<!-- JDK 24 supports --release 17 -->` as an XML comment — the `--` inside XML comments is illegal and breaks parsing.

---

## Issue 3: Mockito Cannot Mock Interfaces on Java 24

**When it happened:** Running unit tests (`mvn test`).

**Error:**
```
org.mockito.exceptions.base.MockitoException:
Cannot mock/spy class com.banking.studentbank.repository.BankAccountRepository
Mockito cannot mock this class: interface BankAccountRepository
...
Could not initialize plugin: interface org.mockito.plugins.MockMaker
```

**Root Cause:**
Mockito's default `inline` mock maker uses ByteBuddy's byte manipulation which fails on Java 24's
restricted internal API access. Interface mocking especially breaks.

**Fix:**
Create the file `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` with content:
```
mock-maker-subclass
```
This tells Mockito to use the subclass (proxy-based) mock maker instead of the inline one,
which is compatible with Java 24.

---

## Issue 4: Jacoco `@{argLine}` Override — Tests Skip Coverage

**When it happened:** `mvn test` ran but Jacoco reported 0% coverage.

**Error:**
```
[WARNING] Jacoco could not be applied...
argLine was overridden, Jacoco agent not active
```

**Root Cause:**
When both Jacoco's `prepare-agent` goal and Surefire's `<argLine>` are configured, Surefire's
static `${argLine}` overwrites Jacoco's dynamically injected agent argument.

**Fix:**
Use `@{argLine}` (late binding) instead of `${argLine}` in Surefire configuration:
```xml
<argLine>
    @{argLine}
    -javaagent:${settings.localRepository}/org/mockito/mockito-core/5.20.0/mockito-core-5.20.0.jar
    -XX:+EnableDynamicAgentLoading
    --add-opens java.base/java.lang=ALL-UNNAMED
    --add-opens java.base/java.util=ALL-UNNAMED
    -Djdk.attach.allowAttachSelf=true
    -Dspring.classformat.ignore=true
</argLine>
```
`@{argLine}` is resolved at test execution time after Jacoco has set the property.

---

## Issue 5: `@SpringBootTest` Cannot Find `@SpringBootConfiguration`

**When it happened:** Running integration tests (AccountControllerTest, AuthControllerTest).

**Error:**
```
java.lang.IllegalStateException:
Unable to find a @SpringBootConfiguration, you need to use
@ContextConfiguration or @SpringBootTest(classes=...) with your test
```

**Root Cause:**
The integration test class was in a different package structure, so Spring's test scanner
couldn't auto-discover the `@SpringBootApplication` main class.

**Fix:**
Explicitly specify the application class in `@SpringBootTest`:
```java
@SpringBootTest(classes = StudentBankApplication.class)
@AutoConfigureMockMvc
class AccountControllerTest { ... }
```

---

## Issue 6: MySQL Access Denied

**When it happened:** Starting the app for the first time with a database.

**Error:**
```
java.sql.SQLException: Access denied for user 'root'@'localhost' (using password: YES)
```

**Root Cause:**
`application.properties` had `spring.datasource.password=root` but the actual MySQL root password
on this machine is `Amol0410@@@`.

**Fix:**
Update `src/main/resources/application.properties`:
```properties
spring.datasource.password=Amol0410@@@
```

---

## Issue 7: MySQL Communications Link Failure

**When it happened:** App failed to connect to MySQL even with correct password.

**Error:**
```
com.mysql.cj.jdbc.exceptions.CommunicationsException:
Communications link failure
The last packet sent successfully to the server was 0 milliseconds ago.
The driver has not received any packets from the server.
```

**Root Cause:**
MySQL service was not running on Windows.

**Fix:**
Start MySQL via Windows Services or command line:
```
# Option 1: Windows Services (services.msc) → MySQL → Start
# Option 2: Command line (as Administrator)
net start MySQL80
```

---

## Issue 8: 403 Forbidden on All API Calls

**When it happened:** After successfully logging in, all API calls returned 403.

**Error:**
```json
{"status": 403, "error": "Forbidden"}
```

**Root Cause:**
The JWT token had expired (24h expiry). The token from a previous session was being reused.

**Fix:**
Re-login to get a fresh token:
```
POST /auth/login → copy new "token" → use in Authorization: Bearer <token>
```

---

## Issue 9: `RefreshToken` Duplicate Key Error on Login

**When it happened:** Calling `/auth/login` a second time for the same user.

**Error:**
```
org.springframework.dao.DataIntegrityViolationException:
could not execute statement; SQL [n/a]; constraint [UK_refresh_token_user];
nested exception is org.hibernate.exception.ConstraintViolationException
```

**Root Cause:**
The `RefreshToken` entity had a `@OneToOne(user)` with a unique constraint. On second login,
the old token wasn't deleted before saving the new one, causing a duplicate key violation.

**Fix:**
Add `@Modifying @Transactional @Query` on `deleteByUser()` in `RefreshTokenRepository`:
```java
@Modifying
@Transactional
@Query("DELETE FROM RefreshToken r WHERE r.user = :user")
void deleteByUser(@Param("user") User user);
```
Call `deleteByUser()` before `save()` in `AuthService.login()` and `register()`.

---

## Issue 10: XML Comment with `--` Breaks pom.xml

**When it happened:** After adding a comment inside a Maven plugin config.

**Error:**
```
[ERROR] Non-parseable POM: XML document structures must start and end within the same entity.
```

**Root Cause:**
XML specification forbids `--` inside comments. The comment `<!-- JDK 24 supports --release 17 -->`
contains `--` which is invalid XML.

**Fix:**
Remove or rewrite the comment without double dashes:
```xml
<!-- Cross-compile to Java 17 bytecode for Spring Boot 3.2.x ASM compatibility -->
<release>17</release>
```

---

## Issue 11: Integration Tests Context Fails — `JavaMailSender` Bean Missing

**When it happened:** Running `AuthControllerTest` and `AccountControllerTest` with `@SpringBootTest`.

**Error:**
```
Caused by: org.springframework.beans.factory.UnsatisfiedDependencyException:
Error creating bean with name 'emailService':
Unsatisfied dependency through constructor parameter 0:
No qualifying bean of type 'org.springframework.mail.javamail.JavaMailSender' available
```

**Root Cause:**
`EmailService` depends on `JavaMailSender`. The test `application.properties` had no mail config,
so Spring couldn't create the `JavaMailSender` bean in the test context.

**Fix:**
Add dummy mail properties to `src/test/resources/application.properties`:
```properties
app.mail.enabled=false
spring.mail.host=localhost
spring.mail.port=25
spring.mail.username=test@test.com
spring.mail.password=test
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false
```
With `app.mail.enabled=false`, no actual emails are sent, but the bean is created successfully.

---

## Issue 12: `AuthServiceTest` — `NullPointerException` on `refreshTokenService`

**When it happened:** Running `AuthServiceTest` after adding Group 3 features (Refresh Token).

**Error:**
```
java.lang.NullPointerException:
Cannot invoke "com.banking.studentbank.service.RefreshTokenService.createRefreshToken(String)"
because "this.refreshTokenService" is null
```

**Root Cause:**
`AuthService` got three new dependencies in Group 3: `RefreshTokenService`, `EmailService`,
`AuditLogService`. The unit test used `@InjectMocks` but was missing `@Mock` annotations for
these new dependencies, so Mockito left them as `null`.

**Fix:**
Add `@Mock` annotations in `AuthServiceTest`:
```java
@Mock
private RefreshTokenService refreshTokenService;

@Mock
private EmailService emailService;

@Mock
private AuditLogService auditLogService;
```
Also stub `refreshTokenService.createRefreshToken()` in each test that calls `register()` or `login()`:
```java
when(refreshTokenService.createRefreshToken(anyString())).thenReturn(mockRefreshToken());
```

---

## Issue 13: `AccountServiceTest` — `NullPointerException` on `getTodayWithdrawalTotal`

**When it happened:** Running `AccountServiceTest` after adding Group 2 daily withdrawal limit.

**Error:**
```
java.lang.NullPointerException:
Cannot invoke "java.math.BigDecimal.add(java.math.BigDecimal)"
because "todayTotal" is null
```

**Root Cause:**
The `withdraw()` method now calls `transactionService.getTodayWithdrawalTotal(account)` for
the daily limit check. The existing unit test didn't stub this method, so it returned `null`,
causing NPE when the service tried to call `.add()` on it.

**Fix:**
Add the stub in the withdraw test:
```java
when(transactionService.getTodayWithdrawalTotal(any(BankAccount.class)))
    .thenReturn(BigDecimal.ZERO);
```

---

## Issue 14: Rate Limiting Filter — `IllegalArgumentException` in Test Context

**When it happened:** Adding `RateLimitingFilter` to `SecurityConfig` for Group 4.

**Error:**
```
Caused by: java.lang.IllegalArgumentException:
The Filter class com.banking.studentbank.security.JwtAuthenticationFilter
does not have a registered order and cannot be added using addFilterBefore/After
```

**Root Cause:**
Used `.addFilterBefore(rateLimitingFilter, JwtAuthenticationFilter.class)`.
`JwtAuthenticationFilter` is a `@Component` (not a Spring Security built-in filter),
so it has no registered order in Spring Security's filter order registry.
The API `addFilterBefore(filter, Class)` only works when the reference class is a known
Spring Security filter with a pre-registered order.

**Fix:**
Use a standard Spring Security filter (`UsernamePasswordAuthenticationFilter`) as the position reference:
```java
.addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```
Since both are added `before` the same reference, they run before `UsernamePasswordAuthenticationFilter`
in the order they were registered. `RateLimitingFilter` is registered first so it runs first.

---

## Issue 15: Jacoco 0.8.11 / 0.8.12 — `Unsupported class file major version 68`

**When it happened:** Running integration tests with Jacoco coverage enabled on JDK 24.

**Error:**
```
java.lang.instrument.IllegalClassFormatException:
Error while instrumenting sun/util/resources/cldr/provider/CLDRLocaleDataMetaInfo with JaCoCo
Caused by: java.lang.IllegalArgumentException: Unsupported class file major version 68
```

**Root Cause:**
Class file major version 68 = JDK 24. Jacoco 0.8.11 and 0.8.12 do not support instrumenting
JDK 24 internal classes (like CLDR providers, JShell classes, etc.) that are loaded during
Spring Boot test context initialization. This caused the entire application context to fail.

**Fix:**
Upgrade Jacoco to `0.8.13` which added support for Java 24 class file format:
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.13</version>
    ...
</plugin>
```

---

## Summary Table

| # | Issue | Symptom | Fix |
|---|-------|---------|-----|
| 1 | Lombok + Java 24 | `TypeTag::UNKNOWN` compile error | Lombok 1.18.38 + `-proc:full` |
| 2 | ASM + Java 24 class files | `BeanDefinitionStoreException` at startup | `<release>17</release>` cross-compile |
| 3 | Mockito interface mocking | `Cannot mock interface` | `mock-maker-subclass` plugin file |
| 4 | Jacoco argLine override | 0% test coverage | `@{argLine}` late binding in Surefire |
| 5 | `@SpringBootTest` config not found | `Unable to find @SpringBootConfiguration` | `@SpringBootTest(classes = StudentBankApplication.class)` |
| 6 | MySQL wrong password | `Access denied` | Correct password in `application.properties` |
| 7 | MySQL not running | `Communications link failure` | Start MySQL service |
| 8 | Expired JWT token | `403 Forbidden` | Re-login to get fresh token |
| 9 | RefreshToken duplicate key | `ConstraintViolationException` | `@Modifying @Transactional @Query` delete before save |
| 10 | `--` in XML comment | pom.xml parse failure | Remove double-dash from XML comments |
| 11 | `JavaMailSender` missing in tests | `UnsatisfiedDependencyException` | Add dummy mail config to test properties |
| 12 | Missing `@Mock` in AuthServiceTest | `NullPointerException` on refreshTokenService | Add `@Mock` for all new service dependencies |
| 13 | Missing stub in AccountServiceTest | `NullPointerException` on `getTodayWithdrawalTotal` | Stub `getTodayWithdrawalTotal` to return `BigDecimal.ZERO` |
| 14 | Rate limit filter order | `IllegalArgumentException: no registered order` | Use `UsernamePasswordAuthenticationFilter.class` as reference |
| 15 | Jacoco + JDK 24 instrumentation | Integration test context crash | Upgrade Jacoco to 0.8.13 |
