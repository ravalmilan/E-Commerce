import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./Footer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Checkout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentType, setPaymentType] = useState("Cash on Delivery"); // "Online" or "Cash on Delivery"
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // UPI, GPay, Card, QR, PhonePe, Paytm, Cash
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [form, setForm] = useState({
    addressLine: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  

  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await fetch("/api/get-cart", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          setCartItems(data.cart);
        } else {
          toast.error(data.message || "Failed to load cart");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.user) {
          // Pre-fill form with profile data
          if (data.user.mobile) {
            setForm(prev => ({ ...prev, phone: data.user.mobile }));
          }
          // Pre-fill with home address if available
          if (data.user.homeAddress && data.user.homeAddress.street) {
            setForm(prev => ({
              ...prev,
              addressLine: data.user.homeAddress.street || "",
              city: data.user.homeAddress.city || "",
              state: data.user.homeAddress.state || "",
              pincode: data.user.homeAddress.zipCode || "",
              area: data.user.homeAddress.city || "",
            }));
          }
        }
      } catch (err) {
        // Profile not loaded, user can fill manually
        console.log("Profile not loaded, user can fill manually");
      }
    };

    loadCart();
    loadProfile();
  }, []);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
  if (cartItems.length === 0) return "Your cart is empty";

  for (let item of cartItems) {
    if (item.quantity < 1) return "Invalid product quantity";
    if (item.quantity > 5) return "Maximum 5 quantity allowed per product";
    if (!item.price || item.price <= 0) return "Invalid product price";
  }

  if (!form.addressLine.trim()) return "Address is required";
  if (!form.area.trim()) return "Area is required"; 
  if (!form.city.trim()) return "City is required";
  if (!form.state.trim()) return "State is required";

  if (!/^\d{6}$/.test(form.pincode)) {
    return "Pincode must be 6 digits";
  }

  if (!/^\d{10}$/.test(form.phone)) {
    return "Mobile number must be 10 digits";
  }

  if (totalPrice <= 0 || isNaN(totalPrice)) {
    return "Invalid order amount";
  }

  return "";
};



  const handlePlaceOrder = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    // If online payment, show payment gateway first
    // if (paymentType === "Online") {
    //   setShowPaymentGateway(true);
    //   return;
    // }
    if (paymentType === "Online") {
  handlePayment(); // 🔥 DIRECT RAZORPAY
  return;
}


    // For Cash on Delivery, place order directly
    await placeOrder("Cash", "Cash on Delivery", "", false);
  };

  const handlePayment = async () => {
  try {
    setProcessingPayment(true);

    // ✅ 1) Get Razorpay Key from Backend
    const keyRes = await fetch("/api/payment/get-key", {
      method: "GET",
      credentials: "include",
    });

    const keyData = await keyRes.json();

    if (!keyRes.ok || !keyData.success || !keyData.key) {
      toast.error("Razorpay Key not received from backend ❌");
      setProcessingPayment(false);
      return;
    }

    // ✅ 2) Create Order from Backend
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: Math.round(totalPrice) }), // rupees
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      toast.error(data.message || "Failed to create Razorpay order ❌");
      setProcessingPayment(false);
      return;
    }

    const order = data.order;

    // ✅ 3) Open Razorpay Payment Window
    const options = {
      key: keyData.key, // ✅ backend se aaya key
      amount: order.amount,
      currency: order.currency,
      name: "ShopEase",
      description: "Order Payment",
      order_id: order.id,

      handler: async function (response) {
        try {
          // ✅ 4) Verify Payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            toast.error(verifyData.message || "Payment verification failed ❌");
            setProcessingPayment(false);
            return;
          }

          toast.success("Payment Successful ✅ Placing Order...");
          setShowPaymentGateway(false);

          // ✅ 5) Place Order after payment verified
          await placeOrder(
            "Razorpay",
            "Online",
            response.razorpay_payment_id,
            true
          );
        } catch (err) {
          console.log(err);
          toast.error("Order placing failed after payment ❌");
        } finally {
          setProcessingPayment(false);
        }
      },

      modal: {
        ondismiss: function () {
          toast.info("Payment cancelled");
          setProcessingPayment(false);
        },
      },

      theme: {
        color: "#2563eb",
      },
    };

    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded ❌");
      setProcessingPayment(false);
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.log(err);
    toast.error("Payment failed, try again ❌");
    setProcessingPayment(false);
  }
};



  const placeOrder = async (method, type, paymentId, verified) => {
    try {
      const orderPromises = cartItems.map((item) =>
        fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productId: item._id,
            quantity: item.quantity,
            size: item.size || "",
            deliveryPhone: form.phone,
            addressLine: form.addressLine,
            area: form.area,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            paymentType: type,
            paymentMethod: method,
            paymentId: paymentId,
            paymentAmount: totalPrice,
            paymentStatus: type === "Online" ? "Paid" : "Pending",
            paymentVerified: verified,
          }),
        })
      );

      const results = await Promise.all(orderPromises);
      const anyFailed = results.find((r) => !r.ok);
      if (anyFailed) {
        const data = await anyFailed.json().catch(() => ({}));
        toast.error(data.message || "Failed to place order");
        return;
      }

      await fetch("/api/clear-cart", {
        method: "POST",
        credentials: "include",
      });

      toast.success(`Order placed! Total: ₹${totalPrice.toFixed(2)}`);
      navigate("/myorders");
    } catch (e) {
      console.error(e);
      toast.error("Failed to place order");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 pt-24 md:pt-28">
          <div className="modern-card p-8 rounded-lg">Loading checkout...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-6 pt-24 md:pt-28">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 modern-card rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h1>

            <div className="space-y-6">
              {/* Address Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      name="addressLine"
                      value={form.addressLine}
                      onChange={onChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="House no, Street, Landmark"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      name="area"
                      value={form.area}
                      onChange={onChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Area / Locality"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={onChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      name="state"
                      value={form.state}
                      onChange={onChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={onChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Pincode"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Mobile Number"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h2>
                
                <div className="space-y-4">
                  {/* Payment Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentType"
                          value="Cash on Delivery"
                          checked={paymentType === "Cash on Delivery"}
                          onChange={(e) => {
                            setPaymentType(e.target.value);
                            setPaymentMethod("Cash");
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-700">Cash on Delivery</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentType"
                          value="Online"
                          checked={paymentType === "Online"}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-gray-700">Online Payment</span>
                      </label>
                    </div>
                  </div>

                  {/* Payment Method Selection (for Online) */}
                  
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="mt-6 w-full py-3 rounded-lg modern-button font-bold"
              disabled={cartItems.length === 0}
            >
              {paymentType === "Online" ? "Proceed to Payment" : "Place Order"}
            </button>
          </div>

          <div className="modern-card rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm text-gray-700">
                  <div className="max-w-[70%]">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-gray-600">
                      Qty: {item.quantity}
                      {item.size && <span className="ml-2">Size: {item.size}</span>}
                    </div>
                  </div>
                  <div className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between text-gray-900 font-bold">
              <span>Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>

            {paymentType === "Cash on Delivery" && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-600">Pay ₹{totalPrice.toFixed(2)} when your order is delivered</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}

      <Footer />
    </>
  );
}
