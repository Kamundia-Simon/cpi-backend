import "./App.css";
import {
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { ROUTES } from "./constants/routes";
import Dashboard from "./pages/dashboard";
import PMDetail from "./pages/PMDetails";
import SurveyDetail from "./pages/SurveyDetails";
import { SidebarProvider } from "./context/SidebarContext";
import { AppLayout } from "./components/layout/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Landing page — no sidebar ───────────────────── */}
        <Route
          path="/"
          element={
            <>
              {/* Signed-in users skip the landing page */}
              <SignedIn>
                <Navigate to={ROUTES.DASHBOARD} replace />
              </SignedIn>

              <SignedOut>
                <div className="flex flex-col min-h-screen">
                  {/* Minimal header for landing */}
                  <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6">
                      <Link to="/" className="flex items-center gap-2 font-bold">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FFD700] text-black">
                          <span className="text-lg font-bold leading-none">3</span>
                        </div>
                        <span className="text-xl">
                          <span className="font-semibold">GEM</span>
                          <span className="font-normal"> CPI Tracker</span>
                        </span>
                      </Link>
                      <SignInButton mode="modal">
                        <button className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors">
                          Sign in
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-1"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </SignInButton>
                    </div>
                  </header>

                  <main className="flex-1">
                    <section className="hero-pattern relative overflow-hidden min-h-screen flex items-start pt-8 pb-24">
                      <div className="container relative z-10 mx-auto px-4">
                        <div className="mx-auto max-w-[800px] text-center">
                          <div className="mb-6 inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm">
                            <span className="mr-2 rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-medium text-black">
                              New
                            </span>
                            <span className="text-gray-600">CPI Tracking Tool</span>
                          </div>

                          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                            A Clear View of Sampling Trends Analysing Trends in{" "}
                            <span className="text-[#EAB308]">
                              Project Sampling and Costs Breakdowns
                            </span>
                          </h1>

                          <p className="mb-8 text-lg text-gray-600 md:text-xl">
                            CPI Dashboard helps you make informed decisions by
                            transforming sampling activity into measurable cost and
                            performance insights.
                          </p>

                          <div className="flex justify-center">
                            <SignInButton mode="modal">
                              <button className="inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-base font-medium text-white hover:bg-black/90 transition-colors">
                                Sign in
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="ml-2"
                                >
                                  <path d="M5 12h14" />
                                  <path d="m12 5 7 7-7 7" />
                                </svg>
                              </button>
                            </SignInButton>
                          </div>
                        </div>
                      </div>
                      <img
                        src="/3gem.png"
                        alt=""
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] object-contain pointer-events-none"
                      />
                    </section>
                  </main>

                  <footer className="pb-8">
                    <div className="container mx-auto px-4">
                      <div className="mt-4 border-t pt-6 text-center text-sm text-gray-600">
                        © 2026 3GEM CPI Dashboard. All rights reserved.
                      </div>
                    </div>
                  </footer>
                </div>
              </SignedOut>
            </>
          }
        />

        {/* ── Authenticated pages — sidebar layout ────────── */}
        <Route
          path="/*"
          element={
            <SidebarProvider>
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pm/:pmId" element={<PMDetail />} />
                  <Route path="/survey/:surveyName" element={<SurveyDetail />} />
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                </Routes>
              </AppLayout>
            </SidebarProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
