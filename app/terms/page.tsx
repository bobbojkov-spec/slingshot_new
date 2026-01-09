import React from 'react';

export default function TermsPage() {
    return (
        <div className="section-container section-padding pt-32 min-h-screen text-white">
            <h1 className="text-4xl font-heading font-black uppercase mb-8">Terms & Conditions</h1>
            <div className="prose prose-invert max-w-4xl">
                <p>Welcome to Slingshot Bulgaria. By accessing this website, you agree to be bound by these terms and conditions.</p>

                <h3 className="text-xl font-bold mt-6 mb-2">1. General</h3>
                <p>These terms and conditions apply to all orders placed on this website.</p>

                <h3 className="text-xl font-bold mt-6 mb-2">2. Pricing & Availability</h3>
                <p>All prices are in BGN/EUR and include VAT. Availability is subject to change without notice.</p>

                <h3 className="text-xl font-bold mt-6 mb-2">3. Shipping & Returns</h3>
                <p>Please refer to our Shipping and Returns pages for detailed information.</p>

                <p className="mt-8 text-white/60">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}
