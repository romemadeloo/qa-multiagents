# SAMPLE-101 (fictional example ticket)

**Title:** Footer newsletter signup shows a confirmation message

**Description**
Visitors can subscribe to the newsletter from the site footer. Today the form
submits silently, so users don't know if it worked.

**Acceptance criteria**
1. Entering a valid email and clicking **Subscribe** shows "Thanks! Check your inbox to confirm."
2. An invalid email (e.g. `abc@`) shows "Please enter a valid email address." and nothing is submitted.
3. An empty field disables the **Subscribe** button.
4. The message is announced to screen readers (`role="status"`).

**Figma:** none
**Server:** https://dev.example.test/ (storefront)
