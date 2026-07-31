import { useState, type FormEvent } from "react";

export function DeliveryEstimator() {
  const [postalCode, setPostalCode] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [result, setResult] = useState("");

  function estimateDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = postalCode.trim();

    if (!/^\d{5}$/.test(normalizedCode)) {
      setResult("Enter a valid 5-digit postal code.");
      return;
    }

    const regionDays = Number(normalizedCode[0]) < 4 ? 2 : 4;
    const deliveryDays =
      deliveryMethod === "express" ? Math.max(regionDays - 1, 1) : regionDays;

    setResult(
      `${deliveryMethod === "express" ? "Express" : "Standard"} delivery is estimated in ${deliveryDays} business ${deliveryDays === 1 ? "day" : "days"}.`,
    );
  }

  return (
    <section className="deliveryEstimator" aria-labelledby="delivery-title">
      <div>
        <p className="eyebrow">Plan ahead</p>
        <h2 id="delivery-title">When will it arrive?</h2>
        <p>Check a mock delivery window before adding anything to your cart.</p>
      </div>
      <form onSubmit={estimateDelivery}>
        <label>
          <span>Postal code</span>
          <input
            inputMode="numeric"
            maxLength={5}
            placeholder="10001"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
          />
        </label>
        <label>
          <span>Delivery method</span>
          <select
            value={deliveryMethod}
            onChange={(event) => setDeliveryMethod(event.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </label>
        <button type="submit">Estimate delivery</button>
        {result && (
          <output className="deliveryResult" aria-live="polite">
            {result}
          </output>
        )}
      </form>
    </section>
  );
}

