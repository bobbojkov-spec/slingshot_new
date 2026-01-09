import React from 'react';

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Do you ship internationally?</h2>
                    <p className="text-gray-600">Yes, we ship to most countries worldwide. Shipping costs and times vary by location.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">How do I track my order?</h2>
                    <p className="text-gray-600">Once your order ships, you will receive a confirmation email with a tracking number.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">What warranty fits my gear have?</h2>
                    <p className="text-gray-600">Most equipment comes with a standard manufacturer's warranty. Please check the specific product page or manufacturer's website for details.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Can I pick up my order in store?</h2>
                    <p className="text-gray-600">Currently we operate as an online-only retailer, but we are working on establishing pickup partners.</p>
                </div>
            </div>
        </div>
    );
}
