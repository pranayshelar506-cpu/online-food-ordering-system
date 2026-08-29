<?php

include "database.php";


if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    die("Invalid request.");

}


$name =
    trim($_POST["name"] ?? "");


$email =
    trim($_POST["email"] ?? "");


$message =
    trim($_POST["message"] ?? "");


if (
    empty($name) ||
    empty($email) ||
    empty($message)
) {

    die("Please fill in all fields.");

}


if (
    !filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    )
) {

    die("Please enter a valid email address.");

}


$sql = "
    INSERT INTO contact_messages
    (name, email, message)
    VALUES (?, ?, ?)
";


$stmt =
    $conn->prepare($sql);


if (!$stmt) {

    die(
        "Database error: " .
        $conn->error
    );

}


$stmt->bind_param(
    "sss",
    $name,
    $email,
    $message
);


if ($stmt->execute()) {

    echo "

    <!DOCTYPE html>

    <html>

    <head>

        <title>Message Sent</title>

        <meta charset='UTF-8'>

        <style>

            body {
                font-family: Arial, sans-serif;
                background: #f7f2eb;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
            }

            .box {
                background: white;
                padding: 45px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 15px 40px rgba(0,0,0,.15);
            }

            h1 {
                color: #2d1b12;
            }

            p {
                color: #75675e;
            }

            a {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 25px;
                background: #c8894c;
                color: white;
                text-decoration: none;
                border-radius: 25px;
            }

        </style>

    </head>

    <body>

        <div class='box'>

            <h1>
                Message Sent Successfully
            </h1>

            <p>
                Thank you, " .
                htmlspecialchars($name) .
                ". We will get back to you soon.
            </p>

            <a href='about.html'>
                Back to About
            </a>

        </div>

    </body>

    </html>

    ";

} else {

    echo "Error saving message.";

}


$stmt->close();

$conn->close();

?>
