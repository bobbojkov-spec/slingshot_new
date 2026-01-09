import React from 'react';

export default function AboutPage() {
    return (
        <div className="section-container section-padding pt-32 min-h-screen text-white">
            <h1 className="text-4xl font-heading font-black uppercase mb-8">About Slingshot Bulgaria</h1>
            <div className="prose prose-invert max-w-4xl">
                <p className="lead text-xl text-white/80">
                    We are the official distributor of Slingshot Sports for Bulgaria.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4">Our Mission</h3>
                <p>
                    To provide the best equipment for kiteboarding, wakeboarding, and foiling enthusiasts in the region.
                    We believe in quality, performance, and the sheer joy of riding on water.
                </p>

                <h3 className="text-2xl font-bold mt-8 mb-4">Contact Us</h3>
                <p>
                    Have questions? Visit our <a href="/contact" className="text-accent hover:underline">Contact Page</a> or email us at info@slingshot.bg.
                </p>
            </div>
        </div>
    );
}
