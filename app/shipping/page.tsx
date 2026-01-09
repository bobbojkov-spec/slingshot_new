import React from 'react';

export default function ShippingPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>
            <div className="prose max-w-none">
                <p className="mb-4">
                    We ship worldwide via reputable carriers to ensure your gear arrives safely and on time.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">Delivery Times</h2>
                <ul className="list-disc pl-5 mb-4">
                    <li>Standard Shipping: 3-5 business days</li>
                    <li>Express Shipping: 1-2 business days</li>
                    <li>International Shipping: 7-14 business days</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-4">Shipping Rates</h2>
                <p>
                    Shipping rates are calculated at checkout based on the weight and dimensions of your order and the destination.
                </p>
            </div>
        </div>
    );
}
