<?php

include "database.php";


if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    die("Invalid request.");

}


/* =====================================================
   CUSTOMER INFORMATION
===================================================== */

$customer_name =
    trim($_POST["customer_name"] ?? "");


$email =
    trim($_POST["email"] ?? "");


$phone =
    trim($_POST["phone"] ?? "");


$address =
    trim($_POST["address"] ?? "");


$payment_method =
    trim($_POST["payment_method"] ?? "");


$cart_json =
    $_POST["cart"] ?? "";


if (
    empty($customer_name) ||
    empty($email) ||
    empty($phone) ||
    empty($address) ||
    empty($payment_method) ||
    empty($cart_json)
) {

    die(
        "Please complete all required fields."
    );

}


if (
    !filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    )
) {

    die(
        "Please enter a valid email address."
    );

}


/* =====================================================
   DECODE CART
===================================================== */

$cart =
    json_decode(
        $cart_json,
        true
    );


if (
    !is_array($cart) ||
    count($cart) === 0
) {

    die(
        "Your cart is empty."
    );

}


/* =====================================================
   CALCULATE TOTAL ON SERVER
===================================================== */

$total_amount = 0;

$items = [];


foreach ($cart as $item) {

    if (
        !isset(
            $item["name"],
            $item["price"],
            $item["quantity"]
        )
    ) {

        continue;

    }


    $name =
        trim($item["name"]);


    $price =
        (float)$item["price"];


    $quantity =
        (int)$item["quantity"];


    if (
        $name === "" ||
        $price < 0 ||
        $quantity <= 0
    ) {

        continue;

    }


    $item_total =
        $price * $quantity;


    $total_amount +=
        $item_total;


    $items[] = [

        "name" => $name,

        "price" => $price,

        "quantity" => $quantity,

        "total" => $item_total

    ];

}


if (
    count($items) === 0 ||
    $total_amount <= 0
) {

    die(
        "Invalid order."
    );

}


/* =====================================================
   CREATE ORDER NUMBER
===================================================== */

$order_number =
    "MC" .
    date("YmdHis") .
    rand(100, 999);


/* =====================================================
   CONVERT ITEMS TO JSON
===================================================== */

$items_json =
    json_encode(
        $items,
        JSON_UNESCAPED_UNICODE
    );


/* =====================================================
   PAYMENT STATUS
===================================================== */

if (
    $payment_method === "Cash on Delivery"
) {

    $payment_status = "Pending";

} else {

    /*
     * This is a demo checkout.
     * No real payment gateway is being used.
     */

    $payment_status = "Pending";

}


/* =====================================================
   INSERT ORDER
===================================================== */

$sql = "

    INSERT INTO orders

    (
        order_number,
        customer_name,
        email,
        phone,
        address,
        items,
        total_amount,
        payment_method,
        payment_status,
        order_status
    )

    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

";


$stmt =
    $conn->prepare($sql);


if (!$stmt) {

    die(
        "Database error: " .
        $conn->error
    );

}


$order_status =
    "New";


$stmt->bind_param(

    "ssssssdsss",

    $order_number,

    $customer_name,

    $email,

    $phone,

    $address,

    $items_json,

    $total_amount,

    $payment_method,

    $payment_status,

    $order_status

);


if (!$stmt->execute()) {

    die(
        "Order could not be saved."
    );

}


$stmt->close();

$conn->close();

?>

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

    <title>
        Order Confirmed - Musafir Café
    </title>

    <link rel="stylesheet" href="style.css">

</head>

<body>


    <div class="success-box">

        <h1>
            Order Placed Successfully
        </h1>

        <p>
            Thank you,
            <?php
            echo htmlspecialchars(
                $customer_name
            );
            ?>.
        </p>

        <div class="order-number">

            Order Number:
            <?php
            echo htmlspecialchars(
                $order_number
            );
            ?>

        </div>

        <p>

            Your order has been saved
            successfully.

        </p>

        <p>

            Payment Method:
            <strong>
                <?php
                echo htmlspecialchars(
                    $payment_method
                );
                ?>
            </strong>

        </p>

        <p>

            Total:
            <strong>
                ₹<?php
                echo number_format(
                    $total_amount,
                    2
                );
                ?>
            </strong>

        </p>

        <br>

        <a
            href="index.html"
            class="primary-btn">

            Back to Home

        </a>

    </div>


    <script>

        localStorage.removeItem(
            "musafirCart"
        );

    </script>

</body>

</html>
