import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const TrackOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  const steps = ["Pending", "Accepted", "Assigned", "Delivered"];

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
      }
    };

    fetchOrder();
  }, [id]);

  if (!order) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  const currentStep = steps.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6">Track Order</h2>

      {/* Order Info */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold">
          {order.productId?.name}
        </h3>

        <p className="text-gray-600">
          Order ID: {order._id.slice(-8).toUpperCase()}
        </p>

        <p className="mt-2 font-bold text-indigo-600">
          Status: {order.status}
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-4">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white
                ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                    ? "bg-indigo-600"
                    : "bg-gray-300"
                }`}
            >
              {index < currentStep ? "✓" : ""}
            </div>

            <span
              className={`font-medium ${
                index <= currentStep
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackOrder;
