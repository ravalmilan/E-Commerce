import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./Footer";
import FloatingCart from "./FloatingCart";
import {
  User,
  Phone,
  Home,
  Briefcase,
  Save,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    homeAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    workAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // ✅ COMPLETE Validation Errors State
  const [errors, setErrors] = useState({
    // 🔥 Basic Info
    name: "",
    email: "",
    mobile: "",

    // 🔥 Home Address
    homeAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },

    // 🔥 Work Address
    workAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });


  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          mobile: data.user.mobile || "",
          homeAddress: {
            street: data.user.homeAddress?.street || "",
            city: data.user.homeAddress?.city || "",
            state: data.user.homeAddress?.state || "",
            zipCode: data.user.homeAddress?.zipCode || "",
            country: data.user.homeAddress?.country || "",
          },
          workAddress: {
            street: data.user.workAddress?.street || "",
            city: data.user.workAddress?.city || "",
            state: data.user.workAddress?.state || "",
            zipCode: data.user.workAddress?.zipCode || "",
            country: data.user.workAddress?.country || "",
          },
        });
      } else {
        toast.error("Failed to load profile");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("homeAddress.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        homeAddress: {
          ...formData.homeAddress,
          [field]: value,
        },
      });
    } else if (name.startsWith("workAddress.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        workAddress: {
          ...formData.workAddress,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 pt-24 md:pt-28 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 pt-24 md:pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  Edit Profile
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your personal information and addresses
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
<div className="modern-card rounded-2xl p-6 space-y-4">
  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
    <User className="w-5 h-5 text-indigo-600" />
    Basic Information
  </h2>

  <div className="grid md:grid-cols-2 gap-4">

    {/* Full Name */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Full Name
      </label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={(e) => {
          const value = e.target.value;

          if (!/^[A-Za-z\s]*$/.test(value)) {
            setErrors(prev => ({ ...prev, name: "Name cannot contain numbers" }));
            return;
          }

          setErrors(prev => ({ ...prev, name: "" }));
          handleChange(e);
        }}
        className={`w-full px-4 py-3 rounded-xl outline-none ${
          errors.name
            ? "bg-red-50 border border-red-500"
            : "bg-gray-50 border border-gray-200"
        }`}
      />
      {errors.name && (
        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
      )}
    </div>

    {/* Email */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Email
      </label>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => {
          const value = e.target.value;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailRegex.test(value)) {
            setErrors(prev => ({ ...prev, email: "Invalid email format" }));
          } else {
            setErrors(prev => ({ ...prev, email: "" }));
          }

          setFormData(prev => ({ ...prev, email: value }));
        }}
        className={`w-full px-4 py-3 rounded-xl outline-none ${
          errors.email
            ? "bg-red-50 border border-red-500"
            : "bg-gray-50 border border-gray-200"
        }`}
      />
      {errors.email && (
        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
      )}
    </div>

    {/* Mobile */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <Phone className="w-4 h-4" />
        Mobile Number
      </label>
      <input
        type="tel"
        name="mobile"
        value={formData.mobile}
        maxLength={10}
        onChange={(e) => {
          const value = e.target.value;

          if (!/^\d*$/.test(value)) {
            setErrors(prev => ({ ...prev, mobile: "Only numbers allowed" }));
            return;
          }

          if (value.length !== 10 && value.length !== 0) {
            setErrors(prev => ({ ...prev, mobile: "Mobile must be 10 digits" }));
          } else {
            setErrors(prev => ({ ...prev, mobile: "" }));
          }

          handleChange(e);
        }}
        placeholder="1234567890"
        className={`w-full px-4 py-3 rounded-xl outline-none ${
          errors.mobile
            ? "bg-red-50 border border-red-500"
            : "bg-gray-50 border border-gray-200"
        }`}
      />
      {errors.mobile && (
        <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
      )}
    </div>

  </div>
</div>


            {/* Home Address */}
            <div className="modern-card rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-600" />
                Home Address
              </h2>

              <div className="space-y-4">
                {/* Street */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="homeAddress.street"
                    value={formData.homeAddress.street}
                    onChange={(e) => {
                      handleChange(e);
                      if (!e.target.value.trim()) {
                        setErrors((prev) => ({
                          ...prev,
                          homeAddress: {
                            ...prev.homeAddress,
                            street: "Street is required",
                          },
                        }));
                      } else {
                        setErrors((prev) => ({
                          ...prev,
                          homeAddress: { ...prev.homeAddress, street: "" },
                        }));
                      }
                    }}
                    placeholder="123 Main Street"
                    className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                      errors.homeAddress.street
                        ? "bg-red-50 border border-red-500"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  />
                  {errors.homeAddress.street && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.homeAddress.street}
                    </p>
                  )}
                </div>

                {/* City + State */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="homeAddress.city"
                      value={formData.homeAddress.city}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z\s]*$/.test(value)) {
                          handleChange(e);
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: { ...prev.homeAddress, city: "" },
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: {
                              ...prev.homeAddress,
                              city: "City cannot contain numbers",
                            },
                          }));
                        }
                      }}
                      placeholder="City"
                      className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                        errors.homeAddress.city
                          ? "bg-red-50 border border-red-500"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    />
                    {errors.homeAddress.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.homeAddress.city}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="homeAddress.state"
                      value={formData.homeAddress.state}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z\s]*$/.test(value)) {
                          handleChange(e);
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: { ...prev.homeAddress, state: "" },
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: {
                              ...prev.homeAddress,
                              state: "State cannot contain numbers",
                            },
                          }));
                        }
                      }}
                      placeholder="State"
                      className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                        errors.homeAddress.state
                          ? "bg-red-50 border border-red-500"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    />
                    {errors.homeAddress.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.homeAddress.state}
                      </p>
                    )}
                  </div>
                </div>

                {/* ZIP + Country */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* ZIP */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="homeAddress.zipCode"
                      value={formData.homeAddress.zipCode}
                      maxLength={6}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          handleChange(e);
                          if (value.length === 6) {
                            setErrors((prev) => ({
                              ...prev,
                              homeAddress: { ...prev.homeAddress, zipCode: "" },
                            }));
                          }
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: {
                              ...prev.homeAddress,
                              zipCode: "Only numbers allowed",
                            },
                          }));
                        }
                      }}
                      placeholder="123456"
                      className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                        errors.homeAddress.zipCode
                          ? "bg-red-50 border border-red-500"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    />
                    {errors.homeAddress.zipCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.homeAddress.zipCode}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="homeAddress.country"
                      value={formData.homeAddress.country}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[A-Za-z\s]*$/.test(value)) {
                          handleChange(e);
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: { ...prev.homeAddress, country: "" },
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            homeAddress: {
                              ...prev.homeAddress,
                              country: "Country cannot contain numbers",
                            },
                          }));
                        }
                      }}
                      placeholder="Country"
                      className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                        errors.homeAddress.country
                          ? "bg-red-50 border border-red-500"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    />
                    {errors.homeAddress.country && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.homeAddress.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Work Address */}
