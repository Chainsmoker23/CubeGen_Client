import React, { useState, useEffect, useRef } from 'react';
import { getActiveUserPlans } from '../services/geminiService';

interface BillingPanelProps {
    isPremiumUser: boolean;
    refreshUser: () => Promise<void>;
    isOpen: boolean;
}

const BillingPanel: React.FC<BillingPanelProps> = ({ isPremiumUser, refreshUser, isOpen }) => {
    const [activeSubs, setActiveSubs] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const lastFetchRef = useRef<number>(0);
    const FETCH_INTERVAL = 30000; // 30 seconds between fetches

    useEffect(() => {
        if (!isOpen || !isPremiumUser) {
            if (!isPremiumUser) {
                setActiveSubs([]);
            }
            return;
        }

        const fetchSubs = async () => {
            const now = Date.now();
            if (now - lastFetchRef.current < FETCH_INTERVAL) {
                return; // Skip if we fetched recently
            }

            lastFetchRef.current = now;

            try {
                const plans = await getActiveUserPlans();
                const filteredPlans = plans.filter(p => p.plan_name !== 'free' && p.plan_name !== 'hobbyist');
                // Only update state if subscriptions have changed
                if (JSON.stringify(activeSubs) !== JSON.stringify(filteredPlans)) {
                    setActiveSubs(filteredPlans);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load subscriptions.");
            }
        };

        // Initial fetch
        fetchSubs();

        // Set up interval for background refresh
        const intervalId = setInterval(fetchSubs, FETCH_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [isOpen, isPremiumUser]);

    if (!isPremiumUser) {
        return null;
    }

    return (
        <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Billing &amp; Subscriptions</h3>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]">
                {error ? (
                    <p className="text-xs text-center text-red-500">{error}</p>
                ) : activeSubs.length === 0 ? (
                    <p className="text-xs text-center text-[var(--color-text-secondary)]">No active subscriptions found.</p>
                ) : (
                    <div className="space-y-3">
                        {activeSubs.map(sub => (
                            <div key={sub.id} className="text-sm">
                                <p className="font-semibold capitalize">{sub.plan_name} Plan</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingPanel;
