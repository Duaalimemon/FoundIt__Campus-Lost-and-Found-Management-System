import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Brand Section */}
      <header className="text-center mb-12 sm:mb-16">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900 px-3 py-1 rounded-full mb-3">
          Campus Property Management
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
          FoundIt
        </h1>
        <p className="text-base sm:text-lg text-muted dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The central campus lost and found directory. Report missing items, browse secured belongings, and submit verified ownership claims.
        </p>

        {/* Quick Action CTAs: Responsive grid on mobile, row on desktop */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-lg lg:max-w-none mx-auto">
          <Link to="/lost" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" fullWidth>
              Browse Lost Items
            </Button>
          </Link>
          <Link to="/found" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth>
              Browse Found Items
            </Button>
          </Link>
          <Link to="/lost/new" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" fullWidth>
              Report Lost Item
            </Button>
          </Link>
          <Link to="/found/new" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" fullWidth>
              Register Found Item
            </Button>
          </Link>
        </div>
      </header>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Card 1: Lost Directory */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Lost Something?</h2>
            <p className="text-sm text-muted dark:text-slate-400 mb-4 leading-relaxed">
              Check the directory of items reported missing or create a new lost report with location and date details.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/lost" className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
              View Directory &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: Found Inventory */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Found Property</h2>
            <p className="text-sm text-muted dark:text-slate-400 mb-4 leading-relaxed">
              Items safely deposited with campus security. If you recognize your property, submit an ownership claim online.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/found" className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
              Search Found &rarr;
            </Link>
          </div>
        </div>

        {/* Card 3: Staff Administration */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md dark:hover:border-slate-700 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-400 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Staff Portal</h2>
            <p className="text-sm text-muted dark:text-slate-400 mb-4 leading-relaxed">
              Authorized security and property officers can log in to review claims, update item states, and inspect full records.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/staff/login" className="text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
              Staff Access &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* How FoundIt Works Section */}
      <section className="mb-12 sm:mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How FoundIt Works
          </h2>
          <p className="text-sm text-muted dark:text-slate-400 mt-2 max-w-xl mx-auto">
            A simple, secure process to reunite students and staff with their missing property.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-primary/10 dark:bg-blue-950 text-primary dark:text-blue-400 font-bold text-sm flex items-center justify-center mb-4">
              1
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Report Missing Property
            </h3>
            <p className="text-sm text-muted dark:text-slate-400 leading-relaxed">
              Lost an item? Submit a detailed report with category, last seen location, and date so security has your record on file.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-primary/10 dark:bg-blue-950 text-primary dark:text-blue-400 font-bold text-sm flex items-center justify-center mb-4">
              2
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Search Verified Inventory
            </h3>
            <p className="text-sm text-muted dark:text-slate-400 leading-relaxed">
              Browse securely logged items turned in by campus security, staff, or fellow students across university facilities.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border dark:border-slate-800 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-primary/10 dark:bg-blue-950 text-primary dark:text-blue-400 font-bold text-sm flex items-center justify-center mb-4">
              3
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Claim & Verify Ownership
            </h3>
            <p className="text-sm text-muted dark:text-slate-400 leading-relaxed">
              Found your item? Submit a claim with proof of ownership. Once staff verifies your claim, pick it up at the security desk.
            </p>
          </div>
        </div>
      </section>

      {/* Campus Guidelines / Quick Tips Section */}
      <section className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 sm:p-8 border border-border dark:border-slate-800">
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Campus Guidelines & Quick Tips
          </h2>
          <p className="text-xs sm:text-sm text-muted dark:text-slate-400 mb-6">
            Essential procedures for reporting, claiming, and turning in property on campus.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Where to Turn In Items
              </h3>
              <p className="text-xs text-muted dark:text-slate-400 leading-relaxed">
                Bring found items to the Central Campus Security Office or the Student Center Front Desk for immediate safe custody.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Claim Verification
              </h3>
              <p className="text-xs text-muted dark:text-slate-400 leading-relaxed">
                Staff review ownership claims against item serial numbers, photos, or distinguishing marks prior to releasing property.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Privacy Protected
              </h3>
              <p className="text-xs text-muted dark:text-slate-400 leading-relaxed">
                Your personal contact details and email address are never displayed publicly. Only authorized staff see contact information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