<div className="modern-card rounded-2xl p-6 space-y-4">
  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
    <Briefcase className="w-5 h-5 text-indigo-600" />
    Work Address
  </h2>

  <div className="space-y-4">

    {/* Street */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Street Address
      </label>
      <input
        type="text"
        name="workAddress.street"
        value={formData.workAddress.street}
        onChange={(e) => {
          handleChange(e);
          if (!e.target.value.trim()) {
            setErrors(prev => ({
              ...prev,
              workAddress: { ...prev.workAddress, street: "Street is required" }
            }));
          } else {
            setErrors(prev => ({
              ...prev,
              workAddress: { ...prev.workAddress, street: "" }
            }));
          }
        }}
        placeholder="456 Business Avenue"
        className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
          errors.workAddress.street
            ? "bg-red-50 border border-red-500"
            : "bg-gray-50 border border-gray-200"
        }`}
      />
      {errors.workAddress.street && (
        <p className="text-red-500 text-sm mt-1">
          {errors.workAddress.street}
        </p>
      )}
    </div>

    {/* City + State */}
    <div className="grid md:grid-cols-2 gap-4">

      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          City
        </label>
        <input
          type="text"
          name="workAddress.city"
          value={formData.workAddress.city}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[A-Za-z\s]*$/.test(value)) {
              handleChange(e);
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, city: "" }
              }));
            } else {
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, city: "City cannot contain numbers" }
              }));
            }
          }}
          placeholder="City"
          className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
            errors.workAddress.city
              ? "bg-red-50 border border-red-500"
              : "bg-gray-50 border border-gray-200"
          }`}
        />
        {errors.workAddress.city && (
          <p className="text-red-500 text-sm mt-1">
            {errors.workAddress.city}
          </p>
        )}
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          State
        </label>
        <input
          type="text"
          name="workAddress.state"
          value={formData.workAddress.state}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[A-Za-z\s]*$/.test(value)) {
              handleChange(e);
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, state: "" }
              }));
            } else {
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, state: "State cannot contain numbers" }
              }));
            }
          }}
          placeholder="State"
          className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
            errors.workAddress.state
              ? "bg-red-50 border border-red-500"
              : "bg-gray-50 border border-gray-200"
          }`}
        />
        {errors.workAddress.state && (
          <p className="text-red-500 text-sm mt-1">
            {errors.workAddress.state}
          </p>
        )}
      </div>
    </div>

    {/* ZIP + Country */}
    <div className="grid md:grid-cols-2 gap-4">

      {/* ZIP */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ZIP Code
        </label>
        <input
          type="text"
          name="workAddress.zipCode"
          value={formData.workAddress.zipCode}
          maxLength={6}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d*$/.test(value)) {
              handleChange(e);
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, zipCode: "" }
              }));
            } else {
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, zipCode: "Only numbers allowed" }
              }));
            }
          }}
          placeholder="123456"
          className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
            errors.workAddress.zipCode
              ? "bg-red-50 border border-red-500"
              : "bg-gray-50 border border-gray-200"
          }`}
        />
        {errors.workAddress.zipCode && (
          <p className="text-red-500 text-sm mt-1">
            {errors.workAddress.zipCode}
          </p>
        )}
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Country
        </label>
        <input
          type="text"
          name="workAddress.country"
          value={formData.workAddress.country}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[A-Za-z\s]*$/.test(value)) {
              handleChange(e);
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, country: "" }
              }));
            } else {
              setErrors(prev => ({
                ...prev,
                workAddress: { ...prev.workAddress, country: "Country cannot contain numbers" }
              }));
            }
          }}
          placeholder="Country"
          className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
            errors.workAddress.country
              ? "bg-red-50 border border-red-500"
              : "bg-gray-50 border border-gray-200"
          }`}
        />
        {errors.workAddress.country && (
          <p className="text-red-500 text-sm mt-1">
            {errors.workAddress.country}
          </p>
        )}
      </div>

    </div>
  </div>
</div>


            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-4 rounded-xl modern-button font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      <FloatingCart />
      <Footer />
    </>
  );
}
