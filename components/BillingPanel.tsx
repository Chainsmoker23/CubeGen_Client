import React, { useState, useEffect, useRef } from 'react';
import { getActiveUserPlans, cancelSubscription } from '../services/geminiService';

interface BillingPanelProps {
  isPremiumUser: boolean;
  refreshUser: () => Promise<void>;
  isOpen: boolean;
}

const BillingPanel: React.FC<BillingPanelProps> = ({ isPremiumUser, refreshUser, isOpen }) => {
    const [activeSubs, setActiveSubs] = useState<any[]>([]);
    const [isCancelling, setIsCancelling] = useState<string | null>(null);
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

    const handleCancel = async (subId: string, planName: string) => {
        if (window.confirm(`Are you sure you want to cancel your '${planName}' plan? This action is immediate and cannot be undone.`)) {
            setIsCancelling(subId);
            setError(null);
            try {
                await cancelSubscription(subId);
                // The webhook will update the state, but we can optimistically refresh
                await refreshUser();
            } catch (err: any) {
                setError(err.message || `Failed to cancel the '${planName}' plan.`);
            } finally {
                setIsCancelling(null);
            }
        }
    };

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
                                    <button 
                                        onClick={() => handleCancel(sub.id, sub.plan_name)}
                                        disabled={!!isCancelling}
                                        className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                                    >
                                        {isCancelling === sub.id ? 'Cancelling...' : 'Cancel'}
                                    </button>
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
