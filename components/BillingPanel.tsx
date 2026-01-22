import React, { useState, useEffect, useRef } from 'react';
import { getActiveUserPlans } from '../services/geminiService';

interface BillingPanelProps {
    isPremiumUser: boolean;
    refreshUser: () => Promise<void>;
    isOpen: boolean;
}

const BillingPanel: React.FC<BillingPanelProps> = ({ isPremiumUser, isOpen }) => {
    const [activeSubs, setActiveSubs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedRef = useRef<boolean>(false);
    const lastFetchRef = useRef<number>(0);
    const CACHE_DURATION = 120000; // 2 minutes cache - much longer to avoid re-fetching

    useEffect(() => {
        if (!isOpen || !isPremiumUser) {
            if (!isPremiumUser) {
                setActiveSubs([]);
                hasFetchedRef.current = false;
            }
            return;
        }

        const fetchSubs = async () => {
            const now = Date.now();

            // If we already have data and it's within cache duration, don't refetch
            if (hasFetchedRef.current && activeSubs.length > 0 && (now - lastFetchRef.current < CACHE_DURATION)) {
                setIsLoading(false);
                return;
            }

            // Only show loading on first fetch, not on background refreshes
            if (!hasFetchedRef.current) {
                setIsLoading(true);
            }

            try {
                const plans = await getActiveUserPlans();
                const filteredPlans = plans.filter(p => p.plan_name !== 'free' && p.plan_name !== 'hobbyist');
                setActiveSubs(filteredPlans);
                hasFetchedRef.current = true;
                lastFetchRef.current = now;
                setError(null);
            } catch (err: any) {
                setError(err.message || "Failed to load subscriptions.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubs();
    }, [isOpen, isPremiumUser]);

    if (!isPremiumUser) {
        return null;
    }

    // Beautiful skeleton loader
    const SkeletonLoader = () => (
        <div className="animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16"></div>
                </div>
            </div>
        </div>
    );

    // Get plan icon based on plan name
    const getPlanIcon = (planName: string) => {
        if (planName === 'pro') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        );
    };

    return (
        <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                Billing & Subscriptions
            </h3>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]">
                {isLoading ? (
                    <SkeletonLoader />
                ) : error ? (
                    <p className="text-xs text-center text-red-500">{error}</p>
                ) : activeSubs.length === 0 ? (
                    <p className="text-xs text-center text-[var(--color-text-secondary)]">No active subscriptions found.</p>
                ) : (
                    <div className="space-y-3">
                        {activeSubs.map(sub => (
                            <div
                                key={sub.id}
                                className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[var(--color-accent-soft)] to-transparent p-3 border border-[var(--color-accent)]/20"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Plan Icon */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                                        {getPlanIcon(sub.plan_name)}
                                    </div>
                                    {/* Plan Info */}
                                    <div className="flex-1">
                                        <p className="font-bold capitalize text-[var(--color-text-primary)]">
                                            {sub.plan_name} Plan
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative gradient overlay */}
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-400/10 to-transparent rounded-bl-full"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingPanel;
