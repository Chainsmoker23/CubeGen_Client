import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

// --- TYPES ---
interface PlanFeature {
    name: string;
    icon: string; // "check"
    iconColor: string;
}

interface Plan {
    id: string;
    title: string;
    description: string;
    currency: string;
    monthlyPrice: string;
    originalMonthlyPrice?: string; // New: For strikethrough price
    showCountdown?: boolean;      // New: Trigger countdown UI
    buttonText: string;
    highlight: boolean;
    features: PlanFeature[];
}

interface PricingTableOneProps {
    title: string;
    description: string;
    onPlanSelect: (planId: string) => void;
    plans: Plan[];
    loadingPlan: string | null;
}

// --- SUB-COMPONENTS ---
const CheckIcon: React.FC<{ className: string }> = ({ className }) => (
    <svg className={`w-5 h-5 flex-shrink-0 ${className}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
    </svg>
);

const CountdownTimer = () => {
    // 5 hours in seconds
    const [timeLeft, setTimeLeft] = useState(5 * 60 * 60);

    useEffect(() => {
        // Check if there's a saved timestamp in localStorage
        const savedEndTime = localStorage.getItem('offerEndTime');
        const now = Date.now();

        if (savedEndTime) {
            const remaining = Math.max(0, Math.floor((parseInt(savedEndTime) - now) / 1000));
            setTimeLeft(remaining);
        } else {
            // Set 5 hours from now
            const endTime = now + (5 * 60 * 60 * 1000);
            localStorage.setItem('offerEndTime', endTime.toString());
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6 text-center animate-pulse">
            <p className="text-red-800 text-xs font-bold uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Limited Time Offer
            </p>
            <p className="text-red-600 font-mono text-2xl font-black">{formatTime(timeLeft)}</p>
            <p className="text-[10px] text-red-400 font-semibold mt-1">Ends soon!</p>
        </div>
    );
};

// --- MAIN COMPONENT ---
const PricingTableOne: React.FC<PricingTableOneProps> = ({ title, description, onPlanSelect, plans, loadingPlan }) => {
    const { currentUser } = useAuth();
    const userPlan = currentUser?.user_metadata?.plan;

    return (
        <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-4">{title}</h2>
            <p className="text-lg text-[#555555] max-w-2xl mx-auto text-center mb-12">{description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start justify-center">
                {plans.map((plan) => {
                    const planId = plan.id === 'one_time' ? 'hobbyist' : (plan.id === 'subscription' ? 'pro' : 'free');
                    const isCurrentPlan = userPlan === planId;
                    const isHighlightedAsCurrent = isCurrentPlan && planId !== 'hobbyist';
                    const isHobbyistRepurchase = isCurrentPlan && planId === 'hobbyist';

                    let buttonText = plan.buttonText;
                    let isButtonDisabled = loadingPlan === plan.id;

                    if (isCurrentPlan) {
                        if (planId === 'hobbyist') {
                            buttonText = 'Add 50 Credits';
                        } else {
                            buttonText = 'Current Plan';
                            isButtonDisabled = true;
                        }
                    } else if (!currentUser && plan.id !== 'free') {
                        buttonText = "Sign In to Purchase";
                    } else if (currentUser && planId === 'free') {
                        isButtonDisabled = true;
                    }

                    return (
                        <motion.div
                            key={plan.id}
                            className={`relative p-8 rounded-2xl border transition-all duration-300 flex flex-col h-full ${isHighlightedAsCurrent
                                ? 'bg-white border-2 border-[#D6336C] shadow-2xl scale-105'
                                : plan.highlight
                                    ? 'bg-white shadow-2xl border-[#D6336C] md:-translate-y-4'
                                    : (userPlan === 'pro' && planId === 'hobbyist')
                                        ? 'bg-white shadow-lg border-pink-100'
                                        : 'bg-white/70 shadow-lg border-pink-100'
                                }`}
                        >
                            {isHighlightedAsCurrent && (
                                <div className="absolute top-0 right-4 -translate-y-1/2 bg-gradient-to-r from-[#E91E63] to-[#F06292] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                                    Current Plan
                                </div>
                            )}

                            {/* Countdown Timer Hook */}
                            {plan.showCountdown && !isCurrentPlan && <CountdownTimer />}

                            <h3 className="text-xl font-bold">{plan.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                            {/* Visual Price Display */}
                            <div className="mt-4 flex items-end gap-2">
                                <span className="text-4xl font-extrabold text-[#D6336C]">{plan.currency}{plan.monthlyPrice}</span>
                                {plan.originalMonthlyPrice && (
                                    <div className="flex flex-col mb-1.5 ml-1">
                                        <span className="text-lg text-gray-400 line-through decoration-red-400 decoration-2">{plan.currency}{plan.originalMonthlyPrice}</span>
                                    </div>
                                )}
                                <span className="text-gray-500 mb-1"> / {plan.id === 'one_time' ? 'one-time' : 'month'}</span>
                            </div>

                            {plan.originalMonthlyPrice && (
                                <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">
                                    SAVE {Math.round((1 - parseInt(plan.monthlyPrice) / parseInt(plan.originalMonthlyPrice)) * 100)}% TODAY
                                </div>
                            )}

                            <div className="flex-grow mt-6">
                                <ul className="space-y-3 text-sm text-[#555555]">
                                    {plan.features.map(f => <li key={f.name} className="flex items-start gap-2"><CheckIcon className={f.iconColor} /><span>{f.name}</span></li>)}
                                </ul>
                            </div>

                            <button
                                onClick={() => onPlanSelect(plan.id)}
                                disabled={isButtonDisabled}
                                className={`mt-8 w-full font-bold py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed ${isButtonDisabled
                                    ? 'bg-gray-200 text-gray-500 cursor-default'
                                    : (plan.highlight || isHobbyistRepurchase ? 'shimmer-button text-[#A61E4D]' : 'bg-[#F9D7E3] text-[#A61E4D] hover:shadow-lg')
                                    }`}
                            >
                                {loadingPlan === plan.id
                                    ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Processing...
                                        </>
                                    )
                                    : buttonText
                                }
                            </button>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
};

export default PricingTableOne;
