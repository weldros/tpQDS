import React from "react";
import { ArrowLeft } from "lucide-react";

export default function AuthForm({
  activeTab,
  setActiveTab,
  formData,
  setFormData,
  handleSubmit,
}) {
  return (
    <div className="pt-32 pb-24 px-6 max-w-md mx-auto">
      <button
        onClick={() => setActiveTab("home")}
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-900 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      <div className="border border-neutral-300 rounded-3xl p-8 bg-white shadow-sm relative">
        <div className="absolute top-4 right-4 w-3 h-3 bg-neutral-900" />

        <h1 className="text-2xl font-serif text-neutral-950 mb-6">
          {activeTab === "login" ? "Sign In" : "Create Account"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "signin" && (
            <div>
              <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-semibold tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Dr. Alex Vance"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#faf9f5] border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-semibold tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="alex@quantum.org"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-[#faf9f5] border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-neutral-500 mb-1.5 font-semibold tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 bg-[#faf9f5] border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-neutral-950 text-white font-medium text-xs uppercase tracking-wider py-3.5 rounded-xl hover:bg-neutral-800 transition-colors mt-2 shadow-sm"
          >
            {activeTab === "login" ? "Access Node" : "Register Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-600">
          {activeTab === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => setActiveTab("signin")}
                className="text-neutral-950 font-semibold underline underline-offset-2"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="text-neutral-950 font-semibold underline underline-offset-2"
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
