<?php

$cart = isset($_GET["cart"]) ? $_GET["cart"] : "";

?>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

    <title>Musafir Café - Checkout</title>

    <link rel="stylesheet" href="style.css">

    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
        rel="stylesheet">

</head>

<body>

    <header>

        <nav class="navbar">

            <a href="index.html" class="logo">
                Musafir<span>Café</span>
            </a>

            <ul class="nav-links">

                <li>
                    <a href="index.html">Home</a>
                </li>

                <li>
                    <a href="menu.html">Menu</a>
                </li>

                <li>
                    <a href="about.html">About</a>
                </li>

            </ul>

        </nav>

    </header>


    <main class="checkout-page">

        <div class="section-heading">

            <p>
                MUSAFIR CAFÉ
            </p>

            <h2>
                Complete Your Order
            </h2>

            <span></span>

        </div>


        <div class="checkout-container">


            <!-- ================= CUSTOMER INFORMATION ================= -->

            <div class="checkout-box">

                <h2>
                    Customer Information
                </h2>

                <form
                    action="place_order.php"
                    method="POST"
                    class="checkout-form"
                    id="checkoutForm">

                    <input
                        type="hidden"
                        name="cart"
                        id="cartData">

                    <label>
                        Full Name
                    </label>

                    <input
                        type="text"
                        name="customer_name"
                        required
                        placeholder="Enter your name">


                    <label>
                        Email Address
                    </label>

                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="Enter your email">


                    <label>
                        Phone Number
                    </label>

                    <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+91 9876543210">


                    <label>
                        Delivery / Pickup Address
                    </label>

                    <textarea
                        name="address"
                        rows="4"
                        required
                        placeholder="Enter your address"></textarea>


                    <h2>
                        Payment Information
                    </h2>


                    <label class="payment-option">

                        <input
                            type="radio"
                            name="payment_method"
                            value="UPI"
                            required>

                        UPI

                    </label>


                    <label class="payment-option">

                        <input
                            type="radio"
                            name="payment_method"
                            value="Cash on Delivery">

                        Cash on Delivery

                    </label>


                    <label class="payment-option">

                        <input
                            type="radio"
                            name="payment_method"
                            value="Card">

                        Card Payment

                    </label>


                    <p style="font-size:12px;color:#75675e;line-height:1.6;">
                        For this café demo, complete card numbers and CVV
                        are not stored in the database.
                    </p>


                    <button
                        type="submit"
                        class="primary-btn full-btn">

                        Place Order

                    </button>

                </form>

            </div>


            <!-- ================= ORDER SUMMARY ================= -->

            <div class="checkout-box">

                <h2>
                    Your Order
                </h2>

                <div
                    id="checkoutItems"
                    class="order-summary">

                </div>

                <div class="summary-total">

                    <span>
                        Total
                    </span>

                    <span id="checkoutTotal">
                        ₹0
                    </span>

                </div>

            </div>

        </div>

    </main>


    <script>

        const cart =
            JSON.parse(
                localStorage.getItem("musafirCart")
            ) || [];

        const cartData =
            document.getElementById("cartData");

        const checkoutItems =
            document.getElementById("checkoutItems");

        const checkoutTotal =
            document.getElementById("checkoutTotal");


        cartData.value =
            JSON.stringify(cart);


        let total = 0;


        if (cart.length === 0) {

            checkoutItems.innerHTML =
                '<div class="empty-cart">Your cart is empty.</div>';

        } else {

            cart.forEach(item => {

                const itemTotal =
                    item.price * item.quantity;

                total += itemTotal;


                const div =
                    document.createElement("div");

                div.className =
                    "summary-item";

                div.innerHTML = `
                    <span>
                        ${item.name} × ${item.quantity}
                    </span>

                    <span>
                        ₹${itemTotal}
                    </span>
                `;

                checkoutItems.appendChild(div);

            });

        }


        checkoutTotal.textContent =
            "₹" + total;


        document
            .getElementById("checkoutForm")
            .addEventListener("submit", function(event) {

                if (cart.length === 0) {

                    event.preventDefault();

                    alert("Your cart is empty.");

                }

            });

    </script>

</body>

</html>
