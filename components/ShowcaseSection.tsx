import React from 'react';
import { motion } from 'framer-motion';
import { PREVIEW_IMAGE_1, PREVIEW_IMAGE_2 } from './content/ShowcaseImages';

const SimpleShowcaseImage = ({ src, alt }: { src: string, alt: string }) => {
    return (
        <div className="w-full relative group">
            <div className="overflow-hidden rounded-xl shadow-2xl border border-gray-200/50">
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-auto object-cover block"
                />
            </div>
        </div>
    );
};

const ShowcaseSection = () => {
    return (
        <section className="py-12 bg-gradient-to-b from-white to-[#FFF0F5]/30 overflow-hidden">
            <div className="w-full max-w-[95%] mx-auto px-2 md:px-0">
                <div className="flex flex-col gap-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <SimpleShowcaseImage
                            src={PREVIEW_IMAGE_1}
                            alt="Serverless Architecture"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <SimpleShowcaseImage
                            src={PREVIEW_IMAGE_2}
                            alt="Global CDN Architecture"
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ShowcaseSection;
