# SAMPLE-101-D1 Invalid email still sends subscribe request

Severity: Medium · Priority: High · Build: 2026.11.19-2 · Browser: Chromium

## Steps to reproduce

1. Open https://dev.example.test/ and scroll to the footer.
2. Type `abc@` in the newsletter field.
3. Click **Subscribe**.

## Expected

Validation message is shown and **no** request is sent (AC-02).

## Actual

Validation message is shown, but `POST /api/newsletter` is still sent (400 response).

## Evidence

evidence/R1/trace.zip (network tab shows the POST).
