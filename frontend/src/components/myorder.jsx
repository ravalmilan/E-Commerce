import React, { useEffect, useState } from "react";
import Navbar from "./navbar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getStepIndex = (status) => {
  switch (status) {
    case "Pending":
      return 0;
    case "Accepted":
      return 0; // Confirmed
    case "Assigned":
      return 1; // Assigned ✅ (FIXED)
    case "Shipped":
      return 2;
    case "Out of Delivery":
    case "OutForDelivery":
    case "Out for Delivery":
      return 2;
    case "Delivered":
      return 3;
    case "Cancelled":
    case "Rejected":
      return -1;
    default:
      return 0;
  }
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnPolicy, setReturnPolicy] = useState({ returnDays: 7 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/myorders", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          const valid = data.filter((o) => o.productId);
          valid.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(valid);
        } else {
          toast.error("Failed to load orders");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    const fetchReturnPolicy = async () => {
      try {
        const res = await fetch("/api/return-policy");
        const data = await res.json();
        if (res.ok) setReturnPolicy(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchOrders();
    fetchReturnPolicy();
  }, []);

  const canReturnOrder = (o) => {
    if (!o) return false;
    if (o.status !== "Delivered") return false;
    if (o.returnStatus && o.returnStatus !== "None") return false;
    if (!o.deliveredDate) return false;

    const days = Math.floor(
      (Date.now() - new Date(o.deliveredDate)) / (1000 * 60 * 60 * 24),
    );
    return days <= returnPolicy.returnDays;
  };

  const getDaysRemaining = (o) => {
    if (!o?.deliveredDate) return 0;
    const days = Math.floor(
      (Date.now() - new Date(o.deliveredDate)) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, returnPolicy.returnDays - days);
  };

  const downloadInvoice = async (order) => {
    try {
      const res = await fetch(`/api/orders/${order._id}/invoice`, {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Failed to download invoice");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      toast.error("Error downloading invoice");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="h-screen flex items-center justify-center">
          Loading orders…
        </div>
      </>
    );
  }

  const stepIndex = selectedOrder ? getStepIndex(selectedOrder.status) : -1;

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen pt-28 p-8 transition-colors duration-300
        bg-slate-50 dark:bg-gray-950"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">My Orders</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-gray-200 hover:-translate-y-2"
              >
                {/* Image Section */}
                <div className="relative overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${order.productId.image}`}
                    alt={order.productId.name}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Status Badge */}
                  <div
                    className={`absolute top-4 right-4 px-4 py-1.5 text-xs font-semibold rounded-full shadow-lg backdrop-blur
                    ${
                      order.status === "Delivered"
                        ? "bg-green-500/90 text-white"
                        : order.status === "Cancelled"
                          ? "bg-red-500/90 text-white"
                          : "bg-yellow-500/90 text-white"
                    }`}
                  >
                    {order.status}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {order.productId.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    ₹{order.productId.price} × {order.quantity}
                  </p>

                  <p className="text-lg font-bold text-indigo-600">
                    Total ₹{(order.productId.price * order.quantity).toFixed(2)}
                  </p>

                  <p className="text-xs text-gray-400">
                    Order ID: {order._id.slice(-6).toUpperCase()}
                  </p>

                  <p className="text-xs text-gray-500">
                    Ordered on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-5xl w-full rounded-3xl shadow-2xl overflow-hidden animate-fadeIn relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-6 text-gray-400 hover:text-red-500 text-2xl font-bold transition"
            >
              ✕
            </button>

            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* LEFT SIDE - PRODUCT IMAGE + RETURN BUTTON BELOW */}
              <div className="space-y-4">
                {selectedOrder.productId?.image && (
                  <img
                    src={`data:image/jpeg;base64,${selectedOrder.productId.image}`}
                    alt=""
                    className="w-full h-96 object-cover rounded-2xl shadow-md"
                  />
                )}

                {/* ✅ RETURN BUTTON BELOW IMAGE (same place as your blank space) */}
                {selectedOrder.status === "Delivered" && (
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <h4 className="font-semibold text-indigo-700 mb-2">
                      ↩ Return
                    </h4>

                    {!selectedOrder.returnStatus ||
                    selectedOrder.returnStatus === "None" ? (
                      canReturnOrder(selectedOrder) ? (
                        <button
                          onClick={() => {
                            // ⚠️ IMPORTANT:
                            // App.jsx route should be:  <Route path="/return-order/:orderId" element={<ReturnOrder />} />
                            navigate(`/return-order/${selectedOrder._id}`);
                          }}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-semibold transition-all"
                        >
                          Return Order ({getDaysRemaining(selectedOrder)} days
                          left)
                        </button>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Return window closed or not eligible.
                        </p>
                      )
                    ) : (
                      <div className="space-y-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold inline-block
                          ${
                            selectedOrder.returnStatus === "Requested"
                              ? "bg-orange-100 text-orange-700"
                              : selectedOrder.returnStatus === "Approved"
                                ? "bg-blue-100 text-blue-700"
                                : selectedOrder.returnStatus === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                          }`}
                        >
                          {selectedOrder.returnStatus}
                        </span>

                        {selectedOrder.returnReason && (
                          <p className="text-xs bg-white p-2 rounded">
                            {selectedOrder.returnReason}
                          </p>
                        )}

                        {selectedOrder.returnStatus === "Completed" &&
                          selectedOrder.paymentStatus === "Refunded" && (
                            <div className="bg-green-100 border border-green-300 p-2 rounded text-green-700 font-semibold text-xs">
                              💰 Refund processed successfully.
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE - DETAILS */}
              <div className="space-y-4 text-sm">
                <h2 className="text-3xl font-bold text-gray-800">
                  {selectedOrder.productId?.name}
                </h2>

                <div className="text-lg font-semibold text-indigo-600">
                  ₹
                  {(
                    selectedOrder.productId.price * selectedOrder.quantity
                  ).toFixed(2)}
                </div>

                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      selectedOrder.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : selectedOrder.status === "Cancelled" ||
                            selectedOrder.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : selectedOrder.status === "Assigned"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                {/* PAYMENT INFO */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-semibold text-gray-700">
                    Payment Details
                  </h4>

                  <p>
                    <strong>Type:</strong> {selectedOrder.paymentType}
                  </p>

                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold
                    ${
                      selectedOrder.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : selectedOrder.paymentStatus === "Refunded"
                          ? "bg-blue-100 text-blue-700"
                          : selectedOrder.paymentStatus === "Failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedOrder.paymentStatus}
                  </span>

                  {selectedOrder.paymentId && (
                    <p className="text-xs text-gray-500">
                      Payment ID: {selectedOrder.paymentId}
                    </p>
                  )}
                </div>

                {/* DELIVERY INFO */}
                {selectedOrder.deliveryPartnerName && (
                  <div className="bg-blue-50 p-4 rounded-xl space-y-1">
                    <h4 className="font-semibold text-blue-700">
                      🚚 Delivery Details
                    </h4>
                    <p>Partner: {selectedOrder.deliveryPartnerName}</p>
                    <p>Phone: {selectedOrder.deliveryPartnerPhone}</p>
                    {selectedOrder.trackingId && (
                      <p className="text-xs text-gray-600">
                        Tracking ID: {selectedOrder.trackingId}
                      </p>
                    )}
                  </div>
                )}

                {/* TRACKING SECTION */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Order Progress</h4>

                  {selectedOrder.status === "Cancelled" ||
                  selectedOrder.status === "Rejected" ? (
                    <div className="relative mt-8">
                      <div className="absolute top-6 left-0 w-full h-1 bg-red-500 rounded"></div>

                      <div className="flex justify-center relative z-10">
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 text-white text-2xl font-bold shadow-lg border-4 border-white">
                            ✕
                          </div>

                          <p className="text-sm mt-3 text-red-600 font-semibold">
                            {selectedOrder.status === "Cancelled"
                              ? "Order Cancelled"
                              : "Order Rejected"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute top-4 left-0 w-full h-1 bg-gray-300 rounded"></div>

                      <div
                        className="absolute top-4 left-0 h-1 bg-green-500 rounded transition-all duration-500"
                        style={{
                          width:
                            stepIndex === -1
                              ? "0%"
                              : (stepIndex / 3) * 100 + "%",
                        }}
                      ></div>

                      <div className="flex justify-between relative z-10">
                        {["Confirmed", "Assigned", "Out of Delivery", "Delivered"].map(
                          (step, index) => {
                            const done = index <= stepIndex;
                            return (
                              <div
                                key={index}
                                className="flex flex-col items-center w-1/4"
                              >
                                <div
                                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shadow
                                  ${
                                    done
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-300 text-gray-500"
                                  }`}
                                >
                                  {done ? "✓" : ""}
                                </div>
                                <p className="text-xs mt-2 text-center text-gray-600">
                                  {step}
                                </p>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* DOWNLOAD INVOICE BUTTON */}
                {selectedOrder.status === "Delivered" && (
                  <div className="pt-4">
                    <button
                      onClick={() => downloadInvoice(selectedOrder)}
                      className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-xl"
                    >
                      📄 Download Invoice
                    </button>
                  </div>
                )}

                <div className="text-xs text-gray-400 pt-4 border-t">
                  Ordered on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString(
                    "en-GB",
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default MyOrders;
