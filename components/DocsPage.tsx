import React from 'react';
import { motion } from 'framer-motion';
import ArchitectureIcon from './ArchitectureIcon';
import { IconType } from '../types';
import SharedFooter from './SharedFooter';

type Page = 'contact' | 'about' | 'api' | 'privacy' | 'terms' | 'docs' | 'apiKey' | 'careers' | 'research' | 'sdk';

interface DocsPageProps {
  onBack: () => void;
  onLaunch: () => void;
  onNavigateToApi: () => void;
  onNavigate: (page: Page) => void;
}

const highlightSyntax = (code: string) => {
  const highlighted = code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/'([^']*)'/g, `<span class="token string">'${'$1'}'</span>`)
    .replace(/"([^"]*)"/g, `<span class="token string">"${'$1'}"</span>`)
    .replace(/\b(curl|POST|GET|Authorization|Bearer|Content-Type|application\/json)\b/g, `<span class="token keyword">${'$&'}</span>`)
    .replace(/(-X|-H|-d|--data-raw)/g, `<span class="token property-access">${'$&'}</span>`);
  return { __html: highlighted };
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 text-sm text-gray-300 bg-[#1e1e1e] rounded-xl overflow-x-auto">
        <code dangerouslySetInnerHTML={highlightSyntax(code)} />
    </pre>
);

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
        <header className="absolute top-0 left-0 w-full p-6 z-20">
            <button onClick={onBack} className="flex items-center gap-2 font-semibold text-[#555555] hover:text-[#2B2B2B] transition-colors pulse-subtle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Back to Home
            </button>
        </header>

        <main>
            <section className="relative flex items-center justify-center overflow-hidden api-hero-bg py-20 pt-32 md:pt-40">
                <div className="container mx-auto px-6 z-10 text-center">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                            Developer <span className="animated-gradient-text text-transparent bg-clip-text">Docs</span>
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-[#555555]">
                            Everything you need to know to get the most out of CubeGen AI, from writing the perfect prompt to understanding our tech.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <article>
                            <DocsSection id="introduction" title="Introduction">
                                <p>Welcome to the CubeGen AI documentation! CubeGen AI is a revolutionary platform that transforms how software architects, engineers, and teams visualize, design, and share software architecture. Our goal is to provide the fastest way to convert natural language descriptions into professional, intelligent diagrams.</p>
                                <p>Founded as a non-profit organization in 2025 by Divesh and Manish Sarkar, CubeGen AI leverages cutting-edge generative AI technology to build beautiful, intelligent diagrams directly from your text descriptions.</p>
                                <p>Whether you're a software architect mapping out a complex system, a developer needing a quick visualization, or a student learning about cloud infrastructure, CubeGen AI is designed to streamline your workflow and democratize design.</p>
                            </DocsSection>

                            <SectionSeparator />
                            
                            <DocsSection id="getting-started" title="Getting Started">
                                <p>Creating your first diagram is simple and takes less than a minute. Here's how:</p>
                                <div className="grid md:grid-cols-3 gap-6 mt-8 not-prose">
                                    {gettingStartedSteps.map((step, index) => (
                                        <motion.div 
                                            key={index}
                                            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 h-full flex flex-col text-center"
                                        >
                                            <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                                <ArchitectureIcon type={step.icon} className="w-8 h-8 text-[#D6336C]" />
                                            </div>
                                            <h3 className="text-xl font-bold mt-4 mb-2">{step.title}</h3>
                                            <p className="text-[#555555]">{step.description}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </DocsSection>

                            <SectionSeparator />
                            
                            <DocsSection id="features" title="Features & Capabilities">
                                <p>CubeGen AI offers a comprehensive suite of features to help you create professional architecture diagrams:</p>
                                <div className="grid md:grid-cols-2 gap-6 mt-8 not-prose">
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.Gemini} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">AI-Powered Generation</h3>
                                        <p className="text-[#555555]">Describe your system in plain English and watch as a detailed architecture diagram is generated in seconds.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.Cloud} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">Multi-Cloud & Generic Icons</h3>
                                        <p className="text-[#555555]">Supports AWS, GCP, Azure, Kubernetes, and a wide array of generic components for any system.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.Playground} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">Interactive Playground</h3>
                                        <p className="text-[#555555]">Drag, drop, connect, and customize every element. Your diagram is a living document, not a static image.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.FileCode} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">Export & Share</h3>
                                        <p className="text-[#555555]">Export your designs to PNG, SVG, or JSON to integrate with your documentation and presentations.</p>
                                    </div>
                                </div>
                            </DocsSection>

                            <SectionSeparator />
                            
                            <DocsSection id="prompting-guide" title="Prompting Guide">
                                <p>The quality of the generated diagram depends heavily on the quality of your prompt. Here are some tips for writing effective prompts:</p>
                                <h4 className="text-xl font-bold text-[#333] mt-6 mb-2">Be Specific</h4>
                                <p>Mention specific technologies, cloud providers, and component names. The more detail you provide, the more accurate the diagram will be.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h5 className="font-semibold text-green-700">Good Prompt</h5>
                                        <p className="text-sm text-green-600 mt-1">"{goodPrompt}"</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h5 className="font-semibold text-red-700">Vague Prompt</h5>
                                        <p className="text-sm text-red-600 mt-1">"{badPrompt}"</p>
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold text-[#333] mt-6 mb-2">Describe Relationships</h4>
                                <p>Explain how components connect. Use phrases like "sends requests to," "is read from by," "is behind a," etc. This helps the AI create the correct links and layout.</p>
                                <h4 className="text-xl font-bold text-[#333] mt-6 mb-2">Use Grouping Keywords</h4>
                                <p>Use terms like "tier," "region," "availability zone," or "group" to have the AI automatically create containers around your components for better organization.</p>
                            </DocsSection>

                            <SectionSeparator />

                            <DocsSection id="api-access" title="API Access">
                                <p>Want to automate diagram generation? CubeGen AI offers a simple REST API to integrate into your own applications and workflows.</p>
                                <p>Generate diagrams from your CI/CD pipeline, build custom internal tools, or create automated documentation. Our API provides the flexibility you need.</p>
                                
                                <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg">
                                    <h4 className="font-bold flex items-center gap-2"><ArchitectureIcon type={IconType.FileCode} className="w-5 h-5" /> Install the CubeGen AI SDK</h4>
                                    <p className="text-sm mt-2">Install our official SDK to easily integrate with your applications:</p>
                                    <div className="mt-2 p-3 bg-blue-100 rounded-lg">
                                        <code className="text-blue-900 font-mono text-sm">npm install cubegen-ai</code>
                                    </div>
                                </div>
                                
                                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                    <h5 className="font-bold text-gray-800 mb-2">Usage Example:</h5>
                                    <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto text-sm">
{`import { CubeGenAI } from 'cubegen-ai';

const client = new CubeGenAI({
  apiKey: 'YOUR_API_KEY'
});

try {
  const diagram = await client.generateDiagram(
    'A 3-tier web application on AWS with a load balancer, multiple EC2 instances in an auto-scaling group, and an RDS database.'
  );
  console.log(diagram);
} catch (error) {
  console.error('Error generating diagram:', error);
}`}                                    </pre>
                                </div>
                                
                                <button onClick={onNavigateToApi} className="mt-4 bg-[#F9D7E3] text-[#A61E4D] font-bold py-2 px-6 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                                    View Full API Docs & Pricing
                                </button>
                            </DocsSection>

                            <SectionSeparator />
                            
                            <DocsSection id="our-team" title="Our Team & Mission">
                                <p>CubeGen AI was founded by a passionate team dedicated to democratizing design and making professional architecture tools accessible to everyone:</p>
                                
                                <div className="grid md:grid-cols-2 gap-8 mt-8 not-prose">
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-2xl mb-4">DS</div>
                                        <h3 className="text-xl font-bold">Divesh Sarkar</h3>
                                        <p className="text-[#D6336C] font-semibold mb-3">Principal Engineer</p>
                                        <p className="text-[#555555] text-sm">The visionary behind CubeGen AI, Divesh leads the project with a passion for making complex system design accessible to everyone through the power of AI.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 text-center">
                                        <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl mb-4">MS</div>
                                        <h3 className="text-xl font-bold">Manish Sarkar</h3>
                                        <p className="text-[#D6336C] font-semibold mb-3">Co-Founder & Engineer</p>
                                        <p className="text-[#555555] text-sm">Manish is the core engineer turning prompts into pixels. He's dedicated to optimizing the AI's performance and ensuring a seamless user experience.</p>
                                    </div>
                                </div>
                                
                                <div className="mt-8">
                                    <h4 className="text-xl font-bold text-[#333] mb-4">Our Mission: Democratize Design</h4>
                                    <p>Founded as a non-profit organization in 2025, CubeGen AI is dedicated to making professional design tools accessible to all. Our mission is simple: great software architecture shouldn't be a bottleneck.</p>
                                </div>
                            </DocsSection>

                            <SectionSeparator />
                            
                            <DocsSection id="research" title="Research & Innovation">
                                <p>At CubeGen AI, we're pioneering the next generation of AI-driven design. Our key research initiatives are shaping the future of software architecture:</p>
                                
                                <div className="space-y-6 mt-8 not-prose">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg">
                                            <ArchitectureIcon type={IconType.Brain} className="w-6 h-6 text-[#D6336C]" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">Next-Gen LLMs</h4>
                                            <p className="text-[#555555]">We are researching and fine-tuning language models specifically for the domain of software architecture. Our goal is to improve spatial reasoning, enhance layout algorithms, and develop models that understand nuanced architectural patterns to produce even more intelligent and aesthetic diagrams.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg">
                                            <ArchitectureIcon type={IconType.BlockchainNode} className="w-6 h-6 text-[#D6336C]" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">Decentralized Architectures</h4>
                                            <p className="text-[#555555]">The future is decentralized. Our research in this area focuses on expanding our understanding of Web3, blockchain, and distributed ledger technologies. We're developing capabilities to accurately model complex P2P networks, smart contract interactions, and dApp infrastructures.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg">
                                            <ArchitectureIcon type={IconType.Playground} className="w-6 h-6 text-[#D6336C]" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold">Intelligent Tooling</h4>
                                            <p className="text-[#555555]">A diagram is just the beginning. We're exploring the frontier of "diagram-as-code," researching how to generate Infrastructure-as-Code (like Terraform) directly from your designs, enabling real-time collaboration, and creating a version control system for visual architecture.</p>
                                        </div>
                                    </div>
                                </div>
                            </DocsSection>

                            <SectionSeparator />
                            
                            <DocsSection id="business-model" title="Our Sustainable Model">
                                <p>As a non-profit organization, our focus is on impact, not profit. Our sustainable model ensures the longevity of the project while keeping it accessible to all users:</p>
                                
                                <div className="grid md:grid-cols-3 gap-6 mt-8 not-prose">
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.WebServer} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">Service Maintenance</h3>
                                        <p className="text-[#555555] text-sm">Keeping the servers running, the APIs responsive, and the service reliable for all users.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.User} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">Team Support</h3>
                                        <p className="text-[#555555] text-sm">Fairly compensating our small, dedicated team for their ongoing work and innovation.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
                                        <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-white to-[#FFF0F5] border-2 border-[#F9D7E3] shadow-lg mb-4">
                                            <ArchitectureIcon type={IconType.Brain} className="w-8 h-8 text-[#D6336C]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-center mb-2">Future Research</h3>
                                        <p className="text-[#555555] text-sm">Investing in R&D to explore new features and work towards an open-source model.</p>
                                    </div>
                                </div>
                                
                                <div className="mt-8">
                                    <p>API charges from our API and power-users with personal keys directly fund our mission, allowing us to continue improving CubeGen AI for everyone.</p>
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
