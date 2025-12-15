def create_payment_intent(amount: float, currency: str = "usd"):
    # Integration with Stripe/MercadoPago
    print(f"Creating payment intent for {amount} {currency}")
    return {"id": "mock_intent_id", "client_secret": "mock_secret"}

def confirm_payment(payment_id: str):
    print(f"Confirming payment {payment_id}")
    return True
