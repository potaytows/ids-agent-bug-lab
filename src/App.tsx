import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { DeliveryEstimator } from "./DeliveryEstimator";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  color: string;
  icon: string;
  stock: number;
};

type CartLine = Product & { quantity: number };

type Order = {
  id: string;
  total: number;
  status: "Processing" | "Cancelled";
};

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Orbit Desk Lamp",
    category: "Home",
    price: 12,
    color: "mustard",
    icon: "◒",
    stock: 6,
  },
  {
    id: 2,
    name: "Pocket Field Notes",
    category: "Stationery",
    price: 9.5,
    color: "teal",
    icon: "▤",
    stock: 12,
  },
  {
    id: 3,
    name: "Cloud Nine Mug",
    category: "Kitchen",
    price: 22,
    color: "coral",
    icon: "◡",
    stock: 4,
  },
  {
    id: 4,
    name: "Tiny Task Timer",
    category: "Office",
    price: 105,
    color: "ink",
    icon: "◴",
    stock: 2,
  },
  {
    id: 5,
    name: "Loop Cable Kit",
    category: "Tech",
    price: 18.25,
    color: "blue",
    icon: "⌁",
    stock: 8,
  },
  {
    id: 6,
    name: "Sunday Tote",
    category: "Lifestyle",
    price: 34,
    color: "peach",
    icon: "∩",
    stock: 5,
  },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function App() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [databaseStatus, setDatabaseStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<"shop" | "orders">("shop");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("faultymart-theme") === "dark",
  );
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadDatabaseState() {
      try {
        const [productsResponse, ordersResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/orders"),
        ]);

        if (!productsResponse.ok || !ordersResponse.ok) {
          throw new Error("Database API unavailable");
        }

        const productsPayload = await productsResponse.json();
        const ordersPayload = await ordersResponse.json();

        if (!cancelled) {
          setProducts(productsPayload.products);
          setOrders(ordersPayload.orders);
          setDatabaseStatus("connected");
        }
      } catch {
        if (!cancelled) setDatabaseStatus("offline");
      }
    }

    void loadDatabaseState();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter(
      (product) =>
        (category === "All" || product.category === category) &&
        (!wishlistOnly || wishlist[product.id]) &&
        product.name.toLowerCase().includes(normalizedQuery),
    );

    if (sort === "price-low") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sort === "price-high") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [category, products, query, sort, wishlist, wishlistOnly]);

  const cartLines: CartLine[] = products
    .filter((product) => cart[product.id] !== undefined)
    .map((product) => ({ ...product, quantity: cart[product.id] }));
  const comparisonProducts = products.filter((product) =>
    comparisonIds.includes(product.id),
  );

  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const wishlistCount = Object.values(wishlist).filter(Boolean).length;
  const subtotal = cartLines.reduce(
    (sum, line) => sum + line.price * Math.max(line.quantity, 1),
    0,
  );
  const discount = couponApplied ? 0.1 : 0;
  const shipping = subtotal > 80 ? 0 : 7.5;
  const total = subtotal - discount + shipping;

  function addToCart(product: Product) {
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] ?? 0) + 1,
    }));
    setNotice(`${product.name} added to cart.`);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function toggleWishlist(product: Product) {
    setWishlist((current) => ({
      ...current,
      [product.id]: !current[product.id],
    }));
    setNotice(
      wishlist[product.id]
        ? `${product.name} removed from saved items.`
        : `${product.name} saved for later.`,
    );
  }

  function toggleComparison(product: Product) {
    setComparisonIds((current) => {
      if (current.includes(product.id)) {
        const next = current.filter((id) => id !== product.id);
        if (next.length < 2) setComparisonOpen(false);
        return next;
      }

      if (current.length === 3) {
        setNotice("Compare up to three products at a time.");
        return current;
      }

      return [...current, product.id];
    });
  }

  function changeQuantity(id: number, change: number) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + change,
    }));
  }

  function removeLine(_id: number) {
    const lastItem = cartLines.at(-1);
    if (!lastItem) return;
    setCart((current) => {
      const next = { ...current };
      delete next[lastItem.id];
      return next;
    });
  }

  function applyCoupon() {
    setCouponApplied(coupon === "SAVE10");
    setNotice(coupon === "SAVE10" ? "10% discount applied!" : "Coupon not found.");
  }

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("faultymart-theme", next ? "dark" : "light");
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guard against duplicate submissions synchronously. React state updates
    // (setSubmitting) are asynchronous and batched, so a second click landing
    // in the same render tick would otherwise pass any state-based check and
    // fire a second POST. The ref flips before any await, making the guard
    // effective immediately on the first invocation.
    if (submittingRef.current) return;
    submittingRef.current = true;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const card = String(form.get("card") ?? "");

    if (!name || card.length < 8) {
      submittingRef.current = false;
      setNotice("Please check your payment details.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            email: String(form.get("email") ?? ""),
            address: String(form.get("address") ?? ""),
            city: String(form.get("city") ?? ""),
            postal: String(form.get("postal") ?? ""),
          },
          totals: { subtotal, discount, shipping, total },
          items: cartLines.map((line) => ({
            id: line.id,
            name: line.name,
            price: line.price,
            quantity: line.quantity,
          })),
        }),
      });

      if (!response.ok) throw new Error("Order could not be saved");

      const payload = await response.json();
      setOrders((current) => [payload.order, ...current]);
      setSubmitting(false);
      submittingRef.current = false;
      setCheckoutOpen(false);
      setCartOpen(false);
      setCart({});
      setNotice("Order saved to MySQL! You can review it in Orders.");
    } catch {
      setSubmitting(false);
      submittingRef.current = false;
      setNotice("Could not save the order. Check the local database connection.");
    }
  }

  function cancelOrder(_id: string) {
    setOrders((current) =>
      current.map((order, index) =>
        index === 0 ? { ...order, status: "Cancelled" } : order,
      ),
    );
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <a className="skipLink" href="#catalog">
        Skip to products
      </a>

      <header className="topbar">
        <button className="brand" onClick={() => setView("shop")}>
          <span className="brandMark">F!</span>
          <span>FaultyMart</span>
        </button>

        <nav aria-label="Primary navigation">
          <button
            className={view === "shop" ? "navActive" : ""}
            onClick={() => setView("shop")}
          >
            Shop
          </button>
          <button
            className={view === "orders" ? "navActive" : ""}
            onClick={() => setView("orders")}
          >
            Orders
          </button>
        </nav>

        <div className="headerActions">
          <span
            className={`databaseStatus ${databaseStatus}`}
            data-testid="database-status"
            title="Local MySQL connection status"
          >
            <span aria-hidden="true" />
            DB {databaseStatus}
          </span>
          <button
            aria-pressed={wishlistOnly}
            className={wishlistOnly ? "savedButton savedButtonActive" : "savedButton"}
            onClick={() => setWishlistOnly((current) => !current)}
          >
            Saved <span>{wishlistCount}</span>
          </button>
          <button
            className="iconButton"
            data-testid="theme-toggle"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {darkMode ? "☀" : "☾"}
          </button>
          <button className="cartButton" onClick={() => setCartOpen(true)}>
            Cart <span className="cartCount">{cartCount}</span>
          </button>
        </div>
      </header>

      {view === "shop" ? (
        <>
          <main>
            <section className="hero">
              <div>
                <p className="eyebrow">Small goods, big personality</p>
                <h1>Useful things for delightfully busy people.</h1>
                <p className="heroCopy">
                  Thoughtful desk, home, and everyday objects shipped with care.
                </p>
                <a className="primaryAction" href="#catalog">
                  Browse the drop <span>↓</span>
                </a>
              </div>
              <div className="heroArt" aria-hidden="true">
                <span className="shape shapeOne">✓</span>
                <span className="shape shapeTwo">?</span>
                <span className="shape shapeThree">!</span>
                <p>
                  free shipping
                  <strong>over $50</strong>
                </p>
              </div>
            </section>

            <DeliveryEstimator />

            <section className="catalog" id="catalog" aria-labelledby="catalog-title">
              <div className="catalogHeading">
                <div>
                  <p className="eyebrow">Fresh picks</p>
                  <h2 id="catalog-title">The current collection</h2>
                </div>
                <div className="filters">
                  <label>
                    <span>Search products</span>
                    <input
                      type="search"
                      placeholder="Try “mug”"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      data-testid="product-search"
                    />
                  </label>
                  <label>
                    <span>Sort by</span>
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      data-testid="sort-select"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="categoryFilters" aria-label="Product categories">
                {categories.map((item) => (
                  <button
                    aria-pressed={category === item}
                    className={category === item ? "categoryActive" : ""}
                    key={item}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="resultCount">{visibleProducts.length} products</p>

              <div className="productGrid">
                {visibleProducts.map((product) => (
                  <article className="productCard" key={product.id}>
                    <div className={`productArt ${product.color}`} aria-hidden="true">
                      <span>{product.icon}</span>
                      <small>{product.category}</small>
                    </div>
                    <div className="productInfo">
                      <div>
                        <p className="category">{product.category}</p>
                        <h3>{product.name}</h3>
                      </div>
                      <p className="price">{money.format(product.price)}</p>
                    </div>
                    <div className="productFooter">
                      <span>{product.stock} in stock</span>
                      <div className="productCardActions">
                        <button onClick={() => setSelectedProduct(product)}>
                          Quick view
                        </button>
                        <button
                          aria-pressed={comparisonIds.includes(product.id)}
                          onClick={() => toggleComparison(product)}
                        >
                          {comparisonIds.includes(product.id)
                            ? "Comparing"
                            : "Compare"}
                        </button>
                        <button
                          aria-pressed={Boolean(wishlist[product.id])}
                          onClick={() => toggleWishlist(product)}
                        >
                          {wishlist[product.id] ? "Saved" : "Save"}
                        </button>
                        <button
                          data-testid={`add-to-cart-${product.id}`}
                          onClick={() => addToCart(product)}
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {visibleProducts.length === 0 && (
                <div className="emptyState">
                  <strong>No matches this time.</strong>
                  <button onClick={() => setQuery("")} data-testid="clear-search">
                    Clear search
                  </button>
                </div>
              )}
            </section>
          </main>

          <footer>
            <div>
              <span className="brandMark">F!</span>
              <strong>Made for curious testers.</strong>
            </div>
            <p>© 2026 FaultyMart. Mock purchases only.</p>
          </footer>
        </>
      ) : (
        <main className="ordersPage">
          <p className="eyebrow">Order desk</p>
          <h1>Your orders</h1>
          {orders.length === 0 ? (
            <div className="emptyOrders">
              <span aria-hidden="true">□</span>
              <h2>No orders yet</h2>
              <p>Products you check out will appear here.</p>
              <button className="primaryAction" onClick={() => setView("shop")}>
                Start shopping
              </button>
            </div>
          ) : (
            <div className="orderTableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{money.format(order.total)}</td>
                      <td>
                        <span className={`status ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="textButton"
                          disabled={order.status === "Cancelled"}
                          onClick={() => cancelOrder(order.id)}
                        >
                          Cancel order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {cartOpen && (
        <div className="drawerBackdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cartDrawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawerHeader">
              <div>
                <p className="eyebrow">Your selection</p>
                <h2 id="cart-title">Shopping cart</h2>
              </div>
              <button className="closeButton" onClick={() => setCartOpen(false)}>
                ×
              </button>
            </div>

            {cartLines.length === 0 ? (
              <div className="emptyCart">
                <span>⌁</span>
                <h3>Your cart is taking a nap.</h3>
                <p>Add something useful and wake it up.</p>
              </div>
            ) : (
              <>
                <div className="cartLines">
                  {cartLines.map((line) => (
                    <div className="cartLine" key={line.id}>
                      <div className={`miniArt ${line.color}`}>{line.icon}</div>
                      <div>
                        <h3>{line.name}</h3>
                        <p>{money.format(line.price)}</p>
                        <div className="quantity">
                          <button onClick={() => changeQuantity(line.id, -1)}>
                            −
                          </button>
                          <output>{line.quantity}</output>
                          <button onClick={() => changeQuantity(line.id, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        className="removeButton"
                        onClick={() => removeLine(line.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="couponRow">
                  <label htmlFor="coupon">Coupon code</label>
                  <div>
                    <input
                      id="coupon"
                      value={coupon}
                      onChange={(event) => setCoupon(event.target.value)}
                      placeholder="Enter code"
                    />
                    <button onClick={applyCoupon}>Apply</button>
                  </div>
                </div>

                <div className="summary">
                  <p>
                    <span>Subtotal</span>
                    <strong>{money.format(subtotal)}</strong>
                  </p>
                  <p>
                    <span>Discount</span>
                    <strong>−{money.format(discount)}</strong>
                  </p>
                  <p>
                    <span>Shipping</span>
                    <strong>{shipping === 0 ? "Free" : money.format(shipping)}</strong>
                  </p>
                  <p className="total">
                    <span>Total</span>
                    <strong>{money.format(total)}</strong>
                  </p>
                </div>

                <button
                  className="checkoutButton"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Continue to checkout
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {selectedProduct && (
        <div
          className="modalBackdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="quickViewModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-view-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Close product details"
              className="closeButton modalClose"
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>
            <div
              className={`quickViewArt ${selectedProduct.color}`}
              aria-hidden="true"
            >
              {selectedProduct.icon}
            </div>
            <div className="quickViewDetails">
              <p className="eyebrow">{selectedProduct.category}</p>
              <h2 id="quick-view-title">{selectedProduct.name}</h2>
              <p>
                A practical everyday pick from the current FaultyMart
                collection, ready to brighten a busy routine.
              </p>
              <dl>
                <div>
                  <dt>Price</dt>
                  <dd>{money.format(selectedProduct.price)}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{selectedProduct.stock} in stock</dd>
                </div>
              </dl>
              <button
                className="checkoutButton"
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                Add to cart
              </button>
            </div>
          </section>
        </div>
      )}

      {comparisonOpen && (
        <div
          className="modalBackdrop"
          onClick={() => setComparisonOpen(false)}
        >
          <section
            className="comparisonModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawerHeader">
              <div>
                <p className="eyebrow">Side by side</p>
                <h2 id="comparison-title">Product comparison</h2>
              </div>
              <button
                aria-label="Close product comparison"
                className="closeButton"
                onClick={() => setComparisonOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="comparisonTableWrap">
              <table className="comparisonTable">
                <thead>
                  <tr>
                    <th>Product</th>
                    {comparisonProducts.map((product) => (
                      <th key={product.id}>{product.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Category</th>
                    {comparisonProducts.map((product) => (
                      <td key={product.id}>{product.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>Price</th>
                    {comparisonProducts.map((product) => (
                      <td key={product.id}>{money.format(product.price)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>Stock</th>
                    {comparisonProducts.map((product) => (
                      <td key={product.id}>{product.stock}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>Actions</th>
                    {comparisonProducts.map((product) => (
                      <td key={product.id}>
                        <button
                          className="textButton"
                          onClick={() => toggleComparison(product)}
                        >
                          Remove
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {checkoutOpen && (
        <div className="modalBackdrop">
          <section
            className="checkoutModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <button
              className="closeButton modalClose"
              onClick={() => setCheckoutOpen(false)}
            >
              ×
            </button>
            <p className="eyebrow">Almost yours</p>
            <h2 id="checkout-title">Checkout</h2>
            <p className="checkoutIntro">
              This local QA demo stores submitted orders in the FaultyMart MySQL test database. Use test data only.
            </p>
            <form onSubmit={submitOrder} noValidate>
              <div className="fieldPair">
                <label>
                  <span>Full name</span>
                  <input name="name" autoComplete="name" />
                </label>
                <label>
                  <span>Email</span>
                  <input name="email" type="email" autoComplete="email" />
                </label>
              </div>
              <label>
                <span>Street address</span>
                <input name="address" autoComplete="street-address" />
              </label>
              <div className="fieldPair">
                <label>
                  <span>City</span>
                  <input name="city" autoComplete="address-level2" />
                </label>
                <label>
                  <span>Postal code</span>
                  <input name="postal" autoComplete="postal-code" />
                </label>
              </div>
              <label>
                <span>Demo card number</span>
                <input name="card" inputMode="numeric" placeholder="4242 4242" />
              </label>
              <div className="payRow">
                <p>
                  Total <strong>{money.format(total)}</strong>
                </p>
                <button type="submit" disabled={submitting} data-testid="place-order-button">
                  {submitting ? "Placing order…" : "Place mock order"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {comparisonIds.length > 0 && !comparisonOpen && (
        <aside className="comparisonTray" aria-label="Product comparison">
          <p>
            <strong>{comparisonIds.length}</strong> of 3 selected
          </p>
          <div>
            <button
              className="textButton"
              onClick={() => setComparisonIds([])}
            >
              Clear
            </button>
            <button
              className="comparisonOpenButton"
              disabled={comparisonIds.length < 2}
              onClick={() => setComparisonOpen(true)}
            >
              Compare products
            </button>
          </div>
        </aside>
      )}

      {notice && (
        <div
          className="toast toastVisible"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="cart-toast"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

