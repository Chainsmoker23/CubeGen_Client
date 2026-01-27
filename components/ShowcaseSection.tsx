import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { PREVIEW_IMAGE_1, PREVIEW_IMAGE_2 } from './content/ShowcaseImages';

const TiltCard = ({ src, title, description, badge }: { src: string, title: string, description: string, badge?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Damped smoothing for mouse movement
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();

        // Calculate mouse position relative to center of card (-0.5 to 0.5)
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative group w-full rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-shadow duration-500 border border-gray-100"
        >
            <div
                style={{ transform: "translateZ(50px)" }}
                className="absolute -top-6 -right-6 z-20"
            >
                {badge && (
                    <span className="bg-[#D6336C] text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                        {badge}
                    </span>
                )}
            </div>

            <div className="overflow-hidden rounded-t-2xl bg-gray-50 border-b border-gray-100 h-[300px] md:h-[400px] flex items-center justify-center p-4">
                {/* Image Container with Parallax Effect */}
                <motion.div
                    style={{ transform: "translateZ(30px)" }}
                    className="relative w-full h-full shadow-inner rounded-lg overflow-hidden"
                >
                    <img
                        src={src}
                        alt={title}
                        className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
            </div>

            <div
                style={{ transform: "translateZ(20px)" }}
                className="p-6 md:p-8 bg-white rounded-b-2xl relative z-10"
            >
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
                    {title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                    {description}
                </p>
                <div className="mt-4 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
            </div>
        </motion.div>
    );
};

const ShowcaseSection = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-white to-[#FFF0F5]/30 overflow-hidden" style={{ perspective: "1000px" }}>
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="px-4 py-1.5 rounded-full bg-pink-50 text-[#D6336C] text-sm font-bold tracking-wide uppercase mb-4 inline-block">
                            Engineered for Clarity
                        </span>
                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                            Complex Systems, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6336C] to-[#FF922B]">
                                Beautifully Simplified.
                            </span>
                        </h2>
                        <p className="text-xl text-gray-500">
                            From AWS serverless architectures to multi-region deployments,
                            CubeGen AI handles the complexity so you can focus on the design.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-stretch">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <TiltCard
                            src={PREVIEW_IMAGE_1}
                            title="Serverless Microservices"
                            description="Automatically generated from a prompt describing an event-driven AWS Lambda architecture with API Gateway and DynamoDB."
                            badge="Pro Feature"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="md:mt-12" // Staggered offset
                    >
                        <TiltCard
                            src={PREVIEW_IMAGE_2}
                            title="Global Content Delivery"
                            description="A clear visualization of a multi-region CDN setup utilizing CloudFront, S3 origins, and Edge locations for low-latency delivery."
                            badge="Generated in 3s"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ShowcaseSection;
