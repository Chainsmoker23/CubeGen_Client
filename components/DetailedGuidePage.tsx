import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import SEO from './SEO';
import ArchitectureIcon from './ArchitectureIcon';
import { IconType } from '../types';
import SharedFooter from './SharedFooter';
import Logo from './Logo';

interface DetailedGuidePageProps {
    onNavigate: (page: string) => void;
    onLaunch: () => void;
}

const DetailedGuidePage: React.FC<DetailedGuidePageProps> = ({ onNavigate, onLaunch }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white text-[#2B2B2B] min-h-screen flex flex-col">
            <SEO
                title="Guide: How to Generate AI Architecture Diagrams | CubeGen AI"
                description="Learn how to generate professional cloud architecture diagrams using AI prompts. A complete guide to prompting, editing, and designing with CubeGen AI."
                keywords="how to generate architecture diagrams, ai diagram prompt guide, cubegen ai tutorial, cloud architecture design, aws diagram generator, edit architecture diagrams"
                canonical="https://cubegenai.com/guide"
                ogTitle="Master AI Architecture Diagrams - CubeGen AI Guide"
                ogDescription="The authoritative guide to generating and editing complex system diagrams with AI. Learn the best prompting techniques."
            />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 h-16 transition-all duration-300">
                <div className="container mx-auto px-6 h-full flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
                        <Logo className="h-8 w-8 text-[#D6336C]" />
                        <h3 className="text-xl font-bold">Cube<span className="text-[#D6336C]">Gen</span> AI</h3>
                    </div>
                    <nav className="hidden md:flex items-center space-x-6">
                        <button onClick={() => onNavigate('landing')} className="text-sm font-medium text-gray-600 hover:text-gray-900">Home</button>
                        <button onClick={() => onNavigate('blog')} className="text-sm font-medium text-gray-600 hover:text-gray-900">Blog</button>
                    </nav>
                    <button
                        onClick={onLaunch}
                        className="bg-[#D6336C] text-white font-bold py-2 px-5 rounded-full text-sm hover:bg-[#C2255C] transition-colors shadow-md"
                    >
                        Launch App
                    </button>
                </div>
            </header>

            <main className="flex-grow pt-32 pb-20">
                <article className="container mx-auto px-6 max-w-4xl">

                    {/* Article Header */}
                    <header className="text-center mb-16">
                        <div className="inline-block px-3 py-1 bg-pink-50 text-[#D6336C] rounded-full text-xs font-bold tracking-wide uppercase mb-4">
                            Official Guide
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                            Mastering AI Architecture Design
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            A deep dive into creating, editing, and optimizing technical diagrams using natural language and CubeGen AI's advanced engine.
                        </p>
                    </header>

                    <div className="prose prose-lg mx-auto prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#D6336C] prose-img:rounded-xl">

                        {/* Section 1: What is CubeGen AI */}
                        <section className="mb-16">
                            <h2 className="flex items-center gap-3 text-3xl mb-6">
                                <ArchitectureIcon type={IconType.Cloud} className="text-[#D6336C] w-8 h-8" />
                                What is CubeGen AI?
                            </h2>
                            <p>
                                <strong>CubeGen AI</strong> is a next-generation diagramming tool that transforms natural language text into professional software architecture diagrams. Unlike traditional drag-and-drop tools that require hours of manual work, CubeGen AI leverages extensive knowledge of cloud providers (AWS, Azure, GCP), design patterns, and system components to generate complete visual layouts in seconds.
                            </p>
                            <p>
                                It is built for <strong>developers, solution architects, and technical writers</strong> who need to visualize complex systems quickly. Whether you are documenting a legacy monolith or planning a serverless microservices architecture, CubeGen AI acts as your intelligent design partner.
                            </p>
                        </section>

                        <hr className="my-12 border-gray-100" />

                        {/* Section 2: How to Prompt */}
                        <section className="mb-16">
                            <h2 className="flex items-center gap-3 text-3xl mb-6">
                                <ArchitectureIcon type={IconType.Message} className="text-[#D6336C] w-8 h-8" />
                                How to Write Effective Prompts
                            </h2>
                            <p>
                                The quality of your generated diagram depends on the clarity of your prompt. While CubeGen AI is smart enough to fill in the gaps, being specific yields the best results.
                            </p>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 my-8">
                                <h3 className="text-lg font-bold mb-2">The Golden Rule of Prompting</h3>
                                <p className="mb-0">
                                    <em>Describe the <strong>flow of data</strong> and the <strong>relationships</strong> between components, not just the list of services.</em>
                                </p>
                            </div>

                            <h3 className="text-xl font-bold mt-8 mb-4">Example 1: Basic Request</h3>
                            <p className="border-l-4 border-gray-300 pl-4 py-2 italic text-gray-500 bg-gray-50 rounded-r-lg">
                                "Create a simple AWS web app with a load balancer and database."
                            </p>
                            <p className="text-sm mt-2 mb-6">
                                This will generate a generic architecture with an Application Load Balancer, EC2 instances, and an RDS database.
                            </p>

                            <h3 className="text-xl font-bold mt-8 mb-4">Example 2: Detailed Specification (Recommended)</h3>
                            <p className="border-l-4 border-[#D6336C] pl-4 py-2 italic text-gray-700 bg-pink-50/50 rounded-r-lg">
                                "Design a serverless video processing pipeline on AWS. Users upload files to an S3 bucket, which triggers a Lambda function. The Lambda function uses Amazon Rekognition to analyze the video and stores the metadata in a DynamoDB table. Use API Gateway for the frontend triggering and storing logs in CloudWatch."
                            </p>
                            <p className="text-sm mt-2">
                                This prompt gives the AI clear instructions on the <strong>event trigger</strong> (S3 -> Lambda), the <strong>external integration</strong> (Rekognition), and the <strong>data storage</strong> (DynamoDB), resulting in a precise and usable diagram.
                            </p>
                        </section>

                        <hr className="my-12 border-gray-100" />

                        {/* Section 3: Editing Diagrams */}
                        <section className="mb-16">
                            <h2 className="flex items-center gap-3 text-3xl mb-6">
                                <ArchitectureIcon type={IconType.Edit} className="text-[#D6336C] w-8 h-8" />
                                Editing and Customizing
                            </h2>
                            <p>
                                Generative AI gets you 90% of the way there. The <strong>CubeGen Playground</strong> is where you refine the final 10%.
                            </p>
                            <ul className="list-disc pl-6 space-y-3">
                                <li>
                                    <strong>Drag and Drop:</strong> Move nodes freely to organize the layout. The intelligent arrow system will automatically reroute connections to keep the diagram clean.
                                </li>
                                <li>
                                    <strong>Add New Nodes:</strong> Use the sidebar to search for specific icons (e.g., "Kubernetes Pod", "Kafka Cluster") and drop them onto the canvas.
                                </li>
                                <li>
                                    <strong>Connect Components:</strong> Click and drag from the edge of any node to create a new connection link.
                                </li>
                                <li>
                                    <strong>Style Customization:</strong> Click on any node to change its color, border style, or label text to match your company's brand guidelines.
                                </li>
                            </ul>
                        </section>

                        {/* CTA */}
                        <div className="bg-gradient-to-r from-[#D6336C] to-[#BE4BDB] text-white p-10 rounded-2xl text-center shadow-xl mt-12">
                            <h3 className="text-2xl font-bold mb-4 text-white">Ready to design your system?</h3>
                            <p className="mb-8 opacity-90 text-lg">
                                Start generating professional diagrams in seconds with our AI engine.
                            </p>
                            <button
                                onClick={onLaunch}
                                className="bg-white text-[#D6336C] font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
                            >
                                Create Diagram Now
                            </button>
                        </div>

                    </div>
                </article>
            </main>

            <SharedFooter onNavigate={onNavigate} />
        </div>
    );
};

export default DetailedGuidePage;
