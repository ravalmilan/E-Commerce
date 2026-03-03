import React, { useState } from "react";
import Navbar from "./navbar";
import Footer from "./Footer";
import FloatingCart from "./FloatingCart";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Validators (UI change nahi)
  const validators = {
    name: (val) => {
      const v = val.trim().replace(/\s+/g, " ");
      if (!v) return "Full Name is required";
      if (v.length < 2) return "Full Name must be at least 2 characters";
      if (v.length > 50) return "Full Name must be less than 50 characters";

      // only letters + spaces + . ' -
      const nameRegex = /^[A-Za-z]+(?:[A-Za-z\s.'-]*[A-Za-z])?$/;
      if (!nameRegex.test(v))
        return "Full Name should contain only alphabets (no numbers/special chars)";
      return "";
    },

    // ✅ Strong email validation (practical / industry-grade)
    email: (val) => {
      const v = val.trim();
      if (!v) return "Email is required";
      if (v.length > 254) return "Email is too long";
      if (/\s/.test(v)) return "Email should not contain spaces";

      // must contain exactly one @
      const parts = v.split("@");
      if (parts.length !== 2) return "Please enter a valid email address";

      const [local, domain] = parts;
      if (!local || !domain) return "Please enter a valid email address";

      // local part rules
      if (local.length > 64) return "Email local-part is too long";
      if (v.includes("..")) return "Email cannot contain consecutive dots (..)";
      if (local.startsWith(".") || local.endsWith("."))
        return "Email local-part cannot start/end with dot";

      // domain rules
      if (!domain.includes(".")) return "Email domain must contain a '.'";
      if (domain.length > 255) return "Email domain is too long";
      if (domain.includes("_")) return "Email domain cannot contain '_'";

      const labels = domain.split(".");
      if (labels.some((l) => l.length === 0))
        return "Email domain has invalid dots";

      const tld = labels[labels.length - 1];
      if (!/^[A-Za-z]{2,}$/.test(tld)) return "Email has invalid TLD";

      // allowed chars checks
      if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local))
        return "Email local-part contains invalid characters";

      if (!/^[A-Za-z0-9.-]+$/.test(domain))
        return "Email domain contains invalid characters";

      // each label checks
      for (const label of labels) {
        if (!/^[A-Za-z0-9-]+$/.test(label))
          return "Email domain label contains invalid characters";
        if (label.startsWith("-") || label.endsWith("-"))
          return "Email domain label cannot start/end with '-'";
        if (label.length > 63) return "Email domain label is too long";
      }

      return "";
    },

    phone: (val) => {
      const v = val.trim();
      if (!v) return ""; // optional
      if (!/^\d+$/.test(v)) return "Phone number should contain digits only";
      if (v.length !== 10) return "Phone number must be exactly 10 digits";
      return "";
    },

    subject: (val) => {
      const v = val.trim().replace(/\s+/g, " ");
      if (!v) return ""; // optional
      if (v.length < 3) return "Subject must be at least 3 characters";
      if (v.length > 80) return "Subject must be less than 80 characters";
      return "";
    },

    message: (val) => {
      const v = val.trim();
      if (!v) return "Message is required";
      if (v.length < 10) return "Message must be at least 10 characters";
      if (v.length > 500) return "Message must be less than 500 characters";
      return "";
    },
  };

  const validateForm = () => {
    const errors = [];

    const nameErr = validators.name(formData.name);
    if (nameErr) errors.push(nameErr);

    const emailErr = validators.email(formData.email);
    if (emailErr) errors.push(emailErr);

    const phoneErr = validators.phone(formData.phone);
    if (phoneErr) errors.push(phoneErr);

    const subjectErr = validators.subject(formData.subject);
    if (subjectErr) errors.push(subjectErr);

    const messageErr = validators.message(formData.message);
    if (messageErr) errors.push(messageErr);

    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ hard-block (no UI change)
    if (name === "name") {
      // allow letters + spaces + . ' -
      const filtered = value.replace(/[^A-Za-z\s.'-]/g, "");
      setFormData((prev) => ({ ...prev, [name]: filtered }));
      return;
    }

    if (name === "phone") {
      // digits only + max 10
      const filtered = value.replace(/[^\d]/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: filtered }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        name: formData.name.trim().replace(/\s+/g, " "),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim().replace(/\s+/g, " "),
        message: formData.message.trim(),
      };

      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success("Message sent successfully 🎉");

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 pt-24 md:pt-28">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get in Touch
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Have a question or need assistance? We're here to help! Reach
                out to us and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="modern-card rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {/* Email */}
                  {(() => {
                    const supportEmail = "support@shopease.com";

                    // 🔥 Full Strong Email Validation
                    const emailRegex =
                      /^(?!.*\.\.)(?!.*\.$)[^\s@]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

                    const trimmedEmail = supportEmail.trim();

                    const isValid =
                      trimmedEmail.length <= 100 && // max length
                      trimmedEmail.length >= 6 && // min reasonable length
                      emailRegex.test(trimmedEmail) && // format check
                      !trimmedEmail.includes(" "); // no spaces

                    if (!isValid) {
                      console.error(
                        "Invalid support email format:",
                        supportEmail,
                      );
                      return null; // ❌ invalid email render hi nahi karega
                    }

                    return (
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Email
                          </h3>

                          <a
                            href={`mailto:${trimmedEmail}`}
                            className="text-primary hover:text-primary-dark transition-colors"
                          >
                            {trimmedEmail}
                          </a>

                          <p className="text-sm text-gray-600 mt-1">
                            We'll respond within 24 hours
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Phone
                      </h3>
                      <a
                        href="tel:+15551234567"
                        className="text-primary hover:text-primary-dark transition-colors"
                      >
                        +1 (555) 123-4567
                      </a>
                      <p className="text-sm text-gray-600 mt-1">
                        Mon-Fri, 9am-6pm EST
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Address
                      </h3>
                      <p className="text-gray-700">
                        123 Shopping Street
                        <br />
                        Commerce City, CC 12345
                        <br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Follow Us
                  </h3>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Facebook"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>

                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Twitter"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>

                    <a
                      href="#"
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                      aria-label="Instagram"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="modern-card rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Send us a Message
                </h2>
                <p className="text-gray-600 mb-6">
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        placeholder="Your Mobile Number"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "modern-button hover:shadow-lg"
                    }`}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>

              {/* Additional Info */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="modern-card rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600">Support Available</div>
                </div>
                <div className="modern-card rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    &lt;24h
                  </div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
                <div className="modern-card rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    100%
                  </div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingCart />
      <Footer />
    </>
  );
}
