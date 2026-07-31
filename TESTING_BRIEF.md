# Acceptance brief

Treat the statements below as the intended product behavior. Build test cards
from these outcomes and test at desktop and mobile widths.

## Product catalog

1. Search is case-insensitive and matches any part of a product name.
2. Price sorting is numeric in both directions.
3. Adding a product increments that product and the cart badge.
4. The theme preference survives a reload.
5. Category filters show only matching products, combine with search and sort,
   and return to the complete catalog when All is selected.
6. Saving and unsaving a product updates its control and the Saved count.
   Activating Saved in the header toggles between all products and saved items.
7. Quick view opens the selected product's details, closes from its close
   control or backdrop, and adds the displayed product to the cart.
8. Delivery estimation rejects non-5-digit postal codes and returns a mock
   business-day estimate for both Standard and Express methods.
9. Comparison accepts up to three unique products, requires at least two before
   opening, displays matching category, price, and stock values, and supports
   removing individual products or clearing the selection.

## Cart and pricing

1. Quantity cannot be less than one. Decreasing from one removes the line.
2. Remove deletes the line whose button was selected.
3. `SAVE10` subtracts 10% of the merchandise subtotal.
4. Orders of $50 or more receive free shipping.
5. The displayed subtotal, discount, shipping, and total always agree.

## Checkout and orders

1. Name, valid email, address, city, postal code, and a 16-digit demo card are
   required.
2. One submit action creates exactly one order and is disabled while pending.
3. Cancelling an order affects the selected order only.
4. Cart and checkout dialogs close with Escape, keep keyboard focus inside, and
   return focus to their trigger.

## Responsive behavior

1. The storefront and both dialogs fit a 320px-wide viewport without horizontal
   scrolling.
2. Shop and Orders remain reachable on small screens.
