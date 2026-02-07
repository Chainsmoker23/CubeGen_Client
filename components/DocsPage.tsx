import React from 'react';
import { motion } from 'framer-motion';
import ArchitectureIcon from './ArchitectureIcon';
import { IconType } from '../types';
import SharedFooter from './SharedFooter';
import SEO from './SEO';
import SharedCodeBlock from './SharedCodeBlock';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk';

interface DocsPageProps {
    onBack: () => void;
    onLaunch: () => void;
    onNavigateToApi: () => void;
    onNavigate: (page: Page) => void;
}



const DocsSection: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <motion.div
        id={id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="mb-12 scroll-mt-24"
    >
        <h2 className="text-3xl font-bold text-[#D6336C] mb-4 pb-2 border-b border-pink-200">{title}</h2>
        <div className="text-[#555555] space-y-4 prose max-w-none">
            {children}
        </div>
    </motion.div>
);

const SectionSeparator = () => (
    <div className="my-16 flex justify-center items-center" aria-hidden="true">
        <div className="w-1/3 border-t border-pink-200" />
        <div className="w-1/3 border-t border-pink-200" />
    </div>
);


const DocsPage: React.FC<DocsPageProps> = ({ onBack, onLaunch, onNavigateToApi, onNavigate }) => {
    const goodPrompt = `A 3-tier web application on AWS with a load balancer, multiple EC2 instances in an auto-scaling group, and an RDS database.`;
    const badPrompt = `web server, db, user`;

    const gettingStartedSteps = [
        {
            icon: IconType.Message,
            title: '1. Describe',
            description: 'Use the prompt input to describe your system. Be as simple or detailed as you like.'
        },
        {
            icon: IconType.Gemini,
            title: '2. Generate',
            description: "Our AI will interpret your prompt and create a diagram with the right components and connections."
        },
        {
            icon: IconType.Playground,
            title: '3. Refine',
            description: 'Jump into the Playground to manually adjust your diagram. Move, edit, and perfect your design.'
        }
    ];

    return (
        <div className="bg-white text-[#2B2B2B] overflow-x-hidden">
            <SEO
                title="Documentation - CubeGen AI | Developer Guide & API"
                description="Official documentation for CubeGen AI. Learn how to generate architecture diagrams, use the API, and integrate with our SDK."
                keywords="cubegen ai docs, architecture diagram api, diagram integration, sdk documentation, software design automation, developer tools"
                canonical="https://cubegenai.com/docs"
            />
            <header className="absolute top-0 left-0 w-full p-6 z-20">
                <button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#555555] hover:text-[#2B2B2B] transition-colors pulse-subtle">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Back to Home
                </button>
            </header>

            <main>
                <section className="relative flex items-center justify-center overflow-hidden bg-white py-16 pt-24 md:pt-32">
                    <div className="container mx-auto px-6 z-10">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#2B2B2B] mb-6">
                                Developer Documentation
                            </h1>
                            <p className="text-xl text-[#555555]">
                                Learn how to generate architecture diagrams, use the API, and integrate with our SDK.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="pb-24 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto">
                            <article>
                                <DocsSection id="introduction" title="Introduction">
                                    <p>Welcome to the CubeGen AI documentation. CubeGen AI transforms natural language descriptions into professional software architecture diagrams using generative AI.</p>
                                    <p>Whether you're a software architect mapping out a complex system or a developer needing a quick visualization, our tool streamlines your workflow by converting text to diagrams instantly.</p>
                                </DocsSection>

                                <SectionSeparator />

                                <DocsSection id="getting-started" title="Getting Started">
                                    <p>Creating your first diagram is simple:</p>
                                    <ol className="list-decimal list-inside space-y-4 mt-4 text-[#555555]">
                                        <li className="pl-2"><span className="font-bold text-[#2B2B2B]">Describe:</span> Use the prompt input to describe your system (e.g., "A 3-tier AWS web app").</li>
                                        <li className="pl-2"><span className="font-bold text-[#2B2B2B]">Generate:</span> Our AI creates a diagram with the correct components and connections.</li>
                                        <li className="pl-2"><span className="font-bold text-[#2B2B2B]">Refine:</span> Use the Playground to manually adjust, move, or edit elements.</li>
                                    </ol>
                                </DocsSection>

                                <SectionSeparator />

                                <DocsSection id="features" title="Core Features">
                                    <ul className="list-disc list-inside space-y-3 mt-4 text-[#555555]">
                                        <li><span className="font-bold text-[#2B2B2B]">AI-Powered Generation:</span> Text-to-diagram capabilities for instant visualizations.</li>
                                        <li><span className="font-bold text-[#2B2B2B]">Multi-Cloud Support:</span> Icons and components for AWS, GCP, Azure, and Kubernetes.</li>
                                        <li><span className="font-bold text-[#2B2B2B]">Interactive Playground:</span> Drag-and-drop editor to customize generated diagrams.</li>
                                        <li><span className="font-bold text-[#2B2B2B]">Export Options:</span> Download designs as PNG, SVG, or JSON.</li>
                                    </ul>
                                </DocsSection>

                                <SectionSeparator />

                                <DocsSection id="prompting-guide" title="Prompting Guide">
                                    <p>The quality of the generated diagram depends on your prompt. For best results:</p>
                                    <ul className="list-disc list-inside space-y-2 mt-4 text-[#555555]">
                                        <li><span className="font-bold text-[#2B2B2B]">Be Specific:</span> Mention specific technologies (EC2, S3, RDS) rather than generic terms.</li>
                                        <li><span className="font-bold text-[#2B2B2B]">Describe Relationships:</span> Explain connections (e.g., "Load balancer forwards to EC2").</li>
                                        <li><span className="font-bold text-[#2B2B2B]">Use Grouping:</span> Use terms like "VPC", "Region", or "Subnet" to organize components.</li>
                                    </ul>

                                    <div className="mt-6 p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-md">
                                        <p className="font-semibold text-gray-700">Example Prompt:</p>
                                        <p className="text-gray-600 italic mt-1">"{goodPrompt}"</p>
                                    </div>
                                </DocsSection>

                                <SectionSeparator />

                                <DocsSection id="api-access" title="API & SDK Access">
                                    <p>Integrate CubeGen AI directly into your applications using our REST API or Node.js SDK.</p>

                                    <h3 className="text-xl font-bold mt-8 mb-4">Installation</h3>
                                    <div className="mb-6">
                                        <SharedCodeBlock code="npm install cubegen-ai" />
                                    </div>

                                    <h3 className="text-xl font-bold mt-8 mb-4">Quick Start</h3>
                                    <div className="mb-6">
                                        <SharedCodeBlock code={`import { CubeGenAI } from 'cubegen-ai';

const client = new CubeGenAI({
  apiKey: 'YOUR_API_KEY' // Get this from your API Key page
});

// Generate a diagram
const diagram = await client.generateDiagram(
  'Microservices architecture with API Gateway and Lambda functions'
);`} />
                                    </div>

                                    <div className="mt-8">
                                        <button onClick={onNavigateToApi} className="text-[#D6336C] font-semibold hover:underline flex items-center gap-2">
                                            View Full API Documentation & Pricing &rarr;
                                        </button>
                                    </div>
                                </DocsSection>

                                <SectionSeparator />

                                <DocsSection id="code-to-diagram" title="Code to Diagram">
                                    <p>Create diagrams programmatically using our declarative DSL syntax—no AI needed. Write code, get diagrams instantly.</p>

                                    <h3 className="text-xl font-bold mt-8 mb-4">DSL Syntax</h3>

                                    <h4 className="text-lg font-semibold mt-6 mb-2">Nodes</h4>
                                    <p>Define nodes with position and icon:</p>
                                    <div className="mb-4">
                                        <SharedCodeBlock code={`node user: "User" icon=User x=100 y=200
node api: "API Gateway" icon=ApiGateway x=300 y=200
node db: "Database" icon=Database x=500 y=200`} />
                                    </div>

                                    <h4 className="text-lg font-semibold mt-6 mb-2">Connections</h4>
                                    <p>Connect nodes with unidirectional or bidirectional arrows:</p>
                                    <div className="mb-4">
                                        <SharedCodeBlock code={`user -> api: "HTTP Request"
api <-> db: "Read/Write"`} />
                                    </div>

                                    <h4 className="text-lg font-semibold mt-6 mb-2">Containers</h4>
                                    <p>Group nodes inside containers (VPC, Region, Subnet, etc.):</p>
                                    <div className="mb-4">
                                        <SharedCodeBlock code={`container vpc: "AWS VPC" type=vpc x=50 y=50 width=600 height=400 {
    node ec2: "EC2 Instance" icon=AwsEc2 x=100 y=100
    node rds: "RDS MySQL" icon=AwsRds x=300 y=100
}`} />
                                    </div>

                                    <h4 className="text-lg font-semibold mt-6 mb-2">Full Example</h4>
                                    <div className="mb-6">
                                        <SharedCodeBlock code={`// 3-Tier Web Application
node user: "Users" icon=User x=50 y=150
node lb: "Load Balancer" icon=LoadBalancer x=200 y=150
node api: "API Server" icon=Api x=350 y=150
node db: "Database" icon=Database x=500 y=150

user -> lb: "HTTPS"
lb -> api: "Route"
api -> db: "Query"`} />
                                    </div>

                                    <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-md">
                                        <p className="font-semibold text-green-700">Available for all users!</p>
                                        <p className="text-green-600 text-sm mt-1">Code to Diagram is free for all pricing plans. Access it from the sidebar menu.</p>
                                    </div>
                                </DocsSection>
                            </article>
                        </div>
                    </div>
                </section>
            </main>

            <SharedFooter onNavigate={onNavigate} activePage="docs" />
        </div>
    );
};

export default DocsPage;
