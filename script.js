// =====================================================
// MUSAFIR CAFÉ - MAIN JAVASCRIPT
// =====================================================

// ================= ORDER NOW =================

function goToMenu() {
    window.location.href = "menu.html";
}


// ================= CART DATA =================

let cart = JSON.parse(localStorage.getItem("musafirCart")) || [];


// ================= SAVE CART =================

function saveCart() {
    localStorage.setItem("musafirCart", JSON.stringify(cart));
    updateCartCount();
}


// ================= ADD COFFEE =================

function addCoffee(name, price) {

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: Number(price),
            quantity: 1
        });
    }

    saveCart();

    alert(name + " has been added to your cart.");
}


// ================= CART COUNT =================

function updateCartCount() {

    const cartCount = document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    let count = 0;

    cart.forEach(item => {
        count += Number(item.quantity);
    });

    cartCount.textContent = count;
}


// ================= OPEN CART =================

function openCart() {

    const modal = document.getElementById("cartModal");

    if (!modal) {
        window.location.href = "menu.html";
        return;
    }

    renderCart();

    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}


// ================= CLOSE CART =================

function closeCart() {

    const modal = document.getElementById("cartModal");

    if (modal) {
        modal.classList.remove("active");
    }

    document.body.style.overflow = "auto";
}


// ================= RENDER CART =================

function renderCart() {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems || !cartTotal) {
        return;
    }

    cartItems.innerHTML = "";

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                Your cart is empty.
                <br><br>
                Go to the menu and add some coffee.
            </div>
        `;

        cartTotal.textContent = "₹0";

        return;
    }

    let total = 0;

    cart.forEach((item, index) => {

        const itemTotal =
            Number(item.price) * Number(item.quantity);

        total += itemTotal;

        const div = document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `

            <div class="cart-item-info">

                <h3>${item.name}</h3>

                <p>
                    ₹${item.price} × ${item.quantity}
                </p>

            </div>


            <div class="quantity-controls">

                <button
                    type="button"
                    onclick="changeQuantity(${index}, -1)">
                    −
                </button>

                <span>
                    ${item.quantity}
                </span>

                <button
                    type="button"
                    onclick="changeQuantity(${index}, 1)">
                    +
                </button>

            </div>


            <strong>
                ₹${itemTotal}
            </strong>


            <button
                type="button"
                class="remove-btn"
                onclick="removeFromCart(${index})">

                Remove

            </button>

        `;

        cartItems.appendChild(div);

    });

    cartTotal.textContent = "₹" + total;
}


// ================= CHANGE QUANTITY =================

function changeQuantity(index, change) {

    if (!cart[index]) {
        return;
    }

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();

    renderCart();
}


// ================= REMOVE ITEM =================

function removeFromCart(index) {

    if (!cart[index]) {
        return;
    }

    cart.splice(index, 1);

    saveCart();

    renderCart();
}


// ================= CHECKOUT =================

function goToCheckout() {

    if (cart.length === 0) {

        alert("Your cart is empty. Please add a coffee first.");

        return;
    }

    window.location.href = "checkout.php";
}


// ================= CLOSE CART WHEN CLICKING OUTSIDE =================

document.addEventListener("click", function(event) {

    const modal = document.getElementById("cartModal");

    if (!modal) {
        return;
    }

    if (event.target === modal) {
        closeCart();
    }

});


// ================= INITIALIZE =================

document.addEventListener("DOMContentLoaded", function() {

    updateCartCount();

});
