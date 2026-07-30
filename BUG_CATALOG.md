# Maintainer ground truth

> Spoiler warning: this file names the deliberately seeded defects. Give IDS
> Agent `TESTING_BRIEF.md` first if you want a blind run.

| ID | Area | Seeded defect |
| --- | --- | --- |
| FM-01 | Search | Matching is case-sensitive. |
| FM-02 | Sort | Prices are compared as formatted strings, not numbers. |
| FM-03 | Quantity | Decrement allows zero/negative values while totals still bill one unit. |
| FM-04 | Remove | Every Remove button deletes the final cart line. |
| FM-05 | Coupon | `SAVE10` subtracts $0.10 instead of 10%. |
| FM-06 | Shipping | Free shipping starts above $80 despite the $50 promise. |
| FM-07 | Checkout | Only name and a short card-length check are validated. |
| FM-08 | Checkout | Submit stays enabled; rapid submits can create duplicate orders. |
| FM-09 | Orders | Cancelling any order always cancels the first order. |
| FM-10 | Dialogs | Escape, focus trap, initial focus, and focus restoration are absent. |
| FM-11 | Theme | Preference is written to storage but never restored. |
| FM-12 | Mobile | Cart has a 680px minimum width and overflows narrow screens. |
| FM-13 | Mobile | Primary navigation is hidden, making Orders unreachable. |
| FM-14 | Feedback | Toast status is not announced to assistive technology. |

These bugs are intentionally limited to this mock-only application. There is no
backend, real authentication, payment processing, or user data.

