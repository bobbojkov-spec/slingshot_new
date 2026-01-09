import React from 'react';

export default function ReturnsPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Returns & Exchanges</h1>
            <div className="prose max-w-none">
                <p className="mb-4">
                    We want you to be completely stoked on your new gear. If something isn't right, we're here to help.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">Return Policy</h2>
                <p className="mb-4">
                    You may return unused items within 30 days of delivery for a full refund. Items must be in original condition with all packaging and tags intact.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-4">How to Return</h2>
                <ol className="list-decimal pl-5 mb-4">
                    <li>Contact our support team to initiate a return.</li>
                    <li>Pack the item securely in its original packaging.</li>
                    <li>Ship the item back to the address provided by our support team.</li>
                </ol>

                <p className="mt-8 text-sm text-gray-500">
                    Note: Shipping costs for returns are the responsibility of the customer unless the return is due to a defect or error on our part.
                </p>
            </div>
        </div>
    );
}
